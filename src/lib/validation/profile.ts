import { z } from "zod";

export const publicProfileSchema = z.object({
  avatarUrl: z
    .string()
    .url()
    .refine(
      (value) =>
        /^avatars\d*\.githubusercontent\.com$/.test(new URL(value).hostname) &&
        new URL(value).protocol === "https:",
    ),
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  url: z
    .string()
    .url()
    .refine((value) => new URL(value).origin === "https://github.com"),
  createdAt: z.string().datetime(),
  publicRepositories: z.number().int().nonnegative(),
});
