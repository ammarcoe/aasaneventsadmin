import { z } from "zod";

export const ticketTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  pricePkr: z.coerce.number().int().min(0, "Price must be >= 0"),
  capacity: z.coerce.number().int().min(1, "Capacity must be >= 1"),
  soldCount: z.coerce.number().int().min(0).default(0),
  maxPerPerson: z.coerce.number().int().min(1).optional(),
});

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(80, "Title cannot exceed 80 characters"),
    description: z.string().max(5000, "Description cannot exceed 5000 characters").nullable().optional(),
    imageUrls: z.array(z.string().url("Valid image URL required")).min(1, "At least one image"),
    categoryId: z.string().min(1, "Category is required"),
    tags: z.array(z.string()).max(8, "Maximum 8 tags").default([]),
    startTime: z.date({ required_error: "Start time is required" }),
    endTime: z.date().nullable().optional(),
    venueName: z.string().min(1, "Venue name is required"),
    address: z.string().nullable().optional(),
    latitude: z
      .number({ invalid_type_error: "Latitude must be a number" })
      .min(23, "Latitude must be in Pakistan (23 - 37)")
      .max(37, "Latitude must be in Pakistan (23 - 37)")
      .nullable()
      .optional(),
    longitude: z
      .number({ invalid_type_error: "Longitude must be a number" })
      .min(60, "Longitude must be in Pakistan (60 - 78)")
      .max(78, "Longitude must be in Pakistan (60 - 78)")
      .nullable()
      .optional(),
    organizerId: z.string().nullable().optional(),
    organizerName: z.string().min(1, "Organizer name is required"),
    priceMinPkr: z.coerce.number().int().min(0).nullable().optional(),
    priceMaxPkr: z.coerce.number().int().min(0).nullable().optional(),
    ticketUrl: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
    ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type"),
    isFeatured: z.boolean().default(false),
    status: z
      .enum(["draft", "pending", "published", "rejected", "cancelled", "postponed"])
      .default("draft"),
  })
  .refine(
    (d) => !(d.priceMinPkr && d.priceMinPkr > 0) || Boolean(d.ticketUrl && d.ticketUrl.length > 0),
    { message: "Paid events need a ticket link", path: ["ticketUrl"] }
  )
  .refine((d) => !d.endTime || d.endTime > d.startTime, {
    message: "End must be after start",
    path: ["endTime"],
  })
  .refine((d) => !d.priceMaxPkr || !d.priceMinPkr || d.priceMaxPkr >= d.priceMinPkr, {
    message: "Max must exceed or equal min",
    path: ["priceMaxPkr"],
  });

export type EventFormValues = z.infer<typeof eventSchema>;
export type TicketTypeFormValues = z.infer<typeof ticketTypeSchema>;
