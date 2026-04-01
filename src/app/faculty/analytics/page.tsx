import { loadFacultyData } from "@/lib/faculty-data";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { evaluations, sentiments } = await loadFacultyData();

  const submitted = evaluations.filter((e) => e.status === "submitted");

  // Build category averages for bar chart
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  for (const ev of submitted) {
    for (const [cat, avg] of Object.entries(ev.categoryAverages)) {
      if (!categoryTotals[cat]) categoryTotals[cat] = { sum: 0, count: 0 };
      categoryTotals[cat].sum += avg;
      categoryTotals[cat].count += 1;
    }
  }

  const categoryData = Object.entries(categoryTotals).map(([label, { sum, count }]) => ({
    category: label,
    average: Number((sum / count).toFixed(2)),
  }));

  // Build per-role averages for radar chart
  const byRole: Record<string, { sum: number; count: number }> = {};
  for (const ev of submitted) {
    const avgs = Object.values(ev.categoryAverages);
    if (avgs.length === 0) continue;
    const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    const role = ev.role || "unknown";
    if (!byRole[role]) byRole[role] = { sum: 0, count: 0 };
    byRole[role].sum += overall;
    byRole[role].count += 1;
  }

  const roleData = Object.entries(byRole).map(([role, { sum, count }]) => ({
    role,
    average: Number((sum / count).toFixed(2)),
  }));

  // Build sentiment distribution for pie chart
  const sentimentData = [
    { name: "Positive", value: sentiments.filter((s) => s.sentiment === "positive").length, color: "#10b981" },
    { name: "Neutral", value: sentiments.filter((s) => s.sentiment === "neutral").length, color: "#64748b" },
    { name: "Negative", value: sentiments.filter((s) => s.sentiment === "negative").length, color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  // Build per-evaluator scores for comparison chart
  const evaluatorData = submitted.map((ev) => {
    const avgs = Object.values(ev.categoryAverages);
    return {
      name: ev.evaluatorName,
      score: avgs.length > 0 ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)) : 0,
    };
  });

  // Generate recommendations
  const recommendations = generateRecommendations(categoryData, sentimentData, roleData);

  return (
    <AnalyticsClient
      categoryData={categoryData}
      roleData={roleData}
      sentimentData={sentimentData}
      evaluatorData={evaluatorData}
      recommendations={recommendations}
      totalEvaluations={submitted.length}
      totalSentiments={sentiments.length}
    />
  );
}

function generateRecommendations(
  categories: { category: string; average: number }[],
  sentiments: { name: string; value: number }[],
  roles: { role: string; average: number }[]
): string[] {
  const recs: string[] = [];

  if (categories.length === 0) {
    recs.push("No evaluation data available yet. Encourage evaluators to submit their assessments.");
    return recs;
  }

  const overallAvg = categories.reduce((s, c) => s + c.average, 0) / categories.length;

  if (overallAvg >= 4.5) {
    recs.push("Outstanding performance across all categories. Consider mentoring other faculty members.");
  } else if (overallAvg >= 4) {
    recs.push("Strong overall performance. Focus on the lowest-scoring categories for further improvement.");
  } else if (overallAvg >= 3) {
    recs.push("Satisfactory performance with room for growth. Review category-specific feedback for targeted improvement.");
  } else {
    recs.push("Performance needs attention. Consider professional development workshops and peer consultations.");
  }

  // Identify weakest category
  const sorted = [...categories].sort((a, b) => a.average - b.average);
  if (sorted.length > 0 && sorted[0].average < 4) {
    recs.push(`Focus area: "${sorted[0].category}" scored lowest at ${sorted[0].average}/5. Review specific feedback and develop an action plan.`);
  }

  // Identify strongest category
  if (sorted.length > 1) {
    const best = sorted[sorted.length - 1];
    recs.push(`Strength: "${best.category}" is your highest-rated area at ${best.average}/5. Leverage this in your teaching approach.`);
  }

  // Sentiment-based recommendations
  const totalSentiment = sentiments.reduce((s, d) => s + d.value, 0);
  if (totalSentiment > 0) {
    const negPct = ((sentiments.find((s) => s.name === "Negative")?.value ?? 0) / totalSentiment) * 100;
    if (negPct > 30) {
      recs.push("High negative sentiment detected (>30%). Consider student engagement strategies and open feedback sessions.");
    } else if (negPct > 15) {
      recs.push("Moderate negative sentiment. Review student comments for recurring themes and address them proactively.");
    } else {
      recs.push("Student sentiment is largely positive. Maintain current engagement practices.");
    }
  }

  // Role-based insights
  if (roles.length >= 2) {
    const selfEval = roles.find((r) => r.role === "self");
    const peerEval = roles.find((r) => r.role === "peer");
    if (selfEval && peerEval && Math.abs(selfEval.average - peerEval.average) > 0.8) {
      recs.push("Significant gap between self-evaluation and peer evaluation. Consider aligning self-assessment with external feedback.");
    }
  }

  return recs;
}
