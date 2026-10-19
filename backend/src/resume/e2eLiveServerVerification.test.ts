async function testLive5000() {
  console.log('=== VERIFYING LIVE APPLICATION SERVER (PORT 5000) ===');

  const baseUrl = 'http://localhost:5000';
  const token = 'mock-dev-token';

  // 1. Health check
  console.log('1. Health check...');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthJson = await healthRes.json();
  console.log('Health status:', healthRes.status, 'Data:', healthJson);
  if (!healthRes.ok) throw new Error('Health check failed');

  // 2. Extract Text
  console.log('2. Testing POST /api/resume/extract-text...');
  const sampleResume = `Alex Rivera
alex.rivera@example.com | (555) 987-6543
https://github.com/alexrivera

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python
Frameworks: Node.js, Express, React, Next.js, PyTorch
Databases: PostgreSQL, Redis Cluster
DevOps: Docker, Kubernetes

EXPERIENCE
AI Scale Labs - Lead AI Engineer
- Architected enterprise real-time recommendation engines using PyTorch and Node.js microservices.
- Hardened backend REST API security utilizing JWT bearer authentication.
- Decreased query latency by 45% through PostgreSQL indexing optimization and Redis caching.
- Containerized full-stack services using Docker.`;

  const extractTextRes = await fetch(`${baseUrl}/api/resume/extract-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText: sampleResume, mimeType: 'text/plain' }),
  });
  const extractTextJson = (await extractTextRes.json()) as any;
  console.log('Extract text status:', extractTextRes.status, 'Success:', extractTextJson.success);
  if (!extractTextRes.ok || !extractTextJson.success) throw new Error('Text extraction failed');

  // 3. Extract Skills
  console.log('3. Testing POST /api/resume/extract-skills...');
  const extractSkillsRes = await fetch(`${baseUrl}/api/resume/extract-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rawText: extractTextJson.data.normalizedText,
      sections: extractTextJson.data.sections,
    }),
  });
  const extractSkillsJson = (await extractSkillsRes.json()) as any;
  console.log('Extract skills status:', extractSkillsRes.status, 'Total claims found:', extractSkillsJson.data?.totalClaimsFound);
  if (!extractSkillsRes.ok || !extractSkillsJson.success) throw new Error('Skill extraction failed');

  const claims = extractSkillsJson.data.matchedTaxonomySkills;

  // 4. Test Unauthenticated Import Rejection
  console.log('4. Testing POST /api/resume/import-claims without Auth (should fail with 401)...');
  const unauthRes = await fetch(`${baseUrl}/api/resume/import-claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claims }),
  });
  console.log('Unauth import status:', unauthRes.status);
  if (unauthRes.status !== 401) throw new Error(`Expected 401 for unauth import, got ${unauthRes.status}`);

  // 5. Test Authenticated User Ownership Mismatch
  console.log('5. Testing POST /api/resume/import-claims with mismatched userId (should fail with 403)...');
  const mismatchRes = await fetch(`${baseUrl}/api/resume/import-claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: 'different-user-account-id',
      claims,
    }),
  });
  console.log('Mismatch import status:', mismatchRes.status);
  if (mismatchRes.status !== 403) throw new Error(`Expected 403 for mismatched userId, got ${mismatchRes.status}`);

  // 6. Test Valid Authenticated Import
  console.log('6. Testing POST /api/resume/import-claims with Bearer token...');
  const importRes = await fetch(`${baseUrl}/api/resume/import-claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ claims }),
  });
  const importJson = (await importRes.json()) as any;
  console.log('Import claims status:', importRes.status, 'Imported count:', importJson.data?.importedCount);
  if (!importRes.ok || !importJson.success) throw new Error('Import claims failed');

  // Verify all claims in response are UNVERIFIED with null scores
  const allUnverified = importJson.data.claims.every(
    (c: any) => c.status === 'UNVERIFIED' && c.verificationScore === null
  );
  if (!allUnverified) throw new Error('Imported claims contained non-UNVERIFIED or scored records');

  // 7. Test Retrieval via GET /api/skills/my-skills
  console.log('7. Testing GET /api/skills/my-skills to verify persisted claims...');
  const mySkillsRes = await fetch(`${baseUrl}/api/skills/my-skills`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const mySkillsJson = (await mySkillsRes.json()) as any;
  console.log('my-skills status:', mySkillsRes.status, 'User skills count:', mySkillsJson.data?.skills?.length);
  if (!mySkillsRes.ok || !mySkillsJson.success) throw new Error('Failed to retrieve user skills');

  const mySkillIds = mySkillsJson.data.skills.map((s: any) => s.skillId);
  console.log('Persisted user skill IDs:', mySkillIds);
  if (!mySkillIds.includes('s1') || !mySkillIds.includes('s2')) {
    throw new Error('Persisted skill list missing expected imported claims');
  }

  // 8. Test Verified Profile View
  console.log('8. Testing GET /api/skills/verified-profile...');
  const profileRes = await fetch(`${baseUrl}/api/skills/verified-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profileJson = (await profileRes.json()) as any;
  console.log('Profile status:', profileRes.status, 'Claimed count:', profileJson.data?.totalClaimedSkills, 'Verified count:', profileJson.data?.totalVerifiedSkills);
  if (profileJson.data?.totalVerifiedSkills !== 0) {
    throw new Error('Unverified claims incorrectly counted as verified in profile view');
  }
  if (profileJson.data?.totalClaimedSkills < claims.length) {
    throw new Error('Profile totalClaimedSkills does not reflect imported claims');
  }

  console.log('\n=== LIVE APPLICATION SERVER E2E VERIFICATION COMPLETED SUCCESSFULLY ===');
}

testLive5000().catch((err) => {
  console.error('LIVE VERIFICATION ERROR:', err);
  process.exit(1);
});
