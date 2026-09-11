import { ResumeSkillExtractor } from './skillExtractor.js';
import { ResumeExtractor } from './resumeExtractor.js';

function runUnit47Verification() {
  console.log('--- STARTING UNIT 47 RESUME SKILL EXTRACTION VERIFICATION ---');

  const sampleResume = `
Alex Rivera
Full Stack AI Developer
alex.rivera@example.com | (555) 987-6543
https://github.com/alexrivera | https://linkedin.com/in/alexrivera

SUMMARY
Innovative engineer with extensive background in React, Node.js, and PyTorch deep learning systems.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python
Frameworks: Express.js, ReactJS, Next.js, PyTorch
Databases: PostgreSQL, Redis Cluster, Pinecone Vector DB
Infrastructure: Docker Containers, Kubernetes

EXPERIENCE
AI Scale Labs - Lead AI Engineer
2022 - Present
- Architected data pipeline engineering with Kafka and PyTorch for real-time recommendation engines.
- Built vector embeddings search using Pinecone and ChromaDB for semantic question answering.
- Secured backend REST APIs with JWT and role-based access control.

CloudCore Technologies - Backend Developer
2020 - 2022
- Optimized PostgreSQL indexing and query performance.
- Containerized microservices using Docker and orchestrated deployments.

PROJECTS
SmartChat AI [React, Node.js, Docker, Vector Embeddings]
- End-to-end RAG assistant utilizing vector database search and LLM context injection.
  `;

  // 1. Run extraction from raw text
  console.log('1. Extracting skills from resume text...');
  const extractionResult = ResumeSkillExtractor.extractSkillsFromRawText(sampleResume, 'user-alex-123');

  if (!extractionResult.success) {
    throw new Error('Resume skill extraction returned unsuccessful status');
  }

  console.log(`Extracted ${extractionResult.totalClaimsFound} taxonomy skill claims.`);

  const { matchedTaxonomySkills, unmappedKeywords, candidateProfileUpdate } = extractionResult;

  // 2. Verify Matched Skills
  const matchedSkillIds = matchedTaxonomySkills.map((s) => s.skillId);
  console.log('Matched skill IDs:', matchedSkillIds);

  const expectedSkills = ['s1', 's2', 's3', 's4', 's5', 's7', 's8', 's9', 's10', 's11', 's14']; // Node, Postgres, REST Security, Redis, Docker, PyTorch, Data Pipeline, Vector Embeddings, React, TypeScript, JWT Auth
  expectedSkills.forEach((skillId) => {
    if (!matchedSkillIds.includes(skillId)) {
      console.warn(`Note: skill ${skillId} was expected in taxonomy match list.`);
    }
  });

  if (matchedTaxonomySkills.length < 7) {
    throw new Error(`Expected at least 7 matched skills, got ${matchedTaxonomySkills.length}`);
  }

  // 3. Strict Invariant Verification
  console.log('2. Verifying UNVERIFIED Status Invariant on all claims...');
  matchedTaxonomySkills.forEach((claim) => {
    if (claim.status !== 'UNVERIFIED') {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Skill ${claim.skillName} has status ${claim.status} instead of UNVERIFIED`);
    }
    if (claim.verificationScore !== null) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Skill ${claim.skillName} has verificationScore ${claim.verificationScore} instead of null`);
    }
    if (!claim.domainSlug || !claim.category || !claim.difficulty) {
      throw new Error(`Skill claim ${claim.skillName} missing domain taxonomy metadata`);
    }
  });
  console.log('All claims strictly stamped as UNVERIFIED with null scores.');

  // 4. Verify Recommended Assessment Skills
  console.log('3. Verifying Diagnostic Recommendations...');
  console.log('Recommended diagnostic skills:', candidateProfileUpdate.recommendedAssessmentSkillIds);
  if (candidateProfileUpdate.recommendedAssessmentSkillIds.length === 0) {
    throw new Error('Recommended assessment skill IDs should not be empty');
  }

  // 5. Verify Invariant Notice in Response
  console.log('4. Verifying Invariant Notice string...');
  if (!extractionResult.invariantNotice.includes('UNVERIFIED')) {
    throw new Error('Invariant notice missing from skill extraction response');
  }

  console.log('--- ALL UNIT 47 VERIFICATIONS PASSED SUCCESSFULLY ---');
}

runUnit47Verification();
