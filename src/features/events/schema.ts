import { z } from "zod";

export const eventImageSchema = z.object({
  id: z.string(),
  path: z.string(),
  sizes: z.object({
    s: z.string(),
    m: z.string(),
    l: z.string(),
  }),
  w: z.number().min(600, "Image too small (must be at least 600px wide)"),
  h: z.number(),
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
  fit: z.enum(["fill", "fit"]).default("fill"),
  bg: z.string().default("#FAF6F0"),
  alt: z.string().max(200, "Keep alt text under 200 characters").nullable().optional(),
});

export const agendaItemSchema = z.object({
  id: z.string(),
  time: z.string().min(1, "Time is required"),
  dayOffset: z.number().int().min(0).default(0),
  title: z.string().min(1, "Add a title for this item").max(80, "Keep title under 80 characters"),
  host: z.string().max(60, "Keep host under 60 characters").nullable().optional(),
  note: z.string().max(200, "Keep note under 200 characters").nullable().optional(),
});

export const faqItemSchema = z.object({
  id: z.string(),
  q: z.string().min(1, "Add a question").max(120, "Keep question under 120 characters"),
  a: z.string().min(1, "Add an answer").max(600, "Keep answer under 600 characters"),
});

export const ticketTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  pricePkr: z.coerce.number().int().min(0, "Price must be >= 0"),
  capacity: z.coerce.number().int().min(1, "Capacity must be >= 1"),
  soldCount: z.coerce.number().int().min(0).default(0),
  maxPerPerson: z.coerce.number().int().min(1).max(10, "Between 1 and 10").optional(),
});

export const eventSchemaV2 = z
  .object({
    title: z.string().min(1, "Add a title").max(80, "Keep it under 80 characters"),
    description: z.string().max(5000, "Keep it under 5000 characters").nullable().optional(),
    images: z.array(eventImageSchema).min(1, "Add a cover image").max(8, "Up to 8 images"),
    imageUrls: z.array(z.string()).default([]),
    categoryId: z.string().min(1, "Pick a category"),
    tags: z
      .array(z.string().max(24, "Tag must be under 24 characters"))
      .max(8, "Up to 8 tags")
      .default([]),
    startTime: z.date({ required_error: "Pick a start time" }),
    endTime: z.date().nullable().optional(),
    venueName: z.string().min(1, "Where is it?"),
    address: z.string().nullable().optional(),
    latitude: z
      .number({ invalid_type_error: "Latitude must be a number" })
      .min(23, "That location isn't in Pakistan — check lat/lng aren't swapped")
      .max(37, "That location isn't in Pakistan — check lat/lng aren't swapped")
      .nullable()
      .optional(),
    longitude: z
      .number({ invalid_type_error: "Longitude must be a number" })
      .min(60, "That location isn't in Pakistan — check lat/lng aren't swapped")
      .max(78, "That location isn't in Pakistan — check lat/lng aren't swapped")
      .nullable()
      .optional(),
    organizerId: z.string().nullable().optional(),
    organizerName: z.string().min(1, "Organizer name is required"),
    priceMinPkr: z.coerce.number().int().min(0).nullable().optional(),
    priceMaxPkr: z.coerce.number().int().min(0).nullable().optional(),
    ticketUrl: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
    // Paid events sold in the app: payout types that take the money (empty = all approved).
    payoutMethods: z.array(z.enum(["raast", "jazzcash", "easypaisa", "iban"])).default([]),
    // Form-only: the organizer has approved payout accounts and the event sells in the app.
    sellsInApp: z.boolean().optional(),
    ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type"),
    isFeatured: z.boolean().default(false),
    status: z
      .enum(["draft", "pending", "published", "rejected", "cancelled", "postponed"])
      .default("draft"),
    agenda: z.array(agendaItemSchema).max(20, "Up to 20 agenda items").default([]),
    faq: z.array(faqItemSchema).max(12, "Up to 12 FAQ items").default([]),
    amenities: z.array(z.string()).max(10).default([]),
    audience: z.array(z.string()).max(4).default([]),
    languages: z.array(z.string()).max(6).default([]),
    seriesId: z.string().nullable().optional(),
    seriesIndex: z.number().nullable().optional(),
    seriesCount: z.number().nullable().optional(),
  })
  .refine(
    (d) =>
      !((d.priceMinPkr ?? 0) > 0 || d.ticketTypes.some((t) => t.pricePkr > 0)) ||
      Boolean(d.ticketUrl && d.ticketUrl.length > 0) ||
      d.sellsInApp === true,
    {
      message: "Paid events need a ticket link, or an organizer with approved payment accounts",
      path: ["ticketUrl"],
    }
  )
  .refine((d) => !d.endTime || d.endTime > d.startTime, {
    message: "End must be after start",
    path: ["endTime"],
  })
  .refine(
    (d) =>
      !d.endTime ||
      d.endTime.getTime() - d.startTime.getTime() <= 7 * 24 * 60 * 60 * 1000,
    {
      message: "End must be within 7 days of start",
      path: ["endTime"],
    }
  )
  .refine((d) => !d.priceMaxPkr || !d.priceMinPkr || d.priceMaxPkr >= d.priceMinPkr, {
    message: "Max must be more than min",
    path: ["priceMaxPkr"],
  });

export const eventSchema = eventSchemaV2;

export type EventImageFormValues = z.infer<typeof eventImageSchema>;
export type AgendaItemFormValues = z.infer<typeof agendaItemSchema>;
export type FaqItemFormValues = z.infer<typeof faqItemSchema>;
export type EventFormValues = z.infer<typeof eventSchemaV2>;
export type TicketTypeFormValues = z.infer<typeof ticketTypeSchema>;
