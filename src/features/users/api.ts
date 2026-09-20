import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export interface UserFilter {
  role?: "all" | "admin" | "organizer" | "user" | "suspended";
}

export interface UserRow extends UserProfile {
  id: string;
  status?: "active" | "suspended";
  phoneNumber?: string;
  createdAt?: Date;
}

export async function fetchUsers(filter?: UserFilter): Promise<UserRow[]> {
  try {
    const usersCol = collection(db, "users");
    const q = query(usersCol, limit(100));
    const snap = await getDocs(q);

    let users: UserRow[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: d.id,
        email: data.email || "No email",
        displayName: data.displayName || data.name || "User",
        role: data.role || (data.isAdmin ? "admin" : "user"),
        isAdmin: Boolean(data.isAdmin),
        status: data.status || "active",
        phoneNumber: data.phoneNumber || data.phone || "",
        linkedOrganizerId: data.linkedOrganizerId || null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });

    if (filter?.role && filter.role !== "all") {
      if (filter.role === "suspended") {
        users = users.filter((u) => u.status === "suspended");
      } else if (filter.role === "admin") {
        users = users.filter((u) => u.role === "admin" || u.isAdmin);
      } else {
        users = users.filter((u) => u.role === filter.role);
      }
    }

    return users;
  } catch (err) {
    console.error("fetchUsers failed:", err);
    return [];
  }
}

export async function toggleUserSuspend(uid: string, currentStatus: string): Promise<void> {
  const docRef = doc(db, "users", uid);
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
  await updateDoc(docRef, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserRole(
  uid: string,
  role: "admin" | "organizer" | "user",
  linkedOrganizerId?: string | null
): Promise<void> {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    role,
    isAdmin: role === "admin",
    linkedOrganizerId: linkedOrganizerId ?? null,
    updatedAt: serverTimestamp(),
  });
}
