"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { toggleFeaturedEvent } from "@/features/events/api";
import type { NeedsAttentionItem } from "./api";
import { AlertCircle, ChevronRight, CheckCircle2, AlertTriangle, StarOff } from "lucide-react";
import { toast } from "sonner";

export interface NeedsAttentionProps {
  items: NeedsAttentionItem[];
}

export function NeedsAttention({ items }: NeedsAttentionProps) {
  const queryClient = useQueryClient();

  const unfeatureMutation = useMutation({
    mutationFn: (eventId: string) => toggleFeaturedEvent(eventId, true),
    onSuccess: () => {
      toast.success("Event unfeatured");
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
    },
    onError: () => {
      toast.error("Failed to unfeature event");
    },
  });

  if (items.length === 0) {
    return (
      <div className="p-8 bg-surface rounded-lg border border-border flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-surface-subtle rounded-full border border-border text-accent-deep mb-2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-ink">Nothing needs attention</h4>
        <p className="text-xs text-ink-muted mt-0.5">
          All published events have artwork, ticket capacities are healthy, and queue is clear.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-sand" />
          Needs Attention ({items.length})
        </h3>
      </div>

      <div className="bg-surface rounded-lg border border-border divide-y divide-border overflow-hidden shadow-xs">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 flex items-center justify-between gap-4 hover:bg-surface-subtle/60 transition-colors group"
          >
            <Link href={item.fixHref} className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`p-2 rounded-md shrink-0 mt-0.5 ${
                  item.urgency === "high"
                    ? "bg-crimson-surface text-crimson"
                    : "bg-sand/30 text-ink"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-ink group-hover:text-accent-deep transition-colors truncate">
                  {item.title}
                </span>
                <span className="text-xs text-ink-muted mt-0.5">
                  {item.subtitle}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {item.type === "past_featured" && item.eventId ? (
                <button
                  type="button"
                  disabled={unfeatureMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    unfeatureMutation.mutate(item.eventId!);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-crimson bg-crimson-surface hover:bg-crimson/20 border border-crimson/30 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Unfeature this past event immediately"
                >
                  <StarOff className="w-3.5 h-3.5" />
                  <span>Unfeature</span>
                </button>
              ) : (
                <Link
                  href={item.fixHref}
                  className="flex items-center gap-1 text-xs font-semibold text-accent-deep hover:underline"
                >
                  <span>Fix now</span>
                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink transition-colors" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
