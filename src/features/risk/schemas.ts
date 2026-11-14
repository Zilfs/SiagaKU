import { z } from "zod";

export const ExplanationSchema = z.object({
  explanation: z.string().max(400),
  mainAction: z.string().max(120),
});

export type Explanation = z.infer<typeof ExplanationSchema>;
