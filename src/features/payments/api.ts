import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref } from "firebase/storage";
import { db, functions, storage } from "@/lib/firebase";
import type { PayoutMethod, PayoutProfile, PayoutSettings, PayoutType } from "@/types";

// Reads only. Every payment change goes through a Cloud Function: this panel
// never writes payout docs, the review queue, registrations or acceptsPayments.

export const PAYOUT_LABELS: Record<PayoutType, string> = {
  raast: "Raast",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  iban: "Bank (IBAN)",
};

const BANK_CODES: Record<string, string> = {
  ABPA: "Allied Bank",
  ALFH: "Bank Alfalah",
  ASCM: "Askari Bank",
  BAHL: "Bank AL Habib",
  BKIP: "BankIslami",
  BPUN: "Bank of Punjab",
  DUIB: "Dubai Islamic Bank",
  FAYS: "Faysal Bank",
  HABB: "HBL",
  JSBL: "JS Bank",
  KHYB: "Bank of Khyber",
  MEZN: "Meezan Bank",
  MPBL: "Habib Metro",
  MUCB: "MCB Bank",
  NBPA: "National Bank",
  SCBL: "Standard Chartered",
  SONE: "Soneri Bank",
  SUMB: "Summit Bank",
  UNIL: "UBL",
  JCMA: "JazzCash",
  TMFB: "Easypaisa",
  NAYA: "NayaPay",
  SADA: "SadaPay",
};

/** "0300 1234567" or "PK36 MEZN 0001 ..." */
export function displayValue(m: PayoutMethod): string {
  return m.type === "iban"
    ? m.value.replace(/(.{4})/g, "$1 ").trim()
    : `${m.value.slice(0, 4)} ${m.value.slice(4)}`;
}

export function methodLabel(m: PayoutMethod): string {
  return (m.type === "iban" && BANK_CODES[m.value.slice(4, 8)]) || PAYOUT_LABELS[m.type];
}

function toProfile(raw: unknown, atKey: string): PayoutProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const methods = (Array.isArray(r.methods) ? r.methods : []).filter(
    (m): m is PayoutMethod => Boolean(m && typeof m === "object" && "type" in m && "value" in m)
  );
  const at = r[atKey];
  return {
    methods,
    qrImagePath: typeof r.qrImagePath === "string" ? r.qrImagePath : null,
    at: at instanceof Timestamp ? at.toDate() : null,
  };
}

export async function fetchPayoutSettings(organizerId: string): Promise<PayoutSettings> {
  const snap = await getDoc(doc(db, "organizers", organizerId, "private", "payout"));
  const d = snap.data() ?? {};
  return {
    active: toProfile(d.active, "approvedAt"),
    pending: toProfile(d.pending, "submittedAt"),
    rejectionReason: (d.rejection as { reason?: string } | null)?.reason ?? null,
  };
}

export interface PayoutQueueItem {
  organizerId: string;
  organizerName: string;
  submittedAt: Date | null;
  settings: PayoutSettings;
}

export async function fetchPayoutQueue(): Promise<PayoutQueueItem[]> {
  const snap = await getDocs(query(collection(db, "_payoutReviews"), orderBy("submittedAt", "asc")));
  return Promise.all(
    snap.docs.map(async (d) => ({
      organizerId: d.id,
      organizerName: (d.data().organizerName as string) || d.id,
      submittedAt: d.data().submittedAt instanceof Timestamp ? d.data().submittedAt.toDate() : null,
      settings: await fetchPayoutSettings(d.id),
    }))
  );
}

export async function fetchPayoutQueueCount(): Promise<number> {
  const snap = await getCountFromServer(collection(db, "_payoutReviews"));
  return snap.data().count;
}

/** QR images are readable by any signed-in user, so a download URL is fine here. */
export function payoutImageUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

/** Server-side reason limits: 2–80 characters (else it substitutes a generic one). */
export const PAYOUT_REASON_MAX = 80;

export async function reviewPayoutAccounts(
  organizerId: string,
  approve: boolean,
  reason?: string
): Promise<void> {
  await httpsCallable(functions, "reviewPayoutAccounts")({ organizerId, approve, reason });
}

/** Keys match REJECT_REASONS in the app's functions/src/payments.ts. */
export const PAYMENT_REJECT_REASONS: Record<string, string> = {
  not_received: "Payment not received",
  wrong_amount: "Amount doesn't match",
  wrong_tid: "Transaction ID doesn't match",
};

export async function reviewPayment(
  registrationId: string,
  approve: boolean,
  reason?: string,
  note?: string
): Promise<void> {
  await httpsCallable(functions, "reviewPayment")({ registrationId, approve, reason, note });
}

/** Turns a callable error into something safe to show in a toast. */
export function callableMessage(err: unknown, fallback: string): string {
  const e = err as { code?: string; message?: string };
  if (e?.code === "functions/failed-precondition") {
    return e.message || "Already handled — someone reviewed this in the meantime.";
  }
  if (e?.code === "functions/permission-denied") return "Admins only.";
  if (e?.code === "functions/unavailable") return "No connection. Try again.";
  return e?.message || fallback;
}
