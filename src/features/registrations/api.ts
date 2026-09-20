import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { registrationConverter } from "@/lib/converters";
import type { Registration } from "@/types";

export async function fetchEventRegistrations(eventId: string): Promise<Registration[]> {
  try {
    const q = query(
      collection(db, "registrations").withConverter(registrationConverter),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    // If composite index is building or not yet provisioned, fallback to simple where
    console.warn("Ordered registrations query failed, trying unordered fallback:", err);
    const fallbackQ = query(
      collection(db, "registrations").withConverter(registrationConverter),
      where("eventId", "==", eventId)
    );
    const snap = await getDocs(fallbackQ);
    const results = snap.docs.map((d) => d.data());
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function toggleCheckIn(registrationId: string, current: boolean): Promise<void> {
  const docRef = doc(db, "registrations", registrationId);
  await updateDoc(docRef, {
    checkedIn: !current,
    checkedInAt: !current ? serverTimestamp() : null,
  });
}
