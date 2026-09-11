import {
  ResumeExtractionRequest,
  ResumeSectionBreakdown,
  ResumeExtractionResultDTO,
  ExtractedContactInfo,
  ExtractedExperienceItem,
  ExtractedEducationItem,
  ExtractedProjectItem,
} from './types.js';

export class ResumeExtractor {
  /**
   * Main entry point to extract, sanitize, and segment resume text.
   */
  public static processResume(payload: ResumeExtractionRequest): ResumeExtractionResultDTO {
    const rawText = this.extractRawText(payload);
    const normalizedText = this.sanitizeText(rawText);
    const sections = this.segmentResume(normalizedText);

    return {
      success: true,
      rawTextLength: rawText.length,
      normalizedText,
      sections,
      extractedAt: new Date().toISOString(),
      warningNotice:
        'All extracted skills and experience items are candidate self-claims and classified as UNVERIFIED until verified through proctored assessment.',
    };
  }

  /**
   * Decodes input payload whether supplied as raw text or Base64 file stream.
   */
  public static extractRawText(payload: ResumeExtractionRequest): string {
    if (payload.rawText && payload.rawText.trim().length > 0) {
      return payload.rawText;
    }

    if (payload.fileBase64 && payload.fileBase64.trim().length > 0) {
      try {
        const buffer = Buffer.from(payload.fileBase64, 'base64');
        const mime = payload.mimeType || '';

        // If plain text or markdown
        if (mime.includes('text') || mime.includes('markdown') || !mime.includes('pdf')) {
          return buffer.toString('utf-8');
        }

        // PDF text stream decoding fallback
        return this.decodePdfBuffer(buffer);
      } catch (err: any) {
        console.warn('Failed to decode Base64 payload', err);
        return '';
      }
    }

    return '';
  }

  /**
   * Extracts text streams from PDF binary buffers without external heavy dependencies.
   */
  private static decodePdfBuffer(buffer: Buffer): string {
    const rawContent = buffer.toString('latin1');
    const textPieces: string[] = [];

    // 1. Extract text inside BT (Begin Text) and ET (End Text) operators
    const btEtRegex = /BT[\s\S]*?ET/g;
    let match: RegExpExecArray | null;

    while ((match = btEtRegex.exec(rawContent)) !== null) {
      const block = match[0];
      // Match Tj (string) or TJ (array of strings) operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        textPieces.push(tjMatch[1]);
      }

      // TJ array regex: [(str) 10 (str2)] TJ
      const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
      let arrMatch: RegExpExecArray | null;
      while ((arrMatch = arrayTjRegex.exec(block)) !== null) {
        const inner = arrMatch[1];
        const innerStrs = inner.match(/\((.*?)\)/g);
        if (innerStrs) {
          innerStrs.forEach((s) => textPieces.push(s.replace(/^\(|\)$/g, '')));
        }
      }
    }

    if (textPieces.length > 0) {
      return textPieces.join(' ');
    }

    // Fallback: search for plain text chunks
    const cleanChars = rawContent
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanChars;
  }

  /**
   * Sanitizes text, normalizes line breaks, and standardizes list bullets.
   */
  public static sanitizeText(text: string): string {
    if (!text) return '';

    return text
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Clean null bytes and non-printable control characters (except newline/tab)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Strip potential script or HTML tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      // Standardize fancy Unicode bullets to markdown dash
      .replace(/[•▪●★►◆▶]/g, '- ')
      // Standardize dashes
      .replace(/[–—]/g, '-')
      // Normalize excessive consecutive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Segments sanitized plain text into structured sections.
   */
  public static segmentResume(text: string): ResumeSectionBreakdown {
    const contact = this.extractContactInfo(text);
    const sectionMap = this.splitIntoSections(text);

    return {
      contact,
      summary: sectionMap.get('summary'),
      experience: this.parseExperience(sectionMap.get('experience') || ''),
      education: this.parseEducation(sectionMap.get('education') || ''),
      rawSkillsText: this.parseSkills(sectionMap.get('skills') || ''),
      projects: this.parseProjects(sectionMap.get('projects') || ''),
      certifications: this.parseCertifications(sectionMap.get('certifications') || ''),
    };
  }

  /**
   * Extracts contact information (Email, Phone, LinkedIn, GitHub, Name).
   */
  private static extractContactInfo(text: string): ExtractedContactInfo {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i;
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)/i;
    const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:io|dev|me|app|com))(?:\/[^\s]*)?/i;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const githubMatch = text.match(githubRegex);
    const linkedinMatch = text.match(linkedinRegex);
    const portfolioMatch = text.match(portfolioRegex);

    // Name heuristic: first line of text before any section headers or contacts
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    let name: string | undefined = undefined;

    if (lines.length > 0) {
      const firstLine = lines[0];
      // If first line is reasonably short and doesn't look like an email or heading
      if (
        firstLine.length < 50 &&
        !firstLine.includes('@') &&
        !firstLine.toLowerCase().includes('resume') &&
        !firstLine.toLowerCase().includes('curriculum vitae')
      ) {
        name = firstLine;
      }
    }

    return {
      name,
      email: emailMatch ? emailMatch[1] : undefined,
      phone: phoneMatch ? phoneMatch[0].trim() : undefined,
      githubUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
      linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined,
      portfolioUrl: portfolioMatch && !portfolioMatch[0].includes('github') && !portfolioMatch[0].includes('linkedin')
        ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`)
        : undefined,
    };
  }

  /**
   * Splits normalized text by section headings.
   */
  private static splitIntoSections(text: string): Map<string, string> {
    const sectionMap = new Map<string, string>();
    const sectionHeaders = [
      { key: 'summary', regex: /(?:^|\n)(?:summary|professional summary|executive summary|about me|profile|objective)(?::|\n|$)/i },
      { key: 'experience', regex: /(?:^|\n)(?:work experience|experience|employment history|work history|professional experience)(?::|\n|$)/i },
      { key: 'education', regex: /(?:^|\n)(?:education|academic background|qualifications|academic history)(?::|\n|$)/i },
      { key: 'skills', regex: /(?:^|\n)(?:skills|technical skills|skills & technologies|technologies|core competencies|competencies)(?::|\n|$)/i },
      { key: 'projects', regex: /(?:^|\n)(?:projects|personal projects|key projects|featured projects|portfolio)(?::|\n|$)/i },
      { key: 'certifications', regex: /(?:^|\n)(?:certifications|licenses & certifications|credentials|courses)(?::|\n|$)/i },
    ];

    // Find indices of all matched section headers
    const matches: Array<{ key: string; index: number; length: number }> = [];

    sectionHeaders.forEach(({ key, regex }) => {
      const match = regex.exec(text);
      if (match) {
        matches.push({ key, index: match.index, length: match[0].length });
      }
    });

    // Sort matches by appearance in the document
    matches.sort((a, b) => a.index - b.index);

    // Extract slices between consecutive headers
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const start = current.index + current.length;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const sectionBody = text.slice(start, end).trim();
      sectionMap.set(current.key, sectionBody);
    }

    return sectionMap;
  }

  /**
   * Parses work experience block into structured items.
   */
  private static parseExperience(text: string): ExtractedExperienceItem[] {
    if (!text.trim()) return [];

    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const items: ExtractedExperienceItem[] = [];

    let currentItem: ExtractedExperienceItem | null = null;
    const dateRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\d{4}\s*(?:-|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:\d{4}|Present|Current)/i;

    lines.forEach((line) => {
      const isBullet = line.startsWith('-') || line.startsWith('*');

      if (isBullet) {
        if (currentItem) {
          const cleanBullet = line.replace(/^[-*]\s*/, '').trim();
          if (cleanBullet.length > 0) {
            currentItem.bullets.push(cleanBullet);
          }
        }
        return;
      }

      // Check if line is purely a date line (e.g. "Jan 2022 - Present")
      const dateMatch = line.match(dateRegex);
      const isStandaloneDate = dateMatch && line.length < 40 && (!line.includes('|') && !line.includes('Engineer') && !line.includes('Developer') && !line.includes('Manager'));

      if (isStandaloneDate && currentItem && !currentItem.duration) {
        currentItem.duration = dateMatch[0];
        return;
      }

      // Otherwise it's a new company / role header
      if (currentItem) {
        items.push(currentItem);
      }

      const parts = line.split(/[|–-]/).map((p) => p.trim());
      const company = parts[0] || 'Unknown Organization';
      const role = parts.length > 1 ? parts[1] : 'Software Engineer';

      currentItem = {
        company,
        role,
        duration: dateMatch ? dateMatch[0] : undefined,
        bullets: [],
      };
    });

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }

  /**
   * Parses education section into institutions and degrees.
   */
  private static parseEducation(text: string): ExtractedEducationItem[] {
    if (!text.trim()) return [];

    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const items: ExtractedEducationItem[] = [];

    lines.forEach((line) => {
      const yearRegex = /\b(19\d{2}|20\d{2})\b/;
      const yearMatch = line.match(yearRegex);

      const degreeKeywords = ['B.Tech', 'B.S.', 'B.E.', 'M.S.', 'M.Tech', 'Bachelor', 'Master', 'Ph.D.', 'Associate', 'Degree', 'Computer Science'];
      const foundDegree = degreeKeywords.find((d) => line.toLowerCase().includes(d.toLowerCase()));

      const parts = line.split(/[|,–-]/).map((p) => p.trim());
      const institution = parts[0] || line;

      items.push({
        institution,
        degree: foundDegree || (parts.length > 1 ? parts[1] : undefined),
        year: yearMatch ? yearMatch[0] : undefined,
      });
    });

    return items.slice(0, 5);
  }

  /**
   * Parses raw skills section into individual tokenized skill terms.
   */
  private static parseSkills(text: string): string[] {
    if (!text.trim()) return [];

    const lines = text.split('\n');
    const skillTokens = new Set<string>();

    lines.forEach((line) => {
      // Remove prefixes like "Languages:", "Frontend:", "Databases:"
      const cleanLine = line.replace(/^[A-Za-z\s&/]+:\s*/, '').replace(/^[-*]\s*/, '');
      const tokens = cleanLine.split(/[,|•;·/]/).map((t) => t.trim()).filter((t) => t.length > 1 && t.length < 40);
      tokens.forEach((tok) => skillTokens.add(tok));
    });

    return Array.from(skillTokens);
  }

  /**
   * Parses projects section into titles, technologies, and bullet points.
   */
  private static parseProjects(text: string): ExtractedProjectItem[] {
    if (!text.trim()) return [];

    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const projects: ExtractedProjectItem[] = [];
    let currentProject: ExtractedProjectItem | null = null;

    lines.forEach((line) => {
      const isBullet = line.startsWith('-') || line.startsWith('*');

      if (!isBullet && line.length < 90) {
        if (currentProject) {
          projects.push(currentProject);
        }

        const techRegex = /\[(.*?)\]|\((.*?)\)|\|(.*)/;
        const techMatch = line.match(techRegex);
        let technologies: string[] = [];

        if (techMatch) {
          const techString = techMatch[1] || techMatch[2] || techMatch[3] || '';
          technologies = techString.split(/[,/|]/).map((t) => t.trim()).filter((t) => t.length > 0);
        }

        const title = line.replace(techRegex, '').replace(/[-–]/, '').trim();

        currentProject = {
          title: title || 'Project',
          technologies,
          description: '',
        };
      } else if (currentProject) {
        const cleanLine = line.replace(/^[-*]\s*/, '').trim();
        currentProject.description = currentProject.description
          ? `${currentProject.description} ${cleanLine}`
          : cleanLine;
      }
    });

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  /**
   * Parses certifications section.
   */
  private static parseCertifications(text: string): string[] {
    if (!text.trim()) return [];

    return text
      .split('\n')
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter((l) => l.length > 2 && l.length < 120);
  }
}
