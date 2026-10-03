import {
  FirestoreDataConverter,
  Timestamp,
  GeoPoint,
  serverTimestamp,
} from "firebase/firestore";
import type { Event, Organizer, Registration, TicketType, EventImage } from "@/types";

export function parseEventImages(d: Record<string, unknown>): EventImage[] {
  if (Array.isArray(d.images) && d.images.length > 0) {
    return d.images.map((img: Record<string, unknown>, idx: number) => {
      const sizes = (img.sizes as Record<string, string>) || {};
      const fallbackUrl = (img.url as string) || (img.path as string) || "";
      return {
        id: (img.id as string) || `img_${idx}`,
        path: (img.path as string) || fallbackUrl,
        sizes: {
          s: sizes.s || sizes.m || sizes.l || fallbackUrl,
          m: sizes.m || sizes.l || fallbackUrl,
          l: sizes.l || fallbackUrl,
        },
        w: Number(img.w || 1200),
        h: Number(img.h || 800),
        focalX: typeof img.focalX === "number" ? img.focalX : 0.5,
        focalY: typeof img.focalY === "number" ? img.focalY : 0.5,
        fit: (img.fit as "fill" | "fit") || "fill",
        bg: (img.bg as string) || "#FAF6F0",
        alt: (img.alt as string) || null,
      };
    });
  }
  if (Array.isArray(d.imageUrls) && d.imageUrls.length > 0) {
    return d.imageUrls.map((url: string, idx: number) => ({
      id: `legacy_${idx}`,
      path: url,
      sizes: { s: url, m: url, l: url },
      w: 1200,
      h: 800,
      focalX: 0.5,
      focalY: 0.5,
      fit: "fill" as const,
      bg: "#FAF6F0",
      alt: null,
    }));
  }
  return [];
}

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore: (e) => {
    const ev = e as Event;
    const derivedImageUrls =
      Array.isArray(ev.images) && ev.images.length > 0
        ? ev.images.map((i) => i.sizes?.l || i.path)
        : ev.imageUrls ?? [];

    const data: Record<string, unknown> = {
      title: ev.title,
      description: ev.description ?? null,
      images: ev.images ?? [],
      imageUrls: derivedImageUrls,
      categoryId: ev.categoryId,
      tags: ev.tags ?? [],
      startTime: ev.startTime instanceof Date ? Timestamp.fromDate(ev.startTime) : null,
      endTime: ev.endTime instanceof Date ? Timestamp.fromDate(ev.endTime) : null,
      venueName: ev.venueName,
      address: ev.address ?? null,
      organizerId: ev.organizerId ?? null,
      organizerName: ev.organizerName,
      priceMinPkr: typeof ev.priceMinPkr === "number" ? ev.priceMinPkr : null,
      priceMaxPkr: typeof ev.priceMaxPkr === "number" ? ev.priceMaxPkr : null,
      ticketUrl: ev.ticketUrl ?? null,
      payoutMethods: Array.isArray(ev.payoutMethods) ? ev.payoutMethods : [],
      ticketTypes: Array.isArray(ev.ticketTypes)
        ? ev.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            ...toAppTicketPrice(t),
            capacity: Number(t.capacity || 0),
            soldCount: Number(t.soldCount || 0),
          }))
        : [],
      isFeatured: Boolean(ev.isFeatured),
      status: ev.status || "draft",
      agenda: Array.isArray(ev.agenda) ? ev.agenda : [],
      faq: Array.isArray(ev.faq) ? ev.faq : [],
      amenities: Array.isArray(ev.amenities) ? ev.amenities : [],
      audience: Array.isArray(ev.audience) ? ev.audience : [],
      languages: Array.isArray(ev.languages) ? ev.languages : [],
      seriesId: ev.seriesId ?? null,
      seriesIndex: typeof ev.seriesIndex === "number" ? ev.seriesIndex : null,
      seriesCount: typeof ev.seriesCount === "number" ? ev.seriesCount : null,
      mapImageUrl: ev.mapImageUrl ?? null,
      updatedAt: serverTimestamp(),
    };

    if (typeof ev.latitude === "number" && typeof ev.longitude === "number") {
      const gp = new GeoPoint(ev.latitude, ev.longitude);
      data.geo = gp;
      data.location = gp;
      data.latitude = ev.latitude;
      data.longitude = ev.longitude;
    } else {
      data.geo = null;
      data.location = null;
      data.latitude = null;
      data.longitude = null;
    }

    if (ev.reviewedAt instanceof Date) {
      data.reviewedAt = Timestamp.fromDate(ev.reviewedAt);
    }
    if (ev.reviewedBy) {
      data.reviewedBy = ev.reviewedBy;
    }
    if (ev.rejectionReason) {
      data.rejectionReason = ev.rejectionReason;
    }
    if (ev.createdAt instanceof Date) {
      data.createdAt = Timestamp.fromDate(ev.createdAt);
    }

    // Filter out undefined values so Firestore never throws unsupported field value undefined
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }

    return data;
  },
  fromFirestore: (snap) => {
    const d = snap.data();

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (d.geo instanceof GeoPoint) {
      latitude = d.geo.latitude;
      longitude = d.geo.longitude;
    } else if (d.location instanceof GeoPoint) {
      latitude = d.location.latitude;
      longitude = d.location.longitude;
    } else if (typeof d.latitude === "number" && typeof d.longitude === "number") {
      latitude = d.latitude;
      longitude = d.longitude;
    }

    const startTime = d.startTime instanceof Timestamp ? d.startTime.toDate() : new Date();
    const endTime = d.endTime instanceof Timestamp ? d.endTime.toDate() : null;
    const createdAt = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : undefined;
    const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : undefined;
    const reviewedAt = d.reviewedAt instanceof Timestamp ? d.reviewedAt.toDate() : null;

    const ticketTypes: TicketType[] = Array.isArray(d.ticketTypes)
      ? d.ticketTypes.map((t: Record<string, unknown>, idx: number) => ({
          id: (t.id as string) || `ticket-${idx}`,
          name: (t.name as string) || "Standard",
          // The app and payment server use priceInPkr / maxPerOrder; older admin docs only have pricePkr.
          pricePkr: Number(t.priceInPkr ?? t.pricePkr ?? 0),
          capacity: Number(t.capacity ?? 0),
          soldCount: Number(t.soldCount ?? 0),
          maxPerPerson:
            t.maxPerPerson != null ? Number(t.maxPerPerson) : t.maxPerOrder != null ? Number(t.maxPerOrder) : undefined,
        }))
      : [];

    const totalSold = ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);
    const totalCapacity = ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);

    const images = parseEventImages(d);

    return {
      id: snap.id,
      title: d.title || "",
      description: d.description ?? null,
      images,
      imageUrls: Array.isArray(d.imageUrls)
        ? d.imageUrls
        : images.map((i) => i.sizes.l),
      categoryId: d.categoryId || "",
      tags: Array.isArray(d.tags) ? d.tags : [],
      startTime,
      endTime,
      venueName: d.venueName || "",
      address: d.address ?? null,
      latitude,
      longitude,
      organizerId: d.organizerId ?? null,
      organizerName: d.organizerName || "",
      priceMinPkr: d.priceMinPkr != null ? Number(d.priceMinPkr) : null,
      priceMaxPkr: d.priceMaxPkr != null ? Number(d.priceMaxPkr) : null,
      ticketUrl: d.ticketUrl ?? null,
      payoutMethods: Array.isArray(d.payoutMethods) ? d.payoutMethods : [],
      ticketTypes,
      isFeatured: Boolean(d.isFeatured),
      status: d.status || "draft",
      agenda: Array.isArray(d.agenda) ? d.agenda : [],
      faq: Array.isArray(d.faq) ? d.faq : [],
      amenities: Array.isArray(d.amenities) ? d.amenities : [],
      audience: Array.isArray(d.audience) ? d.audience : [],
      languages: Array.isArray(d.languages) ? d.languages : [],
      seriesId: (d.seriesId as string) ?? null,
      seriesIndex: typeof d.seriesIndex === "number" ? d.seriesIndex : null,
      seriesCount: typeof d.seriesCount === "number" ? d.seriesCount : null,
      soldCount: d.soldCount != null ? Number(d.soldCount) : totalSold,
      capacity: d.capacity != null ? Number(d.capacity) : totalCapacity,
      mapImageUrl: d.mapImageUrl ?? null,
      createdAt,
      updatedAt,
      reviewedAt,
      reviewedBy: d.reviewedBy ?? null,
      rejectionReason: d.rejectionReason ?? null,
    };
  },
};

export const organizerConverter: FirestoreDataConverter<Organizer> = {
  toFirestore: (org) => {
    const o = org as Organizer;
    const result: Record<string, unknown> = {
      name: o.name,
      email: o.email,
      phone: o.phone,
      avatarUrl: o.avatarUrl ?? null,
      bio: o.bio ?? null,
      linkedUserId: o.linkedUserId ?? null,
      linkedUserEmail: o.linkedUserEmail ?? null,
      status: o.status || "active",
      eventCount: Number(o.eventCount || 0),
      upcomingEventCount: Number(o.upcomingEventCount || 0),
      updatedAt: serverTimestamp(),
      ...(o.createdAt instanceof Date ? { createdAt: Timestamp.fromDate(o.createdAt) } : {}),
    };

    for (const key of Object.keys(result)) {
      if (result[key] === undefined) {
        delete result[key];
      }
    }

    return result;
  },
  fromFirestore: (snap) => {
    const d = snap.data();
    return {
      id: snap.id,
      name: d.name || "",
      email: d.email || "",
      phone: d.phone || "",
      avatarUrl: d.avatarUrl ?? null,
      bio: d.bio ?? null,
      linkedUserId: d.linkedUserId ?? null,
      linkedUserEmail: d.linkedUserEmail ?? null,
      status: d.status || "active",
      acceptsPayments: d.acceptsPayments === true,
      eventCount: Number(d.eventCount || 0),
      upcomingEventCount: Number(d.upcomingEventCount || 0),
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : undefined,
      updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : undefined,
    };
  },
};

/**
 * Ticket price fields as the app and the payment server read them (priceInPkr,
 * maxPerOrder), plus the admin's own names so older readers keep working.
 */
export function toAppTicketPrice(t: { pricePkr?: number | null; maxPerPerson?: number | null }) {
  const price = Number(t.pricePkr || 0);
  const max = t.maxPerPerson ? Number(t.maxPerPerson) : null;
  return { pricePkr: price, priceInPkr: price, maxPerPerson: max, maxPerOrder: max ?? 8 };
}

export const registrationConverter: FirestoreDataConverter<Registration> = {
  toFirestore: (r) => {
    const reg = r as Registration;
    return {
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      userId: reg.userId,
      userEmail: reg.userEmail,
      userName: reg.userName,
      userPhone: reg.userPhone ?? null,
      status: reg.status || "confirmed",
      checkedIn: Boolean(reg.checkedIn),
      ticketTypeId: reg.ticketTypeId,
      ticketTypeName: reg.ticketTypeName,
      quantity: Number(reg.quantity || 1),
      totalPkr: Number(reg.totalPkr || 0),
      createdAt: reg.createdAt instanceof Date ? Timestamp.fromDate(reg.createdAt) : serverTimestamp(),
    };
  },
  fromFirestore: (snap) => {
    const d = snap.data();
    // App registrations: firstName/lastName, phone, quantityByTicketType, amountPkr, payment.
    const qtyMap = (d.quantityByTicketType ?? {}) as Record<string, number>;
    const appQty = Object.values(qtyMap).reduce((a, b) => a + Number(b || 0), 0);
    const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);
    const p = d.payment;
    return {
      id: snap.id,
      eventId: d.eventId || "",
      eventTitle: d.eventTitle || "",
      userId: d.userId || "",
      userEmail: d.userEmail || d.email || "",
      userName: d.userName || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim(),
      userPhone: d.userPhone || d.phone || "",
      status: d.status || "confirmed",
      checkedIn: Boolean(d.checkedIn || d.checkedInAt),
      ticketTypeId: d.ticketTypeId || Object.keys(qtyMap)[0] || "",
      ticketTypeName: d.ticketTypeName || "",
      quantity: Number(d.quantity || appQty || 1),
      totalPkr: Number(d.totalPkr ?? d.amountPkr ?? 0),
      organizerId: d.organizerId ?? null,
      reference: d.reference || "",
      payment: p
        ? {
            method: p.method ?? null,
            transactionId: p.transactionId ?? null,
            proofPath: p.proofPath ?? null,
            submittedAt: toDate(p.submittedAt),
            holdExpiresAt: toDate(p.holdExpiresAt),
            rejectionReason: p.rejectionReason ?? null,
          }
        : null,
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    };
  },
};
