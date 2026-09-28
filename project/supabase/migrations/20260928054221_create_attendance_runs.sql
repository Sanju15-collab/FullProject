/*
# Create attendance mission run log

1. New Tables
- `attendance_runs` stores optional, anonymous snapshots when a user presses LOG RUN.
- `id` is the generated run identifier.
- `section_id` identifies the selected timetable section.
- `target_date` stores the scenario horizon.
- `attended` and `conducted` store the entered attendance baseline.
- `remaining_classes`, `current_percent`, and `final_possible_percent` store the calculated telemetry shown to the user.
- `created_at` records when the run was logged.

2. Security
- Row level security is enabled.
- This is intentionally a single-tenant, no-sign-in app. Anonymous and authenticated visitors may create and read shared run logs.
- Update and delete are permitted for the same shared log so the app can manage its own lightweight history if needed.

3. Important Notes
- No user account or personal profile is stored.
- No existing tables or user data are modified.
*/

CREATE TABLE IF NOT EXISTS public.attendance_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text NOT NULL,
  target_date date NOT NULL,
  attended integer NOT NULL CHECK (attended >= 0),
  conducted integer NOT NULL CHECK (conducted >= 0),
  remaining_classes integer NOT NULL CHECK (remaining_classes >= 0),
  current_percent numeric(5,2) NOT NULL CHECK (current_percent >= 0 AND current_percent <= 100),
  final_possible_percent numeric(5,2) NOT NULL CHECK (final_possible_percent >= 0 AND final_possible_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read attendance runs" ON public.attendance_runs;
CREATE POLICY "Anyone can read attendance runs" ON public.attendance_runs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert attendance runs" ON public.attendance_runs;
CREATE POLICY "Anyone can insert attendance runs" ON public.attendance_runs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update attendance runs" ON public.attendance_runs;
CREATE POLICY "Anyone can update attendance runs" ON public.attendance_runs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete attendance runs" ON public.attendance_runs;
CREATE POLICY "Anyone can delete attendance runs" ON public.attendance_runs FOR DELETE TO anon, authenticated USING (true);
