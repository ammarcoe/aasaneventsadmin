import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  getCountFromServer,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { eventConverter, organizerConverter, registrationConverter } from "@/lib/converters";
import type { Event, EventFilter, TicketType } from "@/types";
import type { EventFormValues } from "./schema";

const eventsCol = collection(db, "events").withConverter(eventConverter);

export interface FetchEventsParams {
  filter?: EventFilter;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<Event> | null;
}

export interface FetchEventsResult {
  events: Event[];
  lastDoc: QueryDocumentSnapshot<Event> | null;
  hasMore: boolean;
}

export async function fetchEvents({
  filter,
  pageSize = 50,
  lastDoc,
}: FetchEventsParams = {}): Promise<FetchEventsResult> {
  const constraints: import("firebase/firestore").QueryConstraint[] = [];

  if (filter?.status && filter.status !== "all" && filter.status !== "past") {
    constraints.push(where("status", "==", filter.status));
  }

  if (filter?.status === "past") {
    constraints.push(where("startTime", "<", new Date()));
    constraints.push(orderBy("startTime", "desc"));
  } else {
    constraints.push(orderBy("startTime", "desc"));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  constraints.push(limit(pageSize));

  const q = query(eventsCol, ...constraints);
  const snap = await getDocs(q);

  const events = snap.docs.map((d) => d.data());
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    events,
    lastDoc: newLastDoc,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function fetchEvent(id: string): Promise<Event | null> {
  const docRef = doc(db, "events", id).withConverter(eventConverter);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function fetchPendingEvents(): Promise<Event[]> {
  const q = query(
    eventsCol,
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

/**
 * Recalculate organizer's eventCount and upcomingEventCount
 */
export async function recomputeOrganizerCounts(organizerId: string): Promise<void> {
  if (!organizerId) return;
  try {
    const totalQ = query(
      collection(db, "events"),
      where("organizerId", "==", organizerId),
      where("status", "==", "published")
    );
    const totalSnap = await getCountFromServer(totalQ);
    const totalPublished = totalSnap.data().count;

    const upcomingQ = query(
      collection(db, "events"),
      where("organizerId", "==", organizerId),
      where("status", "==", "published"),
      where("startTime", ">=", new Date())
    );
    const upcomingSnap = await getCountFromServer(upcomingQ);
    const upcomingCount = upcomingSnap.data().count;

    const orgRef = doc(db, "organizers", organizerId);
    await updateDoc(orgRef, {
      eventCount: totalPublished,
      upcomingEventCount: upcomingCount,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to recompute organizer event counts:", err);
  }
}

/**
 * Creates an event as draft
 */
export async function createEvent(data: EventFormValues): Promise<string> {
  const newDoc = await addDoc(eventsCol, {
    id: "",
    title: data.title,
    description: data.description ?? null,
    imageUrls: data.imageUrls,
    categoryId: data.categoryId,
    tags: data.tags,
    startTime: data.startTime,
    endTime: data.endTime ?? null,
    venueName: data.venueName,
    address: data.address ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    organizerId: data.organizerId ?? null,
    organizerName: data.organizerName,
    priceMinPkr: data.priceMinPkr ?? null,
    priceMaxPkr: data.priceMaxPkr ?? null,
    ticketUrl: data.ticketUrl || null,
    ticketTypes: data.ticketTypes.map((t) => ({
      ...t,
      soldCount: 0,
    })),
    isFeatured: data.isFeatured,
    status: data.status || "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newDoc.id;
}

import { stripAppOwnedFields } from "./constants";

/**
 * Updates an event preserving existing soldCount on ticket types and checking concurrent edits
 */
export async function updateEvent(
  id: string,
  data: Partial<EventFormValues>,
  existingEvent?: Event | null
): Promise<void> {
  const docRef = doc(db, "events", id);

  // 1. Concurrent Edit Detection
  if (existingEvent?.updatedAt) {
    const currentSnap = await getDoc(docRef.withConverter(eventConverter));
    if (currentSnap.exists()) {
      const currentData = currentSnap.data();
      if (
        currentData.updatedAt &&
        currentData.updatedAt.getTime() > existingEvent.updatedAt.getTime() + 1000
      ) {
        throw new Error(
          "CONCURRENT_EDIT_CONFLICT: This event was modified by another session or administrator while you were editing. Please refresh to load the latest version before saving."
        );
      }
    }
  }

  // 2. Preserve soldCount on ticket types
  let mergedTickets = data.ticketTypes;
  if (data.ticketTypes && existingEvent?.ticketTypes) {
    const existingMap = new Map<string, number>(
      existingEvent.ticketTypes.map((t) => [t.id, t.soldCount || 0])
    );
    mergedTickets = data.ticketTypes.map((t) => ({
      ...t,
      soldCount: existingMap.get(t.id) ?? t.soldCount ?? 0,
    }));
  }

  // 3. Strip app-owned consumer fields
  const cleanData = stripAppOwnedFields(data as Record<string, unknown>);

  const updates: Record<string, unknown> = {
    ...cleanData,
    updatedAt: serverTimestamp(),
  };

  if (mergedTickets) {
    updates.ticketTypes = mergedTickets;
  }

  if (data.startTime instanceof Date) {
    updates.startTime = Timestamp.fromDate(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.endTime = data.endTime instanceof Date ? Timestamp.fromDate(data.endTime) : null;
  }

  if (typeof data.latitude === "number" && typeof data.longitude === "number") {
    const gp = new GeoPoint(data.latitude, data.longitude);
    updates.geo = gp;
    updates.location = gp;
    updates.latitude = data.latitude;
    updates.longitude = data.longitude;
  } else if (data.latitude === null || data.longitude === null) {
    updates.geo = null;
    updates.location = null;
    updates.latitude = null;
    updates.longitude = null;
  }

  // Remove undefined values so Firestore does not throw unsupported field value error
  for (const key of Object.keys(updates)) {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  }

  await updateDoc(docRef, updates);

  if (existingEvent?.organizerId) {
    await recomputeOrganizerCounts(existingEvent.organizerId);
  }
}

/**
 * Cancel an event with a reason and unfeature it
 */
export async function cancelEvent(
  id: string,
  reason?: string,
  organizerId?: string | null
): Promise<void> {
  const docRef = doc(db, "events", id);
  await updateDoc(docRef, {
    status: "cancelled",
    rejectionReason: reason?.trim() || null,
    isFeatured: false,
    updatedAt: serverTimestamp(),
  });

  if (organizerId) {
    await recomputeOrganizerCounts(organizerId);
  }
}

/**
 * Postpone an event with an optional rescheduled start/end time and reason
 */
export async function postponeEvent(
  id: string,
  params: {
    newStartTime?: Date | null;
    newEndTime?: Date | null;
    reason?: string;
  },
  organizerId?: string | null
): Promise<void> {
  const docRef = doc(db, "events", id);
  const updates: Record<string, unknown> = {
    status: "postponed",
    rejectionReason: params.reason?.trim() || null,
    updatedAt: serverTimestamp(),
  };

  if (params.newStartTime instanceof Date) {
    updates.startTime = Timestamp.fromDate(params.newStartTime);
  }
  if (params.newEndTime instanceof Date) {
    updates.endTime = Timestamp.fromDate(params.newEndTime);
  }

  await updateDoc(docRef, updates);

  if (organizerId) {
    await recomputeOrganizerCounts(organizerId);
  }
}

/**
 * Publish event with reviewer record
 */
export async function publishEvent(
  id: string,
  adminUid: string,
  organizerId?: string | null
): Promise<void> {
  const docRef = doc(db, "events", id);
  await updateDoc(docRef, {
    status: "published",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    updatedAt: serverTimestamp(),
  });

  if (organizerId) {
    await recomputeOrganizerCounts(organizerId);
  }
}

/**
 * Reject event with reason
 */
export async function rejectEvent(
  id: string,
  adminUid: string,
  reason: string
): Promise<void> {
  const docRef = doc(db, "events", id);
  await updateDoc(docRef, {
    status: "rejected",
    rejectionReason: reason,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggle featured state inline
 */
export async function toggleFeaturedEvent(id: string, currentFeatured: boolean): Promise<void> {
  const docRef = doc(db, "events", id);
  await updateDoc(docRef, {
    isFeatured: !Boolean(currentFeatured),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete event (only allowed if drafts or 0 registrations)
 */
export async function deleteEvent(id: string, organizerId?: string | null): Promise<void> {
  // Check registrations
  const regQ = query(
    collection(db, "registrations").withConverter(registrationConverter),
    where("eventId", "==", id)
  );
  const regSnap = await getCountFromServer(regQ);
  if (regSnap.data().count > 0) {
    throw new Error("Cannot delete event: registrations exist. Use Cancel instead.");
  }

  const docRef = doc(db, "events", id);
  await deleteDoc(docRef);

  if (organizerId) {
    await recomputeOrganizerCounts(organizerId);
  }
}

/**
 * Upload event image with progress and poll for resized variant
 */
export async function uploadEventImage(
  eventId: string,
  file: Blob | File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const imageId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const originalPath = `events/${eventId}/${imageId}.jpg`;
  const storageRef = ref(storage, originalPath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: "image/jpeg",
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  const originalUrl = await getDownloadURL(storageRef);

  // Poll for resized _800x800 variant if Image Resizer extension is configured
  const resizedPath = `events/${eventId}/${imageId}_800x800.jpg`;
  const resizedRef = ref(storage, resizedPath);

  const pollResized = async (): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await new Promise((res) => setTimeout(res, 1200));
        const resizedUrl = await getDownloadURL(resizedRef);
        if (resizedUrl) return resizedUrl;
      } catch {
        // Still processing or extension not installed
      }
    }
    return originalUrl;
  };

  try {
    return await pollResized();
  } catch {
    return originalUrl;
  }
}

/**
 * Duplicate event: clones fields, shifts date, resets counts and status to 'draft'
 */
export async function duplicateEvent(
  source: Event,
  options?: { shiftDays?: number; newTitle?: string; cloneImages?: boolean }
): Promise<string> {
  const shiftMs = (options?.shiftDays ?? 7) * 24 * 60 * 60 * 1000;
  const newStartTime = new Date(source.startTime.getTime() + shiftMs);
  const newEndTime = source.endTime ? new Date(source.endTime.getTime() + shiftMs) : null;

  const duplicatedTickets: TicketType[] = source.ticketTypes.map((t, idx) => ({
    ...t,
    id: `ticket_${Date.now()}_${idx}`,
    soldCount: 0,
  }));

  const keepImages = options?.cloneImages !== false;

  const newDoc = await addDoc(eventsCol, {
    id: "",
    title: options?.newTitle || `${source.title} (Copy)`,
    description: source.description,
    imageUrls: keepImages ? source.imageUrls : [],
    categoryId: source.categoryId,
    tags: source.tags,
    startTime: newStartTime,
    endTime: newEndTime,
    venueName: source.venueName,
    address: source.address,
    latitude: source.latitude,
    longitude: source.longitude,
    organizerId: source.organizerId,
    organizerName: source.organizerName,
    priceMinPkr: source.priceMinPkr,
    priceMaxPkr: source.priceMaxPkr,
    ticketUrl: source.ticketUrl,
    ticketTypes: duplicatedTickets,
    isFeatured: false,
    status: "draft",
    mapImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newDoc.id;
}
