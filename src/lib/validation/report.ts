import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Enter a GitHub username.")
  .max(39, "Usernames have at most 39 characters.")
  .regex(
    /^[a-z\d](?:[a-z\d]|-(?=[a-z\d]))*$/i,
    "Use letters, numbers, and single hyphens; start and end with a letter or number.",
  );

export function reportRequestSchema(currentYear: number) {
  return z.discriminatedUnion("mode", [
    z.object({
      username: usernameSchema,
      mode: z.literal("yearly"),
      year: z.number().int().min(2008).max(currentYear),
    }),
    z.object({ username: usernameSchema, mode: z.literal("all-time") }),
  ]);
}
