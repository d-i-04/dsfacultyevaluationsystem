-- Broad allow-all policies for development/testing only. Do NOT use in production.
-- Run this in the Supabase SQL editor.

-- Enable RLS on all relevant tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_sentiments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies we’re replacing
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'departments','profiles','courses','sections','evaluation_periods',
        'rubric_categories','rubric_items','evaluator_assignments',
        'evaluations','evaluation_responses','student_sentiments'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

-- Create allow-all policies for anon and authenticated
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'departments','profiles','courses','sections','evaluation_periods',
      'rubric_categories','rubric_items','evaluator_assignments',
      'evaluations','evaluation_responses','student_sentiments'
    ])
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true);', 'allow_all_select', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', 'allow_all_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', 'allow_all_update', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true);', 'allow_all_delete', tbl);
  END LOOP;
END $$;

-- Reminder: remove/replace with least-privilege policies before production.