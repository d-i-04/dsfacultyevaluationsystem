"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type CourseOption = { id: string; label: string };
type FacultyOption = { id: string; name: string };

type Props = {
  courses: CourseOption[];
  faculty: FacultyOption[];
};

export default function AddSectionForm({ courses, faculty }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const termOptions = useMemo(() => ["1st Sem", "2nd Sem", "Summer"], []);
  const academicYearOptions = useMemo(() => {
    const now = new Date();
    // Start the list at the current academic year and go a few years forward.
    const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 6 }, (_, index) => {
      const year = startYear + index;
      return `${year}-${year + 1}`;
    });
  }, []);
  const schedulePresets = useMemo(
    () => [
      "MWF 8:00-9:00",
      "MWF 9:00-10:00",
      "MWF 10:00-11:00",
      "TTh 9:00-10:30",
      "TTh 10:30-12:00",
      "Sat 8:00-12:00",
      "Evening 18:00-21:00",
    ],
    []
  );
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedulePreset, setSchedulePreset] = useState("");
  const [scheduleCustom, setScheduleCustom] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const courseId = (form.get("course_id") as string) || null;
    const facultyId = (form.get("faculty_id") as string) || null;
    const term = (form.get("term") as string)?.trim() || null;
    const academicYear = (form.get("academic_year") as string)?.trim() || null;
    const scheduleChoice = (form.get("schedule") as string) || "";
    const customSchedule = (form.get("schedule_custom") as string)?.trim() || "";
    const schedule = scheduleChoice === "custom" ? customSchedule || null : scheduleChoice || null;

    if (!courseId || !facultyId) {
      setMessage({ kind: "error", text: "Course and faculty are required." });
      setIsSubmitting(false);
      return;
    }

    if (scheduleChoice === "custom" && !customSchedule) {
      setMessage({ kind: "error", text: "Enter a custom schedule." });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("sections").insert([
      {
        course_id: courseId,
        faculty_id: facultyId,
        term,
        academic_year: academicYear,
        schedule,
      },
    ]);

    if (error) {
      setMessage({ kind: "error", text: error.message });
      setIsSubmitting(false);
      return;
    }

    setMessage({ kind: "success", text: "Section added." });
    setIsSubmitting(false);
    event.currentTarget.reset();
    setSchedulePreset("");
    setScheduleCustom("");
  };

  const handleReset = () => {
    setMessage(null);
    setSchedulePreset("");
    setScheduleCustom("");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} onReset={handleReset}>
      {message ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            message.kind === "success" ? "bg-green-900/30 text-green-100" : "bg-rose-900/30 text-rose-100"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Course
          <select name="course_id" className="input w-full" defaultValue="" required disabled={isSubmitting}>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Faculty
          <select name="faculty_id" className="input w-full" defaultValue="" required disabled={isSubmitting}>
            <option value="">Select faculty</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm font-medium">
          Term
          <select name="term" className="input w-full" defaultValue="" disabled={isSubmitting}>
            <option value="">Select term</option>
            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Academic year
          <select name="academic_year" className="input w-full" defaultValue="" disabled={isSubmitting}>
            <option value="">Select academic year</option>
            {academicYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Schedule
          <div className="space-y-2">
            <select
              name="schedule"
              className="input w-full"
              value={schedulePreset}
              onChange={(event) => setSchedulePreset(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select schedule</option>
              {schedulePresets.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="custom">Custom schedule</option>
            </select>

            {schedulePreset === "custom" ? (
              <input
                name="schedule_custom"
                className="input w-full"
                placeholder="e.g., Sat 13:00-17:00"
                value={scheduleCustom}
                onChange={(event) => setScheduleCustom(event.target.value)}
                disabled={isSubmitting}
                required
              />
            ) : null}
          </div>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add section"}
        </button>
        <button type="reset" className="btn-secondary" disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </form>
  );
}