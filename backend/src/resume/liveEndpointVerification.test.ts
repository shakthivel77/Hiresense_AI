import express from 'express';
import { resumeRouter } from './routes.js';
import http from 'http';

export function runLiveEndpointVerification() {
  console.log('--- STARTING LIVE RESUME REST ENDPOINT VERIFICATION ---');

  const app = express();
  app.use(express.json());
  app.use('/api/resume', resumeRouter);

  const server = http.createServer(app);
  server.listen(5144, async () => {
    try {
      // 1. Test POST /api/resume/extract-text
      console.log('1. Testing POST /api/resume/extract-text...');
      const textRes = await fetch('http://localhost:5144/api/resume/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `Alex Rivera
Senior Software Engineer
alex.rivera@example.com | (555) 987-6543
https://github.com/alexrivera

EXPERIENCE
AI Scale Labs - Lead AI Engineer
- Architected enterprise real-time recommendation engines using PyTorch and Node.js microservices.
- Hardened backend REST API security utilizing JWT bearer authentication.
- Decreased query latency through PostgreSQL indexing optimization and Redis caching layer.
- Containerized full-stack services using Docker.`,
          mimeType: 'text/plain',
        }),
      });

      const textJson = (await textRes.json()) as any;
      if (!textRes.ok || !textJson.success) {
        throw new Error('extract-text endpoint failed');
      }
      console.log('Text Extraction HTTP:', textRes.status, 'Success:', textJson.success);
      console.log('Extracted Contact:', textJson.data.sections.contact);

      // 2. Test POST /api/resume/extract-skills
      console.log('2. Testing POST /api/resume/extract-skills...');
      const skillsRes = await fetch('http://localhost:5144/api/resume/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textJson.data.normalizedText,
          sections: textJson.data.sections,
        }),
      });

      const skillsJson = (await skillsRes.json()) as any;
      if (!skillsRes.ok || !skillsJson.success) {
        throw new Error('extract-skills endpoint failed');
      }
      console.log('Skill Extraction HTTP:', skillsRes.status, 'Success:', skillsJson.success, 'Total claims:', skillsJson.data.totalClaimsFound);
      console.log('Matched skills:', skillsJson.data.matchedTaxonomySkills.map((s: any) => `${s.skillName} (${s.status})`));

      // 3. Test POST /api/resume/import-claims
      console.log('3. Testing POST /api/resume/import-claims without auth (should reject with 401)...');
      const unauthRes = await fetch('http://localhost:5144/api/resume/import-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claims: skillsJson.data.matchedTaxonomySkills,
        }),
      });
      if (unauthRes.status !== 401) {
        throw new Error(`Expected 401 for unauthenticated import, got ${unauthRes.status}`);
      }
      console.log('Unauthenticated rejection verified: HTTP 401');

      console.log('3b. Testing POST /api/resume/import-claims with Bearer mock-dev-token...');
      const importRes = await fetch('http://localhost:5144/api/resume/import-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-dev-token',
        },
        body: JSON.stringify({
          claims: skillsJson.data.matchedTaxonomySkills,
        }),
      });

      const importJson = (await importRes.json()) as any;
      if (!importRes.ok || !importJson.success) {
        throw new Error('import-claims endpoint failed');
      }
      console.log('Import Claims HTTP:', importRes.status, 'Success:', importJson.success, 'Imported count:', importJson.data.importedCount);

      const allUnverified = importJson.data.claims.every(
        (c: any) => c.status === 'UNVERIFIED' && c.verificationScore === null
      );
      if (!allUnverified) {
        throw new Error('INVARIANT VIOLATION: Some imported claims have status other than UNVERIFIED');
      }
      console.log('CRITICAL INVARIANT VERIFIED: All imported claims are UNVERIFIED with null scores.');

      server.close(() => {
        console.log('--- ALL LIVE ENDPOINT VERIFICATIONS PASSED SUCCESSFULLY ---');
      });
    } catch (err) {
      console.error('Endpoint verification failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

runLiveEndpointVerification();
