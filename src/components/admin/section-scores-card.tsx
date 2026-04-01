"use client";

import { useMemo } from "react";

type SectionScore = {
  sectionId: string;
  courseLabel: string;
  facultyName: string;
  term: string;
  schedule: string;
  average: number;
  responses: number;
};

type Props = {
  scores: SectionScore[];
};

export default function SectionScoresCard({ scores }: Props) {
  const sorted = useMemo(() => [...scores].sort((a, b) => b.average - a.average), [scores]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="card glass">
      <div className="card-header">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Evaluations</p>
          <h2 className="text-lg font-semibold text-white">Section scores</h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <div className="card-body bg-white/60 backdrop-blur">
        <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="table min-w-[780px]">
            <thead>
              <tr>
                <th>Course / Section</th>
                <th>Faculty</th>
                <th>Term</th>
                <th>Schedule</th>
                <th className="text-right">Avg Score</th>
                <th className="text-right">Responses</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-600" colSpan={6}>
                    No evaluation responses yet.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.sectionId}>
                    <td className="font-semibold text-slate-900">{row.courseLabel}</td>
                    <td className="text-slate-700">{row.facultyName}</td>
                    <td className="text-slate-600 text-sm">{row.term || "—"}</td>
                    <td className="text-slate-600 text-sm">{row.schedule || "—"}</td>
                    <td className="text-right font-semibold text-slate-900">{row.average.toFixed(2)}</td>
                    <td className="text-right text-slate-700">{row.responses}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
