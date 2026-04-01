-- ============================================================
-- Internship Application Tracker — PostgreSQL Schema
-- Run this in your Neon.tech SQL Editor
-- ============================================================

-- Drop tables in reverse dependency order (for re-runs)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE companies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  industry    VARCHAR(100),
  location    VARCHAR(255),
  website     VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- JOB POSTINGS
-- ============================================================
CREATE TABLE job_postings (
  id           SERIAL PRIMARY KEY,
  company_id   INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  role_type    VARCHAR(50) CHECK (role_type IN ('Internship','Full-Time','Part-Time','Co-op','Contract')),
  location     VARCHAR(255),
  posting_url  VARCHAR(500),
  deadline     DATE,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id             SERIAL PRIMARY KEY,
  job_posting_id INT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  status         VARCHAR(50) DEFAULT 'Applied'
                   CHECK (status IN ('Wishlist','Applied','Phone Screen','Interview','Offer','Rejected','Withdrawn','Accepted')),
  applied_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  source         VARCHAR(100),  -- LinkedIn, Handshake, Company Website, etc.
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INTERVIEWS
-- ============================================================
CREATE TABLE interviews (
  id              SERIAL PRIMARY KEY,
  application_id  INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round           INT DEFAULT 1,
  interview_date  TIMESTAMP,
  interview_type  VARCHAR(50) CHECK (interview_type IN ('Phone','Video','Onsite','Technical','Behavioral','Case','Final')),
  notes           TEXT,
  outcome         VARCHAR(50) CHECK (outcome IN ('Pending','Passed','Failed','No Decision')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id              SERIAL PRIMARY KEY,
  company_id      INT REFERENCES companies(id) ON DELETE SET NULL,
  application_id  INT REFERENCES applications(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(50),
  role            VARCHAR(100),  -- Recruiter, Hiring Manager, Alumni, etc.
  linkedin_url    VARCHAR(500),
  notes           TEXT,
  last_contacted  DATE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_applications_status    ON applications(status);
CREATE INDEX idx_applications_date      ON applications(applied_date);
CREATE INDEX idx_job_postings_deadline  ON job_postings(deadline);
CREATE INDEX idx_interviews_date        ON interviews(interview_date);

-- ============================================================
-- SEED DATA — Realistic internship applications
-- ============================================================

INSERT INTO companies (name, industry, location, website) VALUES
  ('Google',         'Technology',       'Mountain View, CA',  'https://careers.google.com'),
  ('Microsoft',      'Technology',       'Redmond, WA',        'https://careers.microsoft.com'),
  ('Stripe',         'Fintech',          'San Francisco, CA',  'https://stripe.com/jobs'),
  ('Airbnb',         'Travel/Tech',      'San Francisco, CA',  'https://careers.airbnb.com'),
  ('Goldman Sachs',  'Finance',          'New York, NY',       'https://goldmansachs.com/careers'),
  ('Spotify',        'Music/Tech',       'New York, NY',       'https://lifeatspotify.com'),
  ('Figma',          'Design/Tech',      'San Francisco, CA',  'https://figma.com/careers'),
  ('Palantir',       'Data/Analytics',   'Denver, CO',         'https://palantir.com/careers'),
  ('Notion',         'Productivity/Tech','San Francisco, CA',  'https://notion.so/careers'),
  ('Cloudflare',     'Technology',       'Austin, TX',         'https://cloudflare.com/careers');

INSERT INTO job_postings (company_id, title, role_type, location, posting_url, deadline, description) VALUES
  (1,  'Software Engineering Intern',         'Internship', 'Mountain View, CA',  'https://careers.google.com/jobs/1',  '2025-02-01', 'Build products used by billions.'),
  (1,  'UX Research Intern',                  'Internship', 'Remote',             'https://careers.google.com/jobs/2',  '2025-02-15', 'User research for Google products.'),
  (2,  'Software Engineer Intern',            'Internship', 'Redmond, WA',        'https://careers.microsoft.com/1',    '2025-01-31', 'Work on Azure or Office teams.'),
  (3,  'Backend Engineer Intern',             'Internship', 'San Francisco, CA',  'https://stripe.com/jobs/1',          '2025-03-01', 'Payments infrastructure at scale.'),
  (4,  'Data Science Intern',                 'Internship', 'San Francisco, CA',  'https://careers.airbnb.com/1',       '2025-02-28', 'Analyze host and guest behavior.'),
  (5,  'Technology Analyst Intern',           'Internship', 'New York, NY',       'https://goldmansachs.com/careers/1', '2025-01-15', 'Engineering for financial systems.'),
  (6,  'iOS Engineer Intern',                 'Internship', 'New York, NY',       'https://lifeatspotify.com/1',        '2025-02-20', 'Build the Spotify iOS app.'),
  (7,  'Software Engineer Intern',            'Internship', 'San Francisco, CA',  'https://figma.com/careers/1',        '2025-03-15', 'Design tooling at Figma.'),
  (8,  'Forward Deployed Engineer Intern',    'Internship', 'Denver, CO',         'https://palantir.com/careers/1',     '2025-01-20', 'Deploy Palantir platforms.'),
  (9,  'Software Engineer Intern',            'Internship', 'San Francisco, CA',  'https://notion.so/careers/1',        '2025-03-01', 'Build core Notion features.'),
  (10, 'Systems Engineer Intern',             'Internship', 'Austin, TX',         'https://cloudflare.com/careers/1',   '2025-02-10', 'Work on the Cloudflare edge network.');

INSERT INTO applications (job_posting_id, status, applied_date, source, notes) VALUES
  (1,  'Interview',    '2024-11-01', 'Company Website', 'Referred by a friend on the team.'),
  (2,  'Rejected',     '2024-11-05', 'LinkedIn',        'No feedback provided.'),
  (3,  'Offer',        '2024-10-20', 'Handshake',       'Got verbal offer, awaiting details.'),
  (4,  'Phone Screen', '2024-11-15', 'Company Website', 'Recruiter reached out first.'),
  (5,  'Applied',      '2024-11-20', 'LinkedIn',        ''),
  (6,  'Rejected',     '2024-10-10', 'Handshake',       'Resume screen rejection.'),
  (7,  'Interview',    '2024-11-10', 'Company Website', 'Passed take-home, now in interview loop.'),
  (8,  'Applied',      '2024-11-22', 'Company Website', 'Applied via referral portal.'),
  (9,  'Withdrawn',    '2024-10-30', 'LinkedIn',        'Withdrew to focus on other roles.'),
  (10, 'Phone Screen', '2024-11-18', 'Indeed',          'Scheduled for next week.');

INSERT INTO interviews (application_id, round, interview_date, interview_type, notes, outcome) VALUES
  (1, 1, '2024-11-20 14:00', 'Phone',      'Spoke with recruiter Sarah. Very friendly.', 'Passed'),
  (1, 2, '2024-12-01 10:00', 'Technical',  'LeetCode-style coding round, 2 medium problems.', 'Pending'),
  (3, 1, '2024-11-01 11:00', 'Phone',      'Intro call with HR.',                       'Passed'),
  (3, 2, '2024-11-10 13:00', 'Technical',  'System design + coding.',                   'Passed'),
  (3, 3, '2024-11-20 15:00', 'Final',      'Team fit interview with engineering manager.','Passed'),
  (4, 1, '2024-11-25 09:00', 'Phone',      '30-min intro with recruiter.',               'Pending'),
  (7, 1, '2024-11-18 14:00', 'Technical',  'Take-home project: build a mini component.', 'Passed'),
  (7, 2, '2024-12-05 11:00', 'Video',      'Virtual loop with 3 engineers.',             'Pending'),
  (10,1, '2024-11-28 10:00', 'Phone',      'Recruiter screening call.',                  'Pending');

INSERT INTO contacts (company_id, application_id, name, email, role, linkedin_url, notes, last_contacted) VALUES
  (1, 1,   'Sarah Kim',      'sarah@google.com',   'Recruiter',         'https://linkedin.com/in/sarahkim',   'Very responsive via email.',            '2024-11-20'),
  (2, NULL, 'James Patel',   'jpatel@microsoft.com','Recruiting Lead',  'https://linkedin.com/in/jamespatel', 'Met at career fair.',                   '2024-10-15'),
  (3, 3,   'Emily Chen',     'emily@stripe.com',   'Hiring Manager',    'https://linkedin.com/in/emilychen',  'She runs the payments infra team.',     '2024-11-20'),
  (5, NULL, 'David Moore',   NULL,                 'Alumni',            'https://linkedin.com/in/davidmoore', 'GS alum, offered to refer me.',         '2024-11-01'),
  (7, 7,   'Priya Sharma',   'priya@figma.com',    'Recruiter',         'https://linkedin.com/in/priyasharma','Reached out cold on LinkedIn.',         '2024-11-10'),
  (6, NULL, 'Tom Wallace',   NULL,                 'Alumni',            'https://linkedin.com/in/tomwallace', 'Spotify iOS alum, gave tips for loop.', '2024-10-28');
