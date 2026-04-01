-- Quick checks to verify seeded data
SELECT * FROM departments ORDER BY name;
SELECT id, full_name, email, role, department_id FROM profiles ORDER BY role, email;
SELECT code, title, department_id FROM courses ORDER BY code;
SELECT id, course_id, faculty_id, term, academic_year, schedule FROM sections ORDER BY created_at;
SELECT name, start_date, end_date, status, rubric_version FROM evaluation_periods ORDER BY start_date;
SELECT label, description, order_index, weight FROM rubric_categories ORDER BY order_index;
SELECT category_id, prompt, order_index FROM rubric_items ORDER BY category_id, order_index;
SELECT period_id, section_id, faculty_id, evaluator_id, role FROM evaluator_assignments ORDER BY created_at;
SELECT period_id, section_id, faculty_id, student_id, sentiment, comments FROM student_sentiments ORDER BY created_at;
SELECT assignment_id, status, overall_comment FROM evaluations ORDER BY created_at;
SELECT evaluation_id, rubric_item_id, score, comment FROM evaluation_responses ORDER BY created_at;
