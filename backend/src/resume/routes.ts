import { Router, Request, Response } from 'express';
import { ResumeExtractor } from './resumeExtractor.js';
import { ResumeSkillExtractor } from './skillExtractor.js';
import { ResumeExtractionRequest } from './types.js';

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
 * Stamped import of unverified skill claims into candidate profile.
 */
resumeRouter.post('/import-claims', (req: Request, res: Response) => {
  try {
    const { userId, claims } = req.body;

    if (!userId || !Array.isArray(claims)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLAIMS_PAYLOAD',
          message: 'userId and claims array are required.',
        },
      });
    }

    // Explicitly enforce that all imported claims have UNVERIFIED status and verificationScore = null
    const sanitizedClaims = claims.map((c: any) => ({
      ...c,
      status: 'UNVERIFIED',
      verificationScore: null,
      claimedAt: new Date().toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        userId,
        importedCount: sanitizedClaims.length,
        claims: sanitizedClaims,
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

