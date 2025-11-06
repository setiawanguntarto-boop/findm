import { z } from "zod";

export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email must be less than 254 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  company: z.string()
    .trim()
    .max(150, "Company must be less than 150 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  title: z.string()
    .trim()
    .max(100, "Title must be less than 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  context_notes: z.string()
    .trim()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  meeting_location: z.string()
    .trim()
    .max(200, "Meeting location must be less than 200 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  meeting_date: z.string()
    .optional()
    .nullable()
    .or(z.literal("")),
  tags: z.array(z.string().trim().max(50))
    .optional()
    .nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;
