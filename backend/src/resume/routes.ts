import { Router, Request, Response } from 'express';
import { ResumeExtractor } from './resumeExtractor.js';
import { ResumeSkillExtractor } from './skillExtractor.js';
import { ResumeExtractionRequest } from './types.js';
import { requireAuth } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { skillService } from '../skills/service.js';
import { roadmapService } from '../roadmap/service.js';

export const resumeRouter = Router();

/**
 * POST /api/resume/extract-text
 * Accepts Base64 file stream or raw text payload, normalizes text and segments sections.
 */
resumeRouter.post('/extract-text', (req: Request, res: Response) => {
  try {
    const payload: ResumeExtractionRequest = req.body;

    if (!payload || (!payload.rawText && !payload.fileBase64)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYLOAD',
          message: 'Please provide either rawText or fileBase64 in the request body.',
        },
      });
    }

    const result = ResumeExtractor.processResume(payload);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: err.message || 'Failed to process resume text extraction.',
      },
    });
  }
});

/**
 * POST /api/resume/parse-raw
 * Convenience endpoint for pasted candidate resumes.
 */
resumeRouter.post('/parse-raw', (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_TEXT',
          message: 'Resume text is required and cannot be empty.',
        },
      });
    }

    const result = ResumeExtractor.processResume({ rawText: text, mimeType: 'text/plain' });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PARSE_FAILED',
        message: err.message || 'Failed to parse resume text.',
      },
    });
  }
});

/**
 * POST /api/resume/extract-skills
 * Extracts canonical skills matching Hiresense taxonomy from resume text or sections.
 */
resumeRouter.post('/extract-skills', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.startsWith('mock-token-')) {
        userId = token.replace('mock-token-', '');
      }
    }

    const { rawText, fileBase64, sections } = req.body;

    let extractionResult: any;

    if (sections) {
      extractionResult = {
        success: true,
        rawTextLength: 0,
        normalizedText: '',
        sections,
        extractedAt: new Date().toISOString(),
      };
    } else if (rawText || fileBase64) {
      extractionResult = ResumeExtractor.processResume({ rawText, fileBase64 });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYLOAD',
          message: 'Please provide rawText, fileBase64, or parsed sections to extract skills.',
        },
      });
    }

    const result = ResumeSkillExtractor.extractSkillsFromResume(extractionResult, userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SKILL_EXTRACTION_FAILED',
        message: err.message || 'Failed to extract skills from resume.',
      },
    });
  }
});

/**
 * POST /api/resume/import-claims
 * Protected endpoint to persist unverified skill claims into authenticated candidate profile.
 */
resumeRouter.post('/import-claims', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user identity could not be verified.',
        },
      });
    }

    const { userId, claims } = req.body;

    // Reject mismatch if client explicitly supplies a conflicting target userId
    if (userId && typeof userId === 'string' && userId !== authUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'User ID mismatch: cannot import claims for another user.',
        },
      });
    }

    // Validate claims payload
    if (!Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLAIMS_PAYLOAD',
          message: 'claims must be a non-empty array of skill claims.',
        },
      });
    }

    // Validate individual claim items and skill identifiers
    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      if (!claim || typeof claim !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CLAIM_ITEM',
            message: `Claim at index ${i} is not a valid object.`,
          },
        });
      }

      if (
        !claim.skillId ||
        typeof claim.skillId !== 'string' ||
        claim.skillId.trim().length === 0 ||
        claim.skillId.trim().length > 64 ||
        !/^[a-zA-Z0-9_\-]+$/.test(claim.skillId.trim())
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SKILL_ID',
            message: `Claim at index ${i} contains a malformed or invalid skillId.`,
          },
        });
      }

      const trimmedSkillId = claim.skillId.trim();
      const isRecognizedSkill =
        ResumeSkillExtractor.hasSkillId(trimmedSkillId) ||
        Boolean(roadmapService.getSkillById(trimmedSkillId));

      if (!isRecognizedSkill) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SKILL_ID',
            message: `Skill ID '${trimmedSkillId}' is not recognized in the skills taxonomy.`,
          },
        });
      }
    }

    // Persist each validated claim into the skill store
    const persistedClaims = [];
    for (const claim of claims) {
      const trimmedSkillId = claim.skillId.trim();
      try {
        const persisted = await skillService.claimSkill(authUserId, trimmedSkillId, 'UNVERIFIED');
        persistedClaims.push({
          skillId: persisted.skillId,
          skillName: claim.skillName || trimmedSkillId,
          category: claim.category || 'core',
          domainSlug: claim.domainSlug || 'general',
          difficulty: claim.difficulty || 'intermediate',
          status: 'UNVERIFIED' as const,
          verificationScore: null,
          claimedAt: persisted.createdAt,
        });
      } catch (err: any) {
        console.error(`[ResumeRouter] Failed to persist claim '${trimmedSkillId}':`, err);
      }
    }

    if (claims.length > 0 && persistedClaims.length === 0) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERSISTENCE_FAILED',
          message: 'Failed to persist skill claims to store.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: authUserId,
        importedCount: persistedClaims.length,
        claims: persistedClaims,
        invariantNotice:
          'Imported claims are stored strictly as UNVERIFIED. Candidates must take a proctored assessment to achieve verification.',
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_FAILED',
        message: err.message || 'Failed to import skill claims.',
      },
    });
  }
});

