"use client";

import { useSearchParams } from "next/navigation";
import VideoRecorder from "@/components/VideoRecorder";
import { InterviewType } from "@/lib/types";

export default function InterviewPageInner() {
  const params = useSearchParams();
  const type = (params.get("type") ?? "behavioral") as InterviewType;
  const role = params.get("role") ?? "";
  const question = params.get("question") ?? "";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div>
          <span className="uppercase tracking-widest text-amber-500 text-xs font-semibold">
            {type} · {role}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white leading-snug">
            {question}
          </h2>
          <p className="mt-2 text-zinc-500 text-sm">
            Press <span className="text-zinc-300">Start Recording</span> when
            you&apos;re ready. Press{" "}
            <span className="text-zinc-300">Stop &amp; Grade</span> when
            finished.
          </p>
        </div>

        <VideoRecorder type={type} role={role} question={question} />
      </div>
    </main>
  );
}
