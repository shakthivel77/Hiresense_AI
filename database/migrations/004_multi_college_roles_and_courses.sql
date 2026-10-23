-- ============================================================================
-- Hiresense_AI Multi-College Role-Based Platform & Centralized Content
-- Migration: 004_multi_college_roles_and_courses.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Colleges Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    domain TEXT, -- e.g. "stanford.edu"
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_status ON public.colleges(status);
CREATE INDEX IF NOT EXISTS idx_colleges_code ON public.colleges(code);

-- ============================================================================
-- 2. Profiles Table Alignment (Roles & College Affiliation)
-- ============================================================================
-- Update role check constraint on profiles to support canonical enterprise roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('STUDENT', 'MONITORING_ADMIN', 'MAIN_ADMIN', 'student', 'professional', 'admin'));

-- Add college affiliation fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliation_status TEXT NOT NULL DEFAULT 'UNCLAIMED'
    CHECK (affiliation_status IN ('UNCLAIMED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_college_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS official_college_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliation_status ON public.profiles(affiliation_status);

-- ============================================================================
-- 3. Monitoring Admin College Assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.monitoring_admin_colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admin_college UNIQUE (admin_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_mac_admin_id ON public.monitoring_admin_colleges(admin_id);
CREATE INDEX IF NOT EXISTS idx_mac_college_id ON public.monitoring_admin_colleges(college_id);
CREATE INDEX IF NOT EXISTS idx_mac_status ON public.monitoring_admin_colleges(status);

-- ============================================================================
-- 4. Student College Affiliation Requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_affiliation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    requested_college_name TEXT,
    official_college_email TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliation_student_id ON public.student_affiliation_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_affiliation_status ON public.student_affiliation_requests(status);
CREATE INDEX IF NOT EXISTS idx_affiliation_college_id ON public.student_affiliation_requests(college_id);

-- ============================================================================
-- 5. Centralized Courses, Modules, Subtopics, and Resources
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    domain_slug TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_duration TEXT NOT NULL DEFAULT '4 weeks',
    learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_domain_slug ON public.courses(domain_slug);

CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);

CREATE TABLE IF NOT EXISTS public.course_subtopics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    skill_id TEXT,
    estimated_minutes INT NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_subtopics_module_id ON public.course_subtopics(module_id);
CREATE INDEX IF NOT EXISTS idx_course_subtopics_skill_id ON public.course_subtopics(skill_id);

CREATE TABLE IF NOT EXISTS public.course_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subtopic_id UUID REFERENCES public.course_subtopics(id) ON DELETE CASCADE,
    skill_id TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'article',
    source TEXT NOT NULL DEFAULT 'External',
    description TEXT,
    is_free BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_resources_subtopic_id ON public.course_resources(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_skill_id ON public.course_resources(skill_id);

-- Link questions to subtopics and marks if needed
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES public.course_subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PUBLISHED'
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS marks INT NOT NULL DEFAULT 1;

-- ============================================================================
-- 6. Administrative Audit Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.admin_audit_logs(created_at DESC);

-- ============================================================================
-- 7. Seed Initial Approved Colleges
-- ============================================================================
INSERT INTO public.colleges (name, code, domain, status)
VALUES
    ('Stanford University', 'STANFORD', 'stanford.edu', 'APPROVED'),
    ('Massachusetts Institute of Technology', 'MIT', 'mit.edu', 'APPROVED'),
    ('University of California, Berkeley', 'UCB', 'berkeley.edu', 'APPROVED'),
    ('Anna University', 'AU', 'annauniv.edu', 'APPROVED'),
    ('Indian Institute of Technology Madras', 'IITM', 'iitm.ac.in', 'APPROVED'),
    ('University of Oxford', 'OXFORD', 'ox.ac.uk', 'APPROVED')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. Row Level Security Policies
-- ============================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colleges viewable by everyone" ON public.colleges;
CREATE POLICY "Colleges viewable by everyone" ON public.colleges FOR SELECT USING (true);

ALTER TABLE public.monitoring_admin_colleges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view their own college assignments" ON public.monitoring_admin_colleges;
CREATE POLICY "Admins can view their own college assignments" ON public.monitoring_admin_colleges
    FOR SELECT USING (auth.uid() = admin_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published courses viewable by all" ON public.courses;
CREATE POLICY "Published courses viewable by all" ON public.courses
    FOR SELECT USING (status = 'PUBLISHED');

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published modules viewable by all" ON public.course_modules;
CREATE POLICY "Published modules viewable by all" ON public.course_modules
    FOR SELECT USING (status = 'PUBLISHED');

ALTER TABLE public.course_subtopics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published subtopics viewable by all" ON public.course_subtopics;
CREATE POLICY "Published subtopics viewable by all" ON public.course_subtopics
    FOR SELECT USING (status = 'PUBLISHED');

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published course resources viewable by all" ON public.course_resources;
CREATE POLICY "Published course resources viewable by all" ON public.course_resources
    FOR SELECT USING (status = 'PUBLISHED');
