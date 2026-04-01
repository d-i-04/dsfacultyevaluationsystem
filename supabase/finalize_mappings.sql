-- Finalize mappings for faculty, courses, sections, sentiments, and evaluation samples.
-- Run after seeding. Development-only; adjust for production constraints.

DO $$
DECLARE
  f1 uuid;
  f2 uuid;
  student uuid;
  admin_user uuid;
  v_period_id uuid;
  sec1 uuid;
  sec2 uuid;
  eval_id uuid;
BEGIN
  -- Load identities
  SELECT id INTO f1 FROM profiles WHERE email = 'faculty1@example.com' LIMIT 1;
  SELECT id INTO f2 FROM profiles WHERE email = 'faculty2@example.com' LIMIT 1;
  SELECT id INTO student FROM profiles WHERE email = 'student1@example.com' LIMIT 1;
  SELECT id INTO admin_user FROM profiles WHERE email = 'admin@example.com' LIMIT 1;
  SELECT id INTO v_period_id FROM evaluation_periods WHERE name = 'Midyear 2026' LIMIT 1;

  -- Map sections to faculty based on course codes
  UPDATE sections SET faculty_id = f1 WHERE course_id = (SELECT id FROM courses WHERE code = 'CS101' LIMIT 1);
  UPDATE sections SET faculty_id = f2 WHERE course_id = (SELECT id FROM courses WHERE code = 'CS201' LIMIT 1);

  -- Re-fetch sections after updates
  SELECT id INTO sec1 FROM sections WHERE course_id = (SELECT id FROM courses WHERE code = 'CS101' LIMIT 1) LIMIT 1;
  SELECT id INTO sec2 FROM sections WHERE course_id = (SELECT id FROM courses WHERE code = 'CS201' LIMIT 1) LIMIT 1;

  -- Refresh evaluator assignments for the period
  DELETE FROM evaluator_assignments ea WHERE ea.period_id = v_period_id;

  IF v_period_id IS NOT NULL THEN
    IF sec1 IS NOT NULL AND f1 IS NOT NULL THEN
      INSERT INTO evaluator_assignments (period_id, section_id, faculty_id, evaluator_id, role)
      VALUES
        (v_period_id, sec1, f1, f1, 'self'::evaluation_role),
        (v_period_id, sec1, f1, f2, 'peer'::evaluation_role),
        (v_period_id, sec1, f1, admin_user, 'supervisor'::evaluation_role);
    END IF;

    IF sec2 IS NOT NULL AND f2 IS NOT NULL THEN
      INSERT INTO evaluator_assignments (period_id, section_id, faculty_id, evaluator_id, role)
      VALUES
        (v_period_id, sec2, f2, f2, 'self'::evaluation_role),
        (v_period_id, sec2, f2, admin_user, 'supervisor'::evaluation_role);
    END IF;
  END IF;

  -- Refresh student sentiments for the period
  DELETE FROM student_sentiments ss WHERE ss.period_id = v_period_id;
  IF v_period_id IS NOT NULL AND sec1 IS NOT NULL AND f1 IS NOT NULL AND student IS NOT NULL THEN
    INSERT INTO student_sentiments (period_id, section_id, faculty_id, student_id, sentiment, comments)
    VALUES
      (v_period_id, sec1, f1, student, 'positive'::sentiment_scale, 'Great pacing and clear slides.'),
      (v_period_id, sec1, f1, student, 'neutral'::sentiment_scale, 'Would like more examples in class.');
  END IF;

  -- Refresh evaluation sample for a self assignment on sec1
  DELETE FROM evaluation_responses WHERE evaluation_id IN (
    SELECT e.id FROM evaluations e
    JOIN evaluator_assignments ea ON ea.id = e.assignment_id
    WHERE ea.period_id = v_period_id
  );
  DELETE FROM evaluations USING evaluator_assignments ea
  WHERE evaluations.assignment_id = ea.id AND ea.period_id = v_period_id;

  IF v_period_id IS NOT NULL THEN
    SELECT id INTO eval_id FROM evaluator_assignments
    WHERE period_id = v_period_id AND role = 'self'::evaluation_role
    ORDER BY created_at ASC LIMIT 1;

    IF eval_id IS NOT NULL THEN
      INSERT INTO evaluations (assignment_id, status, overall_comment)
      VALUES (eval_id, 'draft', 'Ready for scoring');

      INSERT INTO evaluation_responses (evaluation_id, rubric_item_id, score, comment)
      SELECT e.id, ri.id, 4, 'Doing well on this criterion'
      FROM evaluations e
      CROSS JOIN LATERAL (
        SELECT id FROM rubric_items ORDER BY order_index ASC LIMIT 1
      ) ri
      WHERE e.assignment_id = eval_id
      LIMIT 1;
    END IF;
  END IF;
END $$;
