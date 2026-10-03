"use client";

import React, { useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { toast } from "sonner";
import { CheckCircle2, ImageIcon, ShieldAlert, XCircle } from "lucide-react";
import { storage } from "@/lib/firebase";
import { formatPKR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { Registration } from "@/types";
import { callableMessage, PAYMENT_REJECT_REASONS, PAYOUT_LABELS, reviewPayment } from "./api";

const STATUS: Record<string, { label: string; variant: "published" | "pending" | "rejected" | "draft" | "cancelled" }> = {
  confirmed: { label: "Confirmed", variant: "published" },
  awaiting_payment: { label: "Awaiting payment", variant: "draft" },
  in_review: { label: "Payment to check", variant: "pending" },
  rejected: { label: "Payment rejected", variant: "rejected" },
  expired: { label: "Expired", variant: "cancelled" },
  cancelled: { label: "Cancelled", variant: "cancelled" },
};

/**
 * Status of one registration, plus approve / reject for payments waiting on
 * the organizer. Admins may decide too (same `reviewPayment` callable).
 */
export function PaymentCell({ registration: r, onDecided }: { registration: Registration; onDecided: () => void }) {
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [reason, setReason] = useState<string>("not_received");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const status = STATUS[r.status || "confirmed"] ?? STATUS.confirmed;
  const p = r.payment;

  const openProof = async () => {
    if (!p?.proofPath) return;
    try {
      window.open(await getDownloadURL(ref(storage, p.proofPath)), "_blank", "noopener");
    } catch {
      toast.error("Couldn't open the screenshot.");
    }
  };

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      await reviewPayment(r.id, approve, approve ? undefined : reason === "other" ? undefined : reason, reason === "other" ? note.trim() : undefined);
      toast.success(approve ? `Approved. ${r.userName} has their ticket.` : `Rejected. ${r.userName} has been told why.`);
      setMode("none");
    } catch (err) {
      toast.error(callableMessage(err, "Couldn't save the decision."));
    } finally {
      setBusy(false);
      onDecided();
    }
  };

  return (
    <div className="flex flex-col gap-1 text-xs">
      <Badge variant={status.variant} size="sm" className="self-start">
        {status.label}
      </Badge>
      {p?.transactionId && (
        <span className="text-ink-muted">
          {p.method ? PAYOUT_LABELS[p.method] : ""} · TID <span className="font-mono text-ink">{p.transactionId}</span>
        </span>
      )}
      {r.status === "rejected" && p?.rejectionReason && <span className="text-ink-muted">{p.rejectionReason}</span>}
      {r.status === "in_review" && (
        <div className="flex items-center gap-1.5 mt-1">
          {p?.proofPath && (
            <Button type="button" variant="ghost" size="sm" onClick={openProof} title="Payment screenshot">
              <ImageIcon className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => setMode("reject")}>
            <XCircle className="w-3.5 h-3.5 text-[var(--color-crimson)]" />
          </Button>
          <Button type="button" size="sm" onClick={() => setMode("approve")}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </Button>
        </div>
      )}

      <Modal
        isOpen={mode === "approve"}
        onClose={() => setMode("none")}
        title={`Did ${formatPKR(r.totalPkr)} arrive?`}
        description={`Approve only if the organizer confirms the payment with transaction ID ${p?.transactionId ?? ""} reached their account. Screenshots can be faked. ${r.userName} gets their ticket right away.`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode("none")} disabled={busy}>
              Not yet
            </Button>
            <Button isLoading={busy} onClick={() => decide(true)}>
              <CheckCircle2 className="w-4 h-4" />
              Yes, approve
            </Button>
          </>
        }
      >
        <span className="text-xs text-ink-muted">Order {r.reference}</span>
      </Modal>

      <Modal
        isOpen={mode === "reject"}
        onClose={() => setMode("none")}
        title="Reject payment"
        description={`${r.userName} sees this reason, and their seats go back on sale.`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode("none")} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={busy}
              disabled={reason === "other" && note.trim().length < 4}
              onClick={() => decide(false)}
            >
              <ShieldAlert className="w-4 h-4" />
              Reject payment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries({ ...PAYMENT_REJECT_REASONS, other: "Something else" }).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setReason(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  reason === key ? "bg-ink text-on-ink border-ink" : "bg-surface border-border text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {reason === "other" && (
            <Textarea
              label="Message to the attendee"
              rows={2}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
