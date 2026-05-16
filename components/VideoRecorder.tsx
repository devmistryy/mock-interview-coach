"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InterviewType } from "@/lib/types";

interface Props {
  type: InterviewType;
  role: string;
  question: string;
}

export default function VideoRecorder({ type, role, question }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let acquiredStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          // Strict Mode unmounted before promise resolved — release immediately
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        acquiredStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(`Could not access camera/microphone: ${err.message}`);
        }
      });

    return () => {
      cancelled = true;
      acquiredStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const extractFrames = useCallback(
    (blob: Blob): Promise<string[]> =>
      new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const vid = document.createElement("video");
        vid.src = url;
        vid.muted = true;

        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext("2d")!;
        const frames: string[] = [];
        const timestamps = [0.1, 0.5, 0.9];
        let idx = 0;

        vid.addEventListener("loadedmetadata", () => {
          const seekNext = () => {
            if (idx >= timestamps.length) {
              URL.revokeObjectURL(url);
              resolve(frames);
              return;
            }
            vid.currentTime = vid.duration * timestamps[idx];
          };

          vid.addEventListener("seeked", () => {
            ctx.drawImage(vid, 0, 0, 640, 360);
            frames.push(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
            idx++;
            seekNext();
          });

          seekNext();
        });

        vid.load();
      }),
    []
  );

  const startRecording = () => {
    if (!stream) return;
    finalTranscriptRef.current = "";
    chunksRef.current = [];
    setInterimTranscript("");
    setElapsed(0);

    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.start();
    setRecording(true);

    timerRef.current = setInterval(
      () => setElapsed((s) => s + 1),
      1000
    );

    // Web Speech API
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscriptRef.current += res[0].transcript + " ";
          } else {
            interim += res[0].transcript;
          }
        }
        setInterimTranscript(interim);
      };

      rec.start();
      recognitionRef.current = rec;
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    recognitionRef.current?.stop();
    setInterimTranscript("");

    await new Promise<void>((res) => {
      mediaRecorderRef.current!.onstop = () => res();
      mediaRecorderRef.current!.stop();
    });

    setGrading(true);

    try {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const frames = await extractFrames(blob);
      const transcript =
        finalTranscriptRef.current.trim() || "(no speech detected)";

      const res = await fetch("/api/grade-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, role, question, transcript, frames }),
      });

      const result = await res.json();
      const params = new URLSearchParams({
        type,
        role,
        question,
        result: JSON.stringify(result),
      });
      router.push(`/results?${params.toString()}`);
    } catch {
      setError("Grading failed. Please try again.");
      setGrading(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (error) {
    return (
      <div className="rounded-xl bg-red-950 border border-red-700 p-6 text-red-300">
        {error}
      </div>
    );
  }

  if (grading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-12 w-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400 tracking-widest uppercase text-sm">
          Analyzing your response…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white font-mono">{fmt(elapsed)}</span>
          </div>
        )}
      </div>

      {recording && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 min-h-[80px] text-sm text-zinc-300 leading-relaxed">
          {finalTranscriptRef.current}
          <span className="text-zinc-500">{interimTranscript}</span>
        </div>
      )}

      <div className="flex justify-center">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold tracking-wide transition-colors"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold tracking-wide transition-colors"
          >
            Stop &amp; Grade
          </button>
        )}
      </div>
    </div>
  );
}
