import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { InterviewType } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { type, role }: { type: InterviewType; role: string } = await req.json();

  const prompt =
    type === "behavioral"
      ? `You are an expert interviewer specializing in behavioral interviews. Generate a single, challenging behavioral interview question for a ${role} candidate. The question should use the STAR method framework and probe for real experiences. Return only the question text, nothing else.`
      : `You are an expert technical interviewer. Generate a single, challenging technical interview question appropriate for a ${role} candidate. It should test conceptual understanding, problem-solving, or system design relevant to the role. Return only the question text, nothing else.`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const question = result.text?.trim() ?? "";

  return NextResponse.json({ question });
}
