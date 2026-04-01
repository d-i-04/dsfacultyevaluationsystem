-- Minimal unique indexes retained (no ON CONFLICT clauses below)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'evaluation_periods' AND indexname = 'uq_eval_periods_name'
  ) THEN
    CREATE UNIQUE INDEX uq_eval_periods_name ON evaluation_periods (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'sections' AND indexname = 'uq_sections_course_faculty_term_year_sched'
  ) THEN
    CREATE UNIQUE INDEX uq_sections_course_faculty_term_year_sched
      ON sections (
        course_id,
        COALESCE(faculty_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(term, ''),
        COALESCE(academic_year, ''),
        COALESCE(schedule, '')
      );
  END IF;
END $$;

-- Cleanup to allow repeatable runs without ON CONFLICT
DELETE FROM evaluation_responses WHERE evaluation_id IN (
  SELECT e.id
  FROM evaluations e
  JOIN evaluator_assignments ea ON ea.id = e.assignment_id
  JOIN evaluation_periods p ON p.id = ea.period_id AND p.name = 'Midyear 2026'
);

DELETE FROM evaluations WHERE assignment_id IN (
  SELECT ea.id
  FROM evaluator_assignments ea
  JOIN evaluation_periods p ON p.id = ea.period_id AND p.name = 'Midyear 2026'
);

DELETE FROM evaluator_assignments WHERE period_id IN (
  SELECT id FROM evaluation_periods WHERE name = 'Midyear 2026'
);

DELETE FROM student_sentiments WHERE period_id IN (
  SELECT id FROM evaluation_periods WHERE name = 'Midyear 2026'
);

DELETE FROM rubric_items WHERE category_id IN (
  SELECT id FROM rubric_categories WHERE label IN (
    'Commitment', 'Knowledge of Subject', 'Teaching for Independent Learning', 'Management of Learning'
  )
);

DELETE FROM rubric_categories WHERE label IN (
  'Commitment', 'Knowledge of Subject', 'Teaching for Independent Learning', 'Management of Learning'
);

DELETE FROM evaluation_periods WHERE name = 'Midyear 2026';

DELETE FROM sections WHERE schedule IN ('MWF 9:00-10:00', 'TTh 1:00-2:30');

DELETE FROM courses WHERE code IN ('CS101', 'CS201', 'MATH201');

DELETE FROM profiles WHERE email IN (
  'admin@example.com', 'faculty1@example.com', 'faculty2@example.com', 'student1@example.com'
);

DELETE FROM departments WHERE name IN ('Computer Science', 'Mathematics', 'Physics');

-- 1) Departments
INSERT INTO departments (name)
VALUES ('Computer Science'), ('Mathematics'), ('Physics');

-- 2) Profiles (cast to app_role)
WITH u AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'admin@example.com', 'faculty1@example.com', 'faculty2@example.com', 'student1@example.com'
  )
)
INSERT INTO profiles (id, full_name, email, role, department_id)
SELECT
  u.id,
  CASE u.email
    WHEN 'admin@example.com' THEN 'Alex Admin'
    WHEN 'faculty1@example.com' THEN 'Frida Faculty'
    WHEN 'faculty2@example.com' THEN 'Felix Faculty'
    WHEN 'student1@example.com' THEN 'Sam Student'
  END AS full_name,
  u.email,
  (
    CASE u.email
      WHEN 'admin@example.com' THEN 'admin'
      WHEN 'student1@example.com' THEN 'student'
      ELSE 'faculty'
    END
  )::app_role AS role,
  (SELECT id FROM departments WHERE name = 'Computer Science')
FROM u;

-- 3) Courses
INSERT INTO courses (code, title, department_id)
VALUES
  ('CS101', 'Intro to Computing', (SELECT id FROM departments WHERE name = 'Computer Science')),
  ('CS201', 'Data Structures', (SELECT id FROM departments WHERE name = 'Computer Science')),
  ('MATH201', 'Calculus II', (SELECT id FROM departments WHERE name = 'Mathematics'));

-- 4) Sections
WITH f1 AS (SELECT id FROM profiles WHERE email = 'faculty1@example.com'),
     f2 AS (SELECT id FROM profiles WHERE email = 'faculty2@example.com')
INSERT INTO sections (course_id, faculty_id, term, academic_year, schedule)
VALUES
  ((SELECT id FROM courses WHERE code='CS101'), (SELECT id FROM f1), '1st Sem', '2025-2026', 'MWF 9:00-10:00'),
  ((SELECT id FROM courses WHERE code='CS201'), (SELECT id FROM f2), '1st Sem', '2025-2026', 'TTh 1:00-2:30');

-- 5) Evaluation period
INSERT INTO evaluation_periods (name, start_date, end_date, status, rubric_version)
VALUES ('Midyear 2026', '2026-06-01', '2026-06-30', 'open', 'v1');

-- 6) Rubric categories
INSERT INTO rubric_categories (label, description, order_index, weight)
VALUES
  ('Commitment', 'Sensitivity, availability, records, timeliness', 1, 1.0),
  ('Knowledge of Subject', 'Mastery, relevance, currency', 2, 1.0),
  ('Teaching for Independent Learning', 'Strategies, self-esteem, accountability, beyond requirements', 3, 1.0),
  ('Management of Learning', 'Facilitation, experience design, structure, materials', 4, 1.0);

-- 7) Rubric items
WITH cat AS (SELECT id, label FROM rubric_categories)
INSERT INTO rubric_items (category_id, prompt, order_index)
VALUES
  ((SELECT id FROM cat WHERE label = 'Commitment'), 'Demonstrates sensitivity to students ability to attend and absorb content information.', 1),
  ((SELECT id FROM cat WHERE label = 'Commitment'), 'Integrates sensitively learning objectives with those of the students in a collaborative process.', 2),
  ((SELECT id FROM cat WHERE label = 'Commitment'), 'Makes self-available to students beyond official time.', 3),
  ((SELECT id FROM cat WHERE label = 'Commitment'), 'Regularly comes to class on time, well-groomed and well-prepared.', 4),
  ((SELECT id FROM cat WHERE label = 'Commitment'), 'Keeps accurate records of students performance and prompt submission.', 5),

  ((SELECT id FROM cat WHERE label = 'Knowledge of Subject'), 'Demonstrates mastery without relying solely on the textbook.', 1),
  ((SELECT id FROM cat WHERE label = 'Knowledge of Subject'), 'Shares state-of-the-art theory and practice.', 2),
  ((SELECT id FROM cat WHERE label = 'Knowledge of Subject'), 'Integrates subject to practical circumstances and student intents.', 3),
  ((SELECT id FROM cat WHERE label = 'Knowledge of Subject'), 'Explains relevance to previous lessons and daily life.', 4),
  ((SELECT id FROM cat WHERE label = 'Knowledge of Subject'), 'Shows up-to-date knowledge on trends/issues.', 5),

  ((SELECT id FROM cat WHERE label = 'Teaching for Independent Learning'), 'Creates strategies for students to practice concepts.', 1),
  ((SELECT id FROM cat WHERE label = 'Teaching for Independent Learning'), 'Enhances self-esteem / gives recognition.', 2),
  ((SELECT id FROM cat WHERE label = 'Teaching for Independent Learning'), 'Allows students to create their own course rules/objectives.', 3),
  ((SELECT id FROM cat WHERE label = 'Teaching for Independent Learning'), 'Lets students think independently and be accountable.', 4),
  ((SELECT id FROM cat WHERE label = 'Teaching for Independent Learning'), 'Encourages learning beyond requirements and applying concepts.', 5),

  ((SELECT id FROM cat WHERE label = 'Management of Learning'), 'Creates opportunities for intensive/extensive contribution (dyads/triads/groups).', 1),
  ((SELECT id FROM cat WHERE label = 'Management of Learning'), 'Assumes roles (facilitator, coach, integrator, referee).', 2),
  ((SELECT id FROM cat WHERE label = 'Management of Learning'), 'Designs conditions for healthy exchange/confrontation.', 3),
  ((SELECT id FROM cat WHERE label = 'Management of Learning'), 'Restructures context to enhance learning objectives.', 4),
  ((SELECT id FROM cat WHERE label = 'Management of Learning'), 'Uses instructional materials/CAI/fieldtrips/etc.', 5);

-- 8) Evaluator assignments
WITH period AS (SELECT id FROM evaluation_periods WHERE name = 'Midyear 2026' LIMIT 1),
     sec1 AS (SELECT id, faculty_id FROM sections WHERE faculty_id IS NOT NULL ORDER BY created_at ASC LIMIT 1),
     sec2 AS (SELECT id, faculty_id FROM sections WHERE faculty_id IS NOT NULL ORDER BY created_at DESC LIMIT 1),
     peer AS (SELECT id FROM profiles WHERE email = 'faculty2@example.com' LIMIT 1),
     supervisor AS (SELECT id FROM profiles WHERE email = 'admin@example.com' LIMIT 1)
INSERT INTO evaluator_assignments (period_id, section_id, faculty_id, evaluator_id, role)
SELECT * FROM (
  VALUES
    ((SELECT id FROM period), (SELECT id FROM sec1), (SELECT faculty_id FROM sec1), (SELECT faculty_id FROM sec1), 'self'::evaluation_role),
    ((SELECT id FROM period), (SELECT id FROM sec1), (SELECT faculty_id FROM sec1), (SELECT id FROM peer), 'peer'::evaluation_role),
    ((SELECT id FROM period), (SELECT id FROM sec1), (SELECT faculty_id FROM sec1), (SELECT id FROM supervisor), 'supervisor'::evaluation_role),
    ((SELECT id FROM period), (SELECT id FROM sec2), (SELECT faculty_id FROM sec2), (SELECT faculty_id FROM sec2), 'self'::evaluation_role),
    ((SELECT id FROM period), (SELECT id FROM sec2), (SELECT faculty_id FROM sec2), (SELECT id FROM supervisor), 'supervisor'::evaluation_role)
) AS v(period_id, section_id, faculty_id, evaluator_id, role)
WHERE v.period_id IS NOT NULL
  AND v.section_id IS NOT NULL
  AND v.faculty_id IS NOT NULL
  AND v.evaluator_id IS NOT NULL;

-- 9) Student sentiments
WITH period AS (SELECT id FROM evaluation_periods WHERE name = 'Midyear 2026' LIMIT 1),
     sec1 AS (SELECT id, faculty_id FROM sections WHERE faculty_id IS NOT NULL ORDER BY created_at ASC LIMIT 1),
     student AS (SELECT id FROM profiles WHERE email = 'student1@example.com' LIMIT 1)
INSERT INTO student_sentiments (period_id, section_id, faculty_id, student_id, sentiment, comments)
SELECT * FROM (
  VALUES
    ((SELECT id FROM period), (SELECT id FROM sec1), (SELECT faculty_id FROM sec1), (SELECT id FROM student), 'positive'::sentiment_scale, 'Great pacing and clear slides.'),
    ((SELECT id FROM period), (SELECT id FROM sec1), (SELECT faculty_id FROM sec1), (SELECT id FROM student), 'neutral'::sentiment_scale, 'Would like more examples in class.')
) AS v(period_id, section_id, faculty_id, student_id, sentiment, comments)
WHERE v.period_id IS NOT NULL
  AND v.section_id IS NOT NULL
  AND v.faculty_id IS NOT NULL
  AND v.student_id IS NOT NULL;

-- 10) One self-evaluation draft with one scored item
WITH a AS (
  SELECT ea.id FROM evaluator_assignments ea
  JOIN evaluation_periods p ON p.id = ea.period_id AND p.name = 'Midyear 2026'
  WHERE ea.role = 'self'
  LIMIT 1
), item AS (
  SELECT id FROM rubric_items ORDER BY order_index ASC LIMIT 1
)
INSERT INTO evaluations (assignment_id, status, overall_comment)
SELECT a.id, 'draft', 'Ready for scoring'
FROM a;

WITH a AS (
  SELECT ea.id FROM evaluator_assignments ea
  JOIN evaluation_periods p ON p.id = ea.period_id AND p.name = 'Midyear 2026'
  WHERE ea.role = 'self'
  LIMIT 1
), e AS (
  SELECT id FROM evaluations WHERE assignment_id = (SELECT id FROM a) LIMIT 1
), item AS (
  SELECT id FROM rubric_items ORDER BY order_index ASC LIMIT 1
)
INSERT INTO evaluation_responses (evaluation_id, rubric_item_id, score, comment)
SELECT
  (SELECT id FROM e),
  (SELECT id FROM item),
  4,
  'Doing well on this criterion'
FROM e;
