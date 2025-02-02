import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

// export const maxDuration = ;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content:
          "You are an experienced A-Level teacher. Carefully analyze the provided PDF document and generate a well-structured multiple-choice test with exactly 20 questions, ensuring a balanced difficulty distribution: 5 easy (recall-based), 5 medium (conceptual reasoning), and 10 hard (analytical, multi-step).Each question must have four answer options (A, B, C, D) of roughly equal length, with only one correct answer and plausible distractors.Ensure the questions align with A-Level exam standards, avoiding ambiguity and misleading phrasing.If unable to make 30,then recreate any previous one but it must be 30 questions at any cost.Include some numerical questions where possible.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Create a multiple choice test based on this document.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: questionSchema,
    output: "array",
    onFinish: ({ object }) => {
      const res = questionsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
}
