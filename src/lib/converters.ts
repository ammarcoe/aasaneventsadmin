import {
  FirestoreDataConverter,
  Timestamp,
  GeoPoint,
  serverTimestamp,
} from "firebase/firestore";
import type { Event, Organizer, Registration, TicketType } from "@/types";

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore: (e) => {
    const ev = e as Event;
    const data: Record<string, unknown> = {
      title: ev.title,
      description: ev.description ?? null,
      imageUrls: ev.imageUrls ?? [],
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
      ticketTypes: Array.isArray(ev.ticketTypes)
        ? ev.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            pricePkr: Number(t.pricePkr || 0),
            capacity: Number(t.capacity || 0),
            soldCount: Number(t.soldCount || 0),
            maxPerPerson: t.maxPerPerson ? Number(t.maxPerPerson) : null,
          }))
        : [],
      isFeatured: Boolean(ev.isFeatured),
      status: ev.status || "draft",
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
          pricePkr: Number(t.pricePkr ?? 0),
          capacity: Number(t.capacity ?? 0),
          soldCount: Number(t.soldCount ?? 0),
          maxPerPerson: t.maxPerPerson != null ? Number(t.maxPerPerson) : undefined,
        }))
      : [];

    const totalSold = ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);
    const totalCapacity = ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);

    return {
      id: snap.id,
      title: d.title || "",
      description: d.description ?? null,
      imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls : [],
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
      ticketTypes,
      isFeatured: Boolean(d.isFeatured),
      status: d.status || "draft",
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
      eventCount: Number(d.eventCount || 0),
      upcomingEventCount: Number(d.upcomingEventCount || 0),
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : undefined,
      updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : undefined,
    };
  },
};

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
    return {
      id: snap.id,
      eventId: d.eventId || "",
      eventTitle: d.eventTitle || "",
      userId: d.userId || "",
      userEmail: d.userEmail || "",
      userName: d.userName || "",
      userPhone: d.userPhone || d.phone || "",
      status: d.status || "confirmed",
      checkedIn: Boolean(d.checkedIn),
      ticketTypeId: d.ticketTypeId || "",
      ticketTypeName: d.ticketTypeName || "",
      quantity: Number(d.quantity || 1),
      totalPkr: Number(d.totalPkr || 0),
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    };
  },
};
