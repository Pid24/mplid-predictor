"use client";

export default function RosterChangeBadge({ impact }: { impact: number }) {
  if (!impact || impact >= -1) return null;
  const level = impact < -6 ? "High" : impact < -3 ? "Med" : "Low";
  const color = level === "High" ? "bg-red-100 text-red-700" : level === "Med" ? "bg-amber-100 text-amber-700" : "bg-yellow-50 text-yellow-700";

  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>Roster change · {level}</span>;
}
