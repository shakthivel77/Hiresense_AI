import { ResumeExtractor } from './resumeExtractor.js';

function runUnit46Verification() {
  console.log('--- STARTING UNIT 46 RESUME TEXT EXTRACTION VERIFICATION ---');

  const sampleResumeText = `
Jane Doe
Senior Full-Stack Engineer
Email: jane.doe@example.com | Phone: (555) 123-4567
https://github.com/janedoe | https://linkedin.com/in/janedoe

SUMMARY
Versatile Software Engineer with 4+ years of experience building scalable distributed web platforms and real-time APIs.

WORK EXPERIENCE
Acme Corp - Senior Software Engineer
Jan 2022 - Present
• Spearheaded migration of legacy monolith to Node.js & TypeScript microservices.
• Optimized PostgreSQL query performance and indexing, reducing latency by 45%.
• Integrated Redis distributed caching cluster handling 10k requests/sec.

TechStart Inc - Software Developer
Jun 2020 - Dec 2021
• Developed responsive UI components with React and Tailwind CSS.
• Built RESTful API endpoints and implemented JWT-based authentication.

EDUCATION
Stanford University | B.S. Computer Science | 2020

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Backend: Node.js, Express, PostgreSQL, Redis, Docker
Frontend: React, Tailwind CSS, Next.js

PROJECTS
CloudScale Platform [React, Node.js, Docker]
- Designed and launched open-source cloud monitoring tool with 1,200 GitHub stars.
- Implemented real-time telemetry pipelines using WebSockets.

CERTIFICATIONS
- AWS Certified Solutions Architect Associate
- Docker Certified Associate
  `;

  // 1. Verify text processing
  console.log('1. Processing sample plain text resume...');
  const result = ResumeExtractor.processResume({
    rawText: sampleResumeText,
    mimeType: 'text/plain',
  });

  if (!result.success) {
    throw new Error('Resume processing returned unsuccessful status');
  }
  console.log(`Normalized text length: ${result.normalizedText.length} characters.`);

  // 2. Verify Contact Info Extraction
  console.log('2. Verifying Contact Extraction...');
  const { contact } = result.sections;
  console.log('Extracted Contact:', contact);

  if (contact.email !== 'jane.doe@example.com') {
    throw new Error(`Expected email jane.doe@example.com, got: ${contact.email}`);
  }
  if (!contact.phone || !contact.phone.includes('123-4567')) {
    throw new Error(`Expected phone containing 123-4567, got: ${contact.phone}`);
  }
  if (contact.githubUrl !== 'https://github.com/janedoe') {
    throw new Error(`Expected github url https://github.com/janedoe, got: ${contact.githubUrl}`);
  }
  if (contact.linkedinUrl !== 'https://linkedin.com/in/janedoe') {
    throw new Error(`Expected linkedin url https://linkedin.com/in/janedoe, got: ${contact.linkedinUrl}`);
  }

  // 3. Verify Experience Segmentation
  console.log('3. Verifying Work Experience Items...');
  const { experience } = result.sections;
  console.log(`Extracted ${experience.length} experience item(s).`);
  if (experience.length !== 2) {
    throw new Error(`Expected 2 experience items, got ${experience.length}`);
  }
  if (!experience[0].company.includes('Acme')) {
    throw new Error(`Expected first company Acme Corp, got ${experience[0].company}`);
  }
  if (experience[0].bullets.length < 2) {
    throw new Error(`Expected at least 2 bullets in first role, got ${experience[0].bullets.length}`);
  }

  // 4. Verify Education Segmentation
  console.log('4. Verifying Education...');
  const { education } = result.sections;
  console.log('Extracted Education:', education);
  if (education.length === 0 || !education[0].institution.includes('Stanford')) {
    throw new Error('Education parsing failed for Stanford University');
  }

  // 5. Verify Skills Token Extraction
  console.log('5. Verifying Skills Token Parsing...');
  const { rawSkillsText } = result.sections;
  console.log(`Extracted ${rawSkillsText.length} skill terms:`, rawSkillsText);
  if (rawSkillsText.length < 5) {
    throw new Error('Skills token extraction extracted too few tokens');
  }
  const hasTypeScript = rawSkillsText.some((s) => s.toLowerCase().includes('typescript'));
  if (!hasTypeScript) {
    throw new Error('TypeScript not found in extracted skills');
  }

  // 6. Verify Projects Segmentation
  console.log('6. Verifying Projects...');
  const { projects } = result.sections;
  console.log('Extracted Projects:', projects);
  if (projects.length === 0 || !projects[0].title.includes('CloudScale')) {
    throw new Error('Project extraction failed for CloudScale Platform');
  }

  // 7. Verify Base64 decoding path
  console.log('7. Verifying Base64 payload decoding...');
  const base64Encoded = Buffer.from(sampleResumeText, 'utf-8').toString('base64');
  const base64Result = ResumeExtractor.processResume({
    fileBase64: base64Encoded,
    mimeType: 'text/plain',
  });
  if (base64Result.sections.contact.email !== 'jane.doe@example.com') {
    throw new Error('Base64 stream decoding failed');
  }

  // 8. Invariant Check: Verify Unverified Warning Notice
  console.log('8. Checking Invariant Warning Notice...');
  if (!result.warningNotice?.includes('UNVERIFIED')) {
    throw new Error('Missing strict UNVERIFIED invariant notice');
  }

  console.log('--- ALL UNIT 46 VERIFICATIONS PASSED SUCCESSFULLY ---');
}

runUnit46Verification();
