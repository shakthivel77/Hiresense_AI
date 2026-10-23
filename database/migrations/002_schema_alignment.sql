-- ============================================================================
-- Hiresense_AI Schema Alignment & Security Hardening
-- Migration: 002_schema_alignment.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Profiles Table Alignment & Auth Synchronization Trigger
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL;

-- Automatic profile creation trigger on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any existing auth.users that may have registered prior to trigger setup
INSERT INTO public.profiles (id, email, display_name, full_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'displayName', u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'displayName', u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'role', 'student')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. User Skills Schema Alignment (Support string skill identifiers)
-- ============================================================================
ALTER TABLE public.user_skills DROP CONSTRAINT IF EXISTS user_skills_skill_id_fkey;
ALTER TABLE public.user_skills ALTER COLUMN skill_id TYPE TEXT;

-- ============================================================================
-- 3. Question Banks, Tests, and Questions Alignment
-- ============================================================================
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_skill_id_fkey;
ALTER TABLE public.tests ALTER COLUMN skill_id TYPE TEXT;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_bank_id_fkey;
ALTER TABLE public.question_banks DROP CONSTRAINT IF EXISTS question_banks_skill_id_fkey;
ALTER TABLE public.question_banks ALTER COLUMN skill_id TYPE TEXT;
ALTER TABLE public.question_banks ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.questions ALTER COLUMN question_bank_id TYPE TEXT;

ALTER TABLE public.questions ADD CONSTRAINT questions_question_bank_id_fkey
    FOREIGN KEY (question_bank_id) REFERENCES public.question_banks(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. Interview Sessions Alignment
-- ============================================================================
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS domain_slug TEXT;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS current_question_index INT NOT NULL DEFAULT 0;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS total_questions INT NOT NULL DEFAULT 0;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS answered_questions INT NOT NULL DEFAULT 0;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================================
-- 5. Verification Proofs (Missing Module Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verification_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proof_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    attempt_id UUID,
    verification_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_hash TEXT NOT NULL,
    issuer TEXT NOT NULL DEFAULT 'Hiresense_AI Verification Authority',
    status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_proofs_user_id ON public.verification_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_proofs_proof_id ON public.verification_proofs(proof_id);

-- ============================================================================
-- 6. Job Postings (Missing Module Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Remote / Hybrid',
    employment_type TEXT NOT NULL DEFAULT 'full-time',
    experience_level TEXT NOT NULL DEFAULT 'mid',
    domain_slug TEXT NOT NULL,
    raw_description TEXT NOT NULL,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_domain_slug ON public.job_postings(domain_slug);

-- ============================================================================
-- 7. Row Level Security (RLS) Enablement & Policies
-- ============================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- User Skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own skills or verified skills" ON public.user_skills;
CREATE POLICY "Users can view own skills or verified skills"
    ON public.user_skills FOR SELECT
    USING (auth.uid() = user_id OR status = 'VERIFIED');

DROP POLICY IF EXISTS "Users can insert own skills" ON public.user_skills;
CREATE POLICY "Users can insert own skills"
    ON public.user_skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skills" ON public.user_skills;
CREATE POLICY "Users can update own skills"
    ON public.user_skills FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;
CREATE POLICY "Users can delete own skills"
    ON public.user_skills FOR DELETE
    USING (auth.uid() = user_id);

-- Domains, Roadmaps, Skills, Dependencies (Public Read-Only Taxonomy)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view domains" ON public.domains;
CREATE POLICY "Public can view domains" ON public.domains FOR SELECT USING (true);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view roadmaps" ON public.roadmaps;
CREATE POLICY "Public can view roadmaps" ON public.roadmaps FOR SELECT USING (true);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view skills" ON public.skills;
CREATE POLICY "Public can view skills" ON public.skills FOR SELECT USING (true);

ALTER TABLE public.skill_dependencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view skill dependencies" ON public.skill_dependencies;
CREATE POLICY "Public can view skill dependencies" ON public.skill_dependencies FOR SELECT USING (true);

-- Question Banks & Questions
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view question banks" ON public.question_banks;
CREATE POLICY "Authenticated users can view question banks" ON public.question_banks FOR SELECT TO authenticated USING (true);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;
CREATE POLICY "Authenticated users can view questions" ON public.questions FOR SELECT TO authenticated USING (true);

-- Tests & Test Attempts
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view tests" ON public.tests;
CREATE POLICY "Authenticated users can view tests" ON public.tests FOR SELECT TO authenticated USING (true);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.test_attempts;
CREATE POLICY "Users can view their own attempts" ON public.test_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.test_attempts;
CREATE POLICY "Users can insert their own attempts" ON public.test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own attempts" ON public.test_attempts;
CREATE POLICY "Users can update their own attempts" ON public.test_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Verification Proofs
ALTER TABLE public.verification_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view valid proofs" ON public.verification_proofs;
CREATE POLICY "Anyone can view valid proofs" ON public.verification_proofs FOR SELECT USING (status = 'VALID' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own proofs" ON public.verification_proofs;
CREATE POLICY "Users can insert their own proofs" ON public.verification_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job Analyses & Requirements
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own job analyses" ON public.job_analyses;
CREATE POLICY "Users can manage their own job analyses" ON public.job_analyses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their job requirements" ON public.job_requirements;
CREATE POLICY "Users can manage their job requirements" ON public.job_requirements FOR ALL
    USING (EXISTS (SELECT 1 FROM public.job_analyses ja WHERE ja.id = job_analysis_id AND ja.user_id = auth.uid()));

-- Job Postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view job postings" ON public.job_postings;
CREATE POLICY "Anyone can view job postings" ON public.job_postings FOR SELECT USING (true);

-- Interview Sessions & Answers
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage their interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view session questions" ON public.interview_questions;
CREATE POLICY "Users can view session questions" ON public.interview_questions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.interview_sessions isess WHERE isess.id = session_id AND isess.user_id = auth.uid()));

ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their interview answers" ON public.interview_answers;
CREATE POLICY "Users can manage their interview answers" ON public.interview_answers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.interview_questions iq
        JOIN public.interview_sessions isess ON isess.id = iq.session_id
        WHERE iq.id = question_id AND isess.user_id = auth.uid()
    ));

-- ============================================================================
-- 8. Seed Taxonomy Canonical Skills for Resume & Roadmaps
-- ============================================================================
INSERT INTO public.skills (id, slug, name, description, category, difficulty)
VALUES
    ('c1111111-0001-0000-0000-000000000001', 's1', 'Node.js Architecture', 'Server runtime, microservices, asynchronous design', 'backend', 'intermediate'),
    ('c1111111-0002-0000-0000-000000000002', 's2', 'PostgreSQL Indexing', 'Database indexing, query execution planning, and transactions', 'databases', 'advanced'),
    ('c1111111-0003-0000-0000-000000000003', 's3', 'REST API Security', 'JWT authentication, CORS, rate limiting, and API security', 'security', 'advanced'),
    ('c1111111-0004-0000-0000-000000000004', 's4', 'Redis Caching', 'In-memory data structures, distributed caching, pub/sub', 'databases', 'intermediate'),
    ('c1111111-0005-0000-0000-000000000005', 's5', 'Docker Containerization', 'Dockerfiles, container networking, multi-stage builds', 'devops', 'intermediate')
ON CONFLICT (slug) DO NOTHING;
