"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircle2, XCircle, ShieldAlert, ExternalLink, QrCode } from "lucide-react";
import type { PayoutMethod, PayoutProfile } from "@/types";
import {
  displayValue,
  methodLabel,
  PAYOUT_REASON_MAX,
  payoutImageUrl,
  type PayoutQueueItem,
} from "./api";

const REJECT_PRESETS = [
  "Account title doesn't match the organizer",
  "Couldn't verify this account belongs to the organizer",
  "Number or IBAN looks wrong, please re-check",
];

const sameMethod = (a: PayoutMethod, b: PayoutMethod) =>
  a.type === b.type && a.value === b.value && a.accountTitle === b.accountTitle;

function MethodRow({ method, changed }: { method: PayoutMethod; changed?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-md border px-3 py-2 ${
        changed ? "border-accent/50 bg-accent/10" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink">{methodLabel(method)}</span>
        {changed && (
          <Badge variant="pending" size="sm">
            New
          </Badge>
        )}
      </div>
      <span className="font-mono text-sm text-ink">{displayValue(method)}</span>
      <span className="text-xs text-ink-muted">{method.accountTitle}</span>
    </div>
  );
}

function QrImage({ path }: { path: string }) {
  const { data: url, isLoading, isError } = useQuery({
    queryKey: ["payouts", "qr", path],
    queryFn: () => payoutImageUrl(path),
    staleTime: Infinity,
  });
  if (isLoading) return <Skeleton className="h-36 w-36 rounded-md" />;
  if (isError || !url) return <span className="text-xs text-ink-muted">Couldn&apos;t load QR image</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" title="Open full size">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, remote Storage URL */}
      <img src={url} alt="Submitted payment QR code" className="h-36 w-36 rounded-md border border-border object-contain bg-white" />
    </a>
  );
}

function ProfileColumn({
  title,
  profile,
  compareTo,
  empty,
}: {
  title: string;
  profile: PayoutProfile | null;
  compareTo?: PayoutProfile | null;
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</span>
      {!profile || profile.methods.length === 0 ? (
        <span className="text-xs text-ink-faint">{empty}</span>
      ) : (
        <>
          {profile.methods.map((m) => (
            <MethodRow
              key={`${m.type}-${m.value}`}
              method={m}
              changed={compareTo !== undefined && !compareTo?.methods.some((c) => sameMethod(c, m))}
            />
          ))}
          {profile.qrImagePath && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted flex items-center gap-1">
                <QrCode className="w-3 h-3" /> QR code
              </span>
              <QrImage path={profile.qrImagePath} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export interface PayoutReviewCardProps {
  item: PayoutQueueItem;
  onApprove: (organizerId: string) => Promise<void>;
  onReject: (organizerId: string, reason: string) => Promise<void>;
}

export function PayoutReviewCard({ item, onApprove, onReject }: PayoutReviewCardProps) {
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [reason, setReason] = useState(REJECT_PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const { active, pending } = item.settings;
  const reasonOk = reason.trim().length >= 2 && reason.trim().length <= PAYOUT_REASON_MAX;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setMode("none");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="pending" size="sm">
              Submitted {formatRelativeTime(item.submittedAt)}
            </Badge>
            {active && (
              <Badge variant="published" size="sm">
                Already live
              </Badge>
            )}
          </div>
          <Link
            href={`/organizers/${item.organizerId}`}
            className="text-base font-bold text-ink hover:underline inline-flex items-center gap-1 truncate"
          >
            {item.organizerName}
            <ExternalLink className="w-3.5 h-3.5 text-ink-faint" />
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setMode("reject")} disabled={busy || !pending}>
            <XCircle className="w-3.5 h-3.5 text-[var(--color-crimson)]" />
            Reject
          </Button>
          <Button variant="primary" size="sm" onClick={() => setMode("approve")} disabled={busy || !pending}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileColumn title="Submitted for review" profile={pending} compareTo={active} empty="Nothing pending" />
        <ProfileColumn title="Live now" profile={active} empty="No approved accounts yet" />
      </div>

      <p className="text-xs text-ink-muted border-t border-border pt-3">
        Approve only if each account title matches <strong className="text-ink">{item.organizerName}</strong> or
        the person running it. Attendees send real money here, and a hijacked organizer account would try to swap in
        its own number.
      </p>

      <Modal
        isOpen={mode === "approve"}
        onClose={() => setMode("none")}
        title="Approve payment accounts?"
        description={`Attendees will pay ${item.organizerName} directly into these accounts. The organizer gets a notification.`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode("none")} disabled={busy}>
              Cancel
            </Button>
            <Button isLoading={busy} onClick={() => run(() => onApprove(item.organizerId))}>
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {pending?.methods.map((m) => <MethodRow key={`${m.type}-${m.value}`} method={m} />)}
        </div>
      </Modal>

      <Modal
        isOpen={mode === "reject"}
        onClose={() => setMode("none")}
        title="Reject payment accounts"
        description="The organizer sees this reason in the app. Their current live accounts (if any) keep working."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode("none")} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={busy}
              disabled={!reasonOk}
              onClick={() => run(() => onReject(item.organizerId, reason.trim()))}
            >
              <ShieldAlert className="w-4 h-4" />
              Reject
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {REJECT_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  reason === r ? "bg-ink text-on-ink border-ink" : "bg-surface border-border text-ink-muted hover:text-ink"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            label="Reason"
            rows={2}
            maxLength={PAYOUT_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>
    </Card>
  );
}
