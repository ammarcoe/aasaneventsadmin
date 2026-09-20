import { z } from "zod";
import { normalizePakistanPhone } from "@/lib/utils";

export const organizerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number is required")
    .refine(
      (val) => {
        const norm = normalizePakistanPhone(val);
        return /^\+923\d{9}$/.test(norm);
      },
      {
        message: "Phone must be a valid Pakistan mobile number (+92 3XX XXXXXXX)",
      }
    ),
  avatarUrl: z.string().url("Invalid avatar URL").nullable().optional(),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").nullable().optional(),
  linkedUserId: z.string().nullable().optional(),
  linkedUserEmail: z.string().nullable().optional(),
  status: z.enum(["active", "suspended"]),
});

export type OrganizerFormValues = z.infer<typeof organizerSchema>;
