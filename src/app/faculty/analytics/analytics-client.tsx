"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

type Props = {
  categoryData: { category: string; average: number }[];
  roleData: { role: string; average: number }[];
  sentimentData: { name: string; value: number; color: string }[];
  evaluatorData: { name: string; score: number }[];
  recommendations: string[];
  totalEvaluations: number;
  totalSentiments: number;
};

export default function AnalyticsClient({
  categoryData,
  roleData,
  sentimentData,
  evaluatorData,
  recommendations,
  totalEvaluations,
  totalSentiments,
}: Props) {
  const hasData = categoryData.length > 0;

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Analytics</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Data Graphs &amp; Recommendation</h1>
        <p className="text-slate-400 text-sm">
          Visual performance analytics across {totalEvaluations} evaluation{totalEvaluations !== 1 ? "s" : ""} and{" "}
          {totalSentiments} sentiment response{totalSentiments !== 1 ? "s" : ""}.
        </p>
      </header>

      {!hasData ? (
        <div className="stat-card p-8 text-center">
          <p className="text-slate-400">
            No evaluation data available yet. Charts and recommendations will appear once evaluations are submitted.
          </p>
        </div>
      ) : (
        <>
          {/* Charts grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Bar Chart */}
            <div className="card glass">
              <div className="card-header">
                <h2 className="text-base font-semibold text-white">Category Performance</h2>
              </div>
              <div className="card-body">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        domain={[0, 5]}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#f8fafc",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value} / 5`, "Average"]}
                      />
                      <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sentiment Pie Chart */}
            {sentimentData.length > 0 && (
              <div className="card glass">
                <div className="card-header">
                  <h2 className="text-base font-semibold text-white">Sentiment Distribution</h2>
                </div>
                <div className="card-body">
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sentimentData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Radar by role */}
            {roleData.length >= 2 && (
              <div className="card glass">
                <div className="card-header">
                  <h2 className="text-base font-semibold text-white">Evaluation by Role</h2>
                </div>
                <div className="card-body">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={roleData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="role" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fill: "#64748b", fontSize: 10 }} />
                        <Radar
                          dataKey="average"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.3}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value} / 5`, "Average"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluator Comparison Bar Chart */}
            {evaluatorData.length > 1 && (
              <div className="card glass">
                <div className="card-header">
                  <h2 className="text-base font-semibold text-white">Evaluator Comparison</h2>
                </div>
                <div className="card-body">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evaluatorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          tickLine={false}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          domain={[0, 5]}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value} / 5`, "Score"]}
                        />
                        <Bar dataKey="score" fill="#818cf8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="card glass">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">Recommendations</h2>
              <span className="badge">AI-Driven</span>
            </div>
            <div className="card-body space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
