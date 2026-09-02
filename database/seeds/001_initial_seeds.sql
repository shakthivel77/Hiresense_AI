-- ============================================================================
-- Hiresense_AI Initial Baseline Seeds
-- Seed: 001_initial_seeds.sql
-- ============================================================================

-- Seed Domains
INSERT INTO public.domains (id, slug, name, description)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'backend-developer', 'Backend Developer', 'Server-side systems, databases, APIs, and security.'),
    ('22222222-2222-2222-2222-222222222222', 'frontend-developer', 'Frontend Developer', 'User interface, client-side web apps, accessibility, and state management.'),
    ('33333333-3333-3333-3333-333333333333', 'ai-data-engineer', 'AI & Data Engineer', 'Data pipelines, Machine Learning engineering, and AI integration.')
ON CONFLICT (slug) DO NOTHING;

-- Seed Foundation Skills
INSERT INTO public.skills (id, slug, name, description, category, difficulty)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'internet-basics', 'Internet & HTTP Basics', 'HTTP, DNS, Web Browsers, Client-Server architecture', 'foundations', 'beginner'),
    ('a2222222-2222-2222-2222-222222222222', 'javascript-basics', 'JavaScript / TypeScript', 'Core language fundamentals, async control flow, types', 'languages', 'beginner'),
    ('a3333333-3333-3333-3333-333333333333', 'nodejs-express', 'Node.js & Express', 'Server runtime, middleware, routing, asynchronous REST APIs', 'backend', 'intermediate'),
    ('a4444444-4444-4444-4444-444444444444', 'postgresql-relational-db', 'PostgreSQL & SQL', 'Relational database design, indexes, joins, and transactions', 'databases', 'intermediate'),
    ('a5555555-5555-5555-5555-555555555555', 'react-fundamentals', 'React Fundamentals', 'JSX, component state, hooks, props, and rendering lifecycle', 'frontend', 'intermediate')
ON CONFLICT (slug) DO NOTHING;

-- Seed Skill Prerequisites (Dependencies)
-- JavaScript Basics -> Node.js & Express
INSERT INTO public.skill_dependencies (skill_id, prerequisite_skill_id)
VALUES
    ('a3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222'),
    ('a5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222')
ON CONFLICT (skill_id, prerequisite_skill_id) DO NOTHING;
