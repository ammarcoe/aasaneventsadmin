"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { findUserByEmail, setUserRole, UserLookupResult } from "./api";
import { Search, UserCheck, AlertCircle, ShieldAlert, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizerId: string;
  organizerName: string;
  onLinked: (userId: string, userEmail: string) => Promise<void>;
}

type LookupState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "found"; user: UserLookupResult }
  | { type: "not_found"; email: string }
  | { type: "already_linked"; user: UserLookupResult; reason: string };

export function LinkAccountModal({
  isOpen,
  onClose,
  organizerId,
  organizerName,
  onLinked,
}: LinkAccountModalProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LookupState>({ type: "idle" });
  const [isLinking, setIsLinking] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState({ type: "searching" });
    try {
      const user = await findUserByEmail(email.trim());
      if (!user) {
        setState({ type: "not_found", email: email.trim() });
        return;
      }

      if (user.isAdmin) {
        setState({
          type: "already_linked",
          user,
          reason: "Admins cannot be linked to an organizer account.",
        });
        return;
      }

      if (user.linkedOrganizerId && user.linkedOrganizerId !== organizerId) {
        setState({
          type: "already_linked",
          user,
          reason: `This user is already linked to another organizer (${user.linkedOrganizerId}).`,
        });
        return;
      }

      setState({ type: "found", user });
    } catch (err: unknown) {
      console.error("User search failed:", err);
      setState({ type: "not_found", email: email.trim() });
      toast.error("User lookup failed. Check network or permissions.");
    }
  };

  const handleConfirmLink = async (user: UserLookupResult) => {
    try {
      setIsLinking(true);
      await setUserRole(user.uid, "organizer", organizerId);
      await onLinked(user.uid, user.email);
      toast.success(`Account linked! ${user.email} can now submit events.`);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to link account:", err);
      toast.error("Failed to link user account. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Mobile App Account"
      description={`Grant ${organizerName} submission privileges in the mobile app.`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="email"
              label="User Email in Mobile App"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            isLoading={state.type === "searching"}
          >
            <Search className="w-4 h-4" />
            Lookup
          </Button>
        </form>

        {/* State 1: Idle instructions */}
        {state.type === "idle" && (
          <p className="text-xs text-ink-muted bg-surface-subtle p-3 rounded-md border border-border">
            Enter the registered email of the user in the mobile app. The user will
            receive organizer submission rights after a token refresh.
          </p>
        )}

        {/* State 2: Searching */}
        {state.type === "searching" && (
          <div className="flex items-center justify-center p-6 text-xs text-ink-muted">
            Searching directory for registered account...
          </div>
        )}

        {/* State 3: Found */}
        {state.type === "found" && (
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent/20 rounded-full text-accent-deep shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  {state.user.displayName || "Registered User"}
                </h4>
                <p className="text-xs font-mono text-ink-muted">{state.user.email}</p>
                <p className="text-[11px] text-accent-deep mt-1 font-medium">
                  Verified user found. Ready to assign organizer role.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isLinking}
              onClick={() => handleConfirmLink(state.user)}
              className="w-full mt-1"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Confirm &amp; Link Account
            </Button>
          </div>
        )}

        {/* State 4: Not found */}
        {state.type === "not_found" && (
          <div className="p-4 bg-surface-subtle border border-border rounded-lg flex items-start gap-3 text-xs text-ink-muted">
            <AlertCircle className="w-5 h-5 text-sand shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ink">No account found</span>
              <p className="mt-0.5">
                No mobile app user registered with <code className="font-mono">{state.email}</code>.
                Ask the organizer to first register on the Aasanevent mobile app.
              </p>
            </div>
          </div>
        )}

        {/* State 5: Already linked / Admin */}
        {state.type === "already_linked" && (
          <div className="p-4 bg-crimson-surface border border-crimson/30 rounded-lg flex items-start gap-3 text-xs text-crimson">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-crimson">Cannot Link Account</span>
              <p className="mt-0.5 text-ink-muted">{state.reason}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
