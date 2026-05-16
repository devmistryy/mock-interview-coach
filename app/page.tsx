"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewType } from "@/lib/types";

export default function LandingPage() {
  const [type, setType] = useState<InterviewType>("behavioral");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, role }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const { question } = await res.json();
      const params = new URLSearchParams({ type, role, question });
      router.push(`/interview?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <span className="uppercase tracking-widest text-amber-500 text-xs font-semibold">
            AI Interview Coach
          </span>
          <h1 className="mt-3 text-4xl font-bold text-white leading-tight">
            Practice like it&apos;s real.
          </h1>
          <p className="mt-3 text-zinc-400">
            Get instant AI feedback on your answers, delivery, and presence.
          </p>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-5">
          <div>
            <p className="uppercase tracking-widest text-xs text-zinc-400 mb-3">
              Interview type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["behavioral", "technical"] as InterviewType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-xl border py-4 text-sm font-semibold capitalize transition-colors ${
                    type === t
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block uppercase tracking-widest text-xs text-zinc-400 mb-3"
            >
              Target role
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-950 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !role.trim()}
            className="mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold py-3 tracking-wide transition-colors"
          >
            {loading ? "Generating question…" : "Start Interview"}
          </button>
        </form>
      </div>
    </main>
  );
}
