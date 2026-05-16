"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { GradingResult, InterviewType } from "@/lib/types";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle
          cx="54"
          cy="54"
          r={RADIUS}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        <circle
          cx="54"
          cy="54"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 54 54)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x="54"
          y="54"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="18"
          fontWeight="700"
        >
          {score}
        </text>
      </svg>
      <span className="uppercase tracking-widest text-xs text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export default function ResultsPageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const type = (params.get("type") ?? "behavioral") as InterviewType;
  const role = params.get("role") ?? "";
  const question = params.get("question") ?? "";
  const raw = params.get("result") ?? "{}";

  let result: GradingResult;
  try {
    result = JSON.parse(raw);
  } catch {
    result = {
      contentScore: 0,
      deliveryScore: 0,
      overallScore: 0,
      strengths: [],
      improvements: [],
      contentFeedback: "Could not parse result.",
      deliveryFeedback: "",
    };
  }

  const handleRetry = () => {
    const p = new URLSearchParams({ type, role, question });
    router.push(`/interview?${p.toString()}`);
  };

  const handleNew = () => router.push("/");

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div>
          <span className="uppercase tracking-widest text-amber-500 text-xs font-semibold">
            Results · {type} · {role}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-zinc-300 leading-snug">
            {question}
          </h2>
        </div>

        {/* Score rings */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 flex justify-around flex-wrap gap-6">
          <ScoreRing
            score={result.overallScore}
            label="Overall"
            color="#f59e0b"
          />
          <ScoreRing
            score={result.contentScore}
            label="Content"
            color="#34d399"
          />
          <ScoreRing
            score={result.deliveryScore}
            label="Delivery"
            color="#60a5fa"
          />
        </div>

        {/* Strengths + improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="uppercase tracking-widest text-xs text-emerald-400 mb-3">
              Strengths
            </p>
            <ul className="flex flex-col gap-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="uppercase tracking-widest text-xs text-amber-400 mb-3">
              Improvements
            </p>
            <ul className="flex flex-col gap-2">
              {result.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-amber-400 mt-0.5">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feedback paragraphs */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="uppercase tracking-widest text-xs text-emerald-400 mb-2">
              Content Feedback
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {result.contentFeedback}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <p className="uppercase tracking-widest text-xs text-blue-400 mb-2">
              Delivery Feedback
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {result.deliveryFeedback}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold py-3 text-sm tracking-wide transition-colors"
          >
            Retry Question
          </button>
          <button
            onClick={handleNew}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-3 text-sm tracking-wide transition-colors"
          >
            New Interview
          </button>
        </div>
      </div>
    </main>
  );
}
