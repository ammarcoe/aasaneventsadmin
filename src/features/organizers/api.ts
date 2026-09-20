import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "@/lib/firebase";
import { organizerConverter, eventConverter } from "@/lib/converters";
import type { Organizer } from "@/types";
import type { OrganizerFormValues } from "./schema";

const organizersCol = collection(db, "organizers").withConverter(organizerConverter);

export async function fetchOrganizers(): Promise<Organizer[]> {
  const q = query(organizersCol, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function fetchOrganizer(id: string): Promise<Organizer | null> {
  const docRef = doc(db, "organizers", id).withConverter(organizerConverter);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function createOrganizer(data: OrganizerFormValues): Promise<string> {
  const newDoc = await addDoc(organizersCol, {
    id: "",
    name: data.name,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatarUrl ?? null,
    bio: data.bio ?? null,
    linkedUserId: data.linkedUserId ?? null,
    linkedUserEmail: data.linkedUserEmail ?? null,
    status: data.status,
    eventCount: 0,
    upcomingEventCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return newDoc.id;
}

export async function updateOrganizer(
  id: string,
  data: Partial<OrganizerFormValues>,
  previousName?: string
): Promise<void> {
  const docRef = doc(db, "organizers", id);
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  for (const key of Object.keys(updates)) {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  }
  await updateDoc(docRef, updates);

  // Rename cascade: updates every event's organizerName
  if (data.name && previousName && data.name !== previousName) {
    try {
      const eventsQuery = query(
        collection(db, "events").withConverter(eventConverter),
        where("organizerId", "==", id)
      );
      const eventsSnap = await getDocs(eventsQuery);
      if (!eventsSnap.empty) {
        const chunks = [];
        for (let i = 0; i < eventsSnap.docs.length; i += 450) {
          chunks.push(eventsSnap.docs.slice(i, i + 450));
        }
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach((eventDoc) => {
            batch.update(eventDoc.ref, {
              organizerName: data.name,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }
    } catch (cascadeError) {
      console.error("Rename cascade failed for organizer events:", cascadeError);
      throw new Error("Organizer updated, but cascading event names failed: " + (cascadeError instanceof Error ? cascadeError.message : "Unknown error"));
    }
  }
}

export async function toggleOrganizerSuspend(
  id: string,
  currentStatus: "active" | "suspended"
): Promise<void> {
  const docRef = doc(db, "organizers", id);
  const nextStatus = currentStatus === "active" ? "suspended" : "active";
  await updateDoc(docRef, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadOrganizerAvatar(
  organizerId: string,
  file: Blob | File
): Promise<string> {
  const filename = `avatar_${Date.now()}.jpg`;
  const storageRef = ref(storage, `organizers/${organizerId}/${filename}`);
  await uploadBytes(storageRef, file, { contentType: "image/jpeg" });
  return await getDownloadURL(storageRef);
}

export interface UserLookupResult {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  isAdmin?: boolean;
  linkedOrganizerId?: string | null;
}

/**
 * Callable Cloud Function to find user by email
 */
export async function findUserByEmail(email: string): Promise<UserLookupResult | null> {
  try {
    const callable = httpsCallable<{ email: string }, UserLookupResult>(
      functions,
      "findUserByEmail"
    );
    const res = await callable({ email: email.trim().toLowerCase() });
    return res.data;
  } catch (error: unknown) {
    const fbErr = error as { code?: string; message?: string };
    if (fbErr.code === "functions/not-found") {
      return null;
    }
    // If running with no cloud function deployed yet in local dev emulator, check Firestore users collection fallback
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email.trim().toLowerCase())
      );
      const snap = await getDocs(usersQuery);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        return {
          uid: snap.docs[0].id,
          email: d.email || email,
          displayName: d.displayName || d.name,
          role: d.role,
          isAdmin: d.role === "admin" || d.isAdmin === true,
          linkedOrganizerId: d.linkedOrganizerId ?? null,
        };
      }
    } catch {
      // Ignore fallback failure
    }
    throw error;
  }
}

/**
 * Callable Cloud Function to set custom user role and claims
 */
export async function setUserRole(
  uid: string,
  role: "organizer" | "user" | "admin",
  linkedOrganizerId?: string | null
): Promise<void> {
  try {
    const callable = httpsCallable<
      { uid: string; role: string; linkedOrganizerId?: string | null },
      { success: boolean }
    >(functions, "setUserRole");
    await callable({ uid, role, linkedOrganizerId });
  } catch (error) {
    // If running in development without cloud functions deployed, update users document in Firestore
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        role,
        linkedOrganizerId: linkedOrganizerId ?? null,
        updatedAt: serverTimestamp(),
      });
      return;
    } catch {
      // Throw original error
    }
    throw error;
  }
}
