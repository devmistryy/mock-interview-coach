export type InterviewType = "behavioral" | "technical";

export interface InterviewSession {
  type: InterviewType;
  role: string;
  question: string;
}

export interface GradingResult {
  contentScore: number;
  deliveryScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  contentFeedback: string;
  deliveryFeedback: string;
}
