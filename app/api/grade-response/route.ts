import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { InterviewType, GradingResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const {
    type,
    role,
    question,
    transcript,
    frames,
  }: {
    type: InterviewType;
    role: string;
    question: string;
    transcript: string;
    frames: string[];
  } = await req.json();

  const rubric = `You are an expert interview coach grading a ${type} interview response for a ${role} position.

Question asked: "${question}"

The three images are frames captured at 10%, 50%, and 90% of the candidate's video response. Use them to assess delivery (eye contact, posture, confidence, expressions).

Candidate's transcript:
"""
${transcript}
"""

Grade the response and return ONLY valid JSON matching this exact shape — no markdown, no extra text:
{
  "contentScore": <integer 0-100>,
  "deliveryScore": <integer 0-100>,
  "overallScore": <integer 0-100>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "contentFeedback": "<paragraph>",
  "deliveryFeedback": "<paragraph>"
}

Scoring rubric:
- contentScore: relevance, structure, specificity, use of examples
- deliveryScore: eye contact, posture, confidence, pacing (inferred from frames + fluency of transcript)
- overallScore: weighted average (70% content, 30% delivery)
- strengths: 2-3 specific things done well
- improvements: 2-3 specific, actionable suggestions`;

  const imageParts = frames.map((b64) => ({
    inlineData: { data: b64, mimeType: "image/jpeg" },
  }));

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [...imageParts, { text: rubric }] }],
  });

  const raw = result.text?.trim() ?? "{}";
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  const grading: GradingResult = JSON.parse(json);
  return NextResponse.json(grading);
}
