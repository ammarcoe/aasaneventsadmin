import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ReportItem {
  id: string;
  targetType: "event" | "organizer";
  targetId: string;
  targetTitle?: string;
  organizerId?: string;
  organizerName?: string;
  reason: string;
  details?: string;
  reporterId?: string;
  reporterEmail?: string;
  status: "pending" | "dismissed" | "actioned";
  createdAt: Date;
}

export async function fetchReports(statusFilter: string = "pending"): Promise<ReportItem[]> {
  try {
    const col = collection(db, "reports");
    const q =
      statusFilter === "all"
        ? query(col, limit(50))
        : query(col, where("status", "==", statusFilter), limit(50));

    const snap = await getDocs(q);
    const items: ReportItem[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        targetType: data.targetType || "event",
        targetId: data.targetId || "",
        targetTitle: data.targetTitle || "Reported Item",
        organizerId: data.organizerId || null,
        organizerName: data.organizerName || "Organizer",
        reason: data.reason || "General Violation",
        details: data.details || "",
        reporterId: data.reporterId || "",
        reporterEmail: data.reporterEmail || "anonymous",
        status: data.status || "pending",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });

    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error("fetchReports error:", err);
    return [];
  }
}

export async function dismissReport(id: string): Promise<void> {
  const docRef = doc(db, "reports", id);
  await updateDoc(docRef, {
    status: "dismissed",
    resolvedAt: serverTimestamp(),
  });
}

export async function actionReport(id: string, notes?: string): Promise<void> {
  const docRef = doc(db, "reports", id);
  await updateDoc(docRef, {
    status: "actioned",
    resolutionNotes: notes || null,
    resolvedAt: serverTimestamp(),
  });
}
