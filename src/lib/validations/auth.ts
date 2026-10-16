import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  organizationName: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
