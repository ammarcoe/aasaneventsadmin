"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchOrganizers } from "@/features/organizers/api";
import {
  createEvent,
  updateEvent,
  publishEvent,
  uploadEventImage,
  cancelEvent,
  postponeEvent,
  deleteEvent,
} from "./api";
import { eventSchema, EventFormValues, TicketTypeFormValues } from "./schema";
import { pktToDate, dateToPktParts, pktLabel } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import { parseMapsInput, MAPS_FAILURE_MESSAGES } from "@/lib/maps";
import { PhoneFrame } from "@/components/preview/PhoneFrame";
import {
  PublishConfirmModal,
  getPublishGateMissingItems,
} from "./PublishGateModal";
import { CancelEventModal } from "./CancelEventModal";
import { PostponeEventModal } from "./PostponeEventModal";
import { DeleteEventModal } from "./DeleteEventModal";
import { MultiImageManager } from "./MultiImageManager";
import { useAuth } from "@/features/auth/AuthContext";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import type { Event, TicketType } from "@/types";

import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Link as LinkIcon,
  ExternalLink,
  Info,
  Sparkles,
  Check,
  AlertTriangle,
  XCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export interface EventFormProps {
  initialData?: Event | null;
}

const CATEGORIES = [
  { value: "music", label: "Music & Concerts" },
  { value: "tech", label: "Technology & Startups" },
  { value: "arts", label: "Arts & Culture" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "food", label: "Food & Festivals" },
  { value: "business", label: "Business & Networking" },
  { value: "community", label: "Community & Charity" },
  { value: "education", label: "Workshops & Education" },
];

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  const isEditing = Boolean(initialData?.id);

  // Organizers query
  const { data: organizers = [] } = useQuery({
    queryKey: qk.organizers.all,
    queryFn: fetchOrganizers,
  });

  // Form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "music");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || []);

  // Timezone-safe start and end values in PKT
  const initialStartParts = dateToPktParts(initialData?.startTime);
  const [startDateStr, setStartDateStr] = useState(initialStartParts.date);
  const [startTimeStr, setStartTimeStr] = useState(initialStartParts.time);

  const initialEndParts = dateToPktParts(initialData?.endTime);
  const [hasEndTime, setHasEndTime] = useState(Boolean(initialData?.endTime));
  const [endDateStr, setEndDateStr] = useState(
    initialData?.endTime ? initialEndParts.date : initialStartParts.date
  );
  const [endTimeStr, setEndTimeStr] = useState(
    initialData?.endTime ? initialEndParts.time : "22:00"
  );

  // Computed Date objects using strictly pkt.ts
  const computedStartTime = pktToDate(startDateStr, startTimeStr);
  const computedEndTime = hasEndTime ? pktToDate(endDateStr, endTimeStr) : null;

  // Venue & Coordinates
  const [venueName, setVenueName] = useState(initialData?.venueName || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);
  const [mapsInput, setMapsInput] = useState("");
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Organizer
  const [organizerId, setOrganizerId] = useState<string>(initialData?.organizerId || "");
  const [organizerName, setOrganizerName] = useState<string>(
    initialData?.organizerName || ""
  );

  // Tickets & Attendance metrics
  const totalExistingSold =
    initialData?.soldCount ??
    (initialData?.ticketTypes?.reduce((acc, t) => acc + (t.soldCount || 0), 0) ?? 0);

  const [isFreeEvent, setIsFreeEvent] = useState(
    initialData?.priceMinPkr === 0 || (!initialData?.priceMinPkr && !initialData?.priceMaxPkr)
  );
  const [ticketUrl, setTicketUrl] = useState(initialData?.ticketUrl || "");
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(
    initialData?.ticketTypes && initialData.ticketTypes.length > 0
      ? initialData.ticketTypes
      : [
          {
            id: `ticket_${Date.now()}`,
            name: "General Admission",
            pricePkr: 0,
            capacity: 100,
            soldCount: 0,
          },
        ]
  );

  // Visibility & Status
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [status, setStatus] = useState(initialData?.status || "draft");

  // Save & Lifecycle modals states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Sync organizerName when organizerId changes
  useEffect(() => {
    if (organizerId) {
      const selected = organizers.find((o) => o.id === organizerId);
      if (selected) {
        setOrganizerName(selected.name);
      }
    }
  }, [organizerId, organizers]);

  // Handle Google Maps link / coordinates paste
  const handleMapsInputChange = (text: string) => {
    setMapsInput(text);
    if (!text.trim()) {
      setMapsError(null);
      return;
    }
    const result = parseMapsInput(text);
    if (result.ok) {
      setLatitude(result.lat);
      setLongitude(result.lng);
      setMapsError(null);
      toast.success(`Coordinates extracted: ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
    } else {
      setMapsError(MAPS_FAILURE_MESSAGES[result.reason]);
    }
  };

  // Ticket types helpers
  const handleAddTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        id: `ticket_${Date.now()}_${prev.length}`,
        name: "VIP Pass",
        pricePkr: isFreeEvent ? 0 : 2000,
        capacity: 50,
        soldCount: 0,
      },
    ]);
  };

  const handleRemoveTicketType = (id: string) => {
    if (ticketTypes.length <= 1) {
      toast.error("At least one ticket type is required.");
      return;
    }
    const target = ticketTypes.find((t) => t.id === id);
    if (target && (target.soldCount || 0) > 0) {
      toast.error(`Cannot delete ticket "${target.name}": ${target.soldCount} tickets have already been sold.`);
      return;
    }
    setTicketTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTicketType = (
    id: string,
    field: keyof TicketType,
    value: string | number
  ) => {
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Tags handler
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().toLowerCase();
    if (tags.includes(clean)) return;
    if (tags.length >= 8) {
      toast.error("Maximum 8 tags allowed.");
      return;
    }
    setTags([...tags, clean]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Compute prices
  const minPrice = isFreeEvent
    ? 0
    : Math.min(...ticketTypes.map((t) => t.pricePkr || 0));
  const maxPrice = isFreeEvent
    ? 0
    : Math.max(...ticketTypes.map((t) => t.pricePkr || 0));

  // Current Form Data Snapshot
  const currentFormData: EventFormValues = {
    title,
    description: description || null,
    imageUrls,
    categoryId,
    tags,
    startTime: computedStartTime,
    endTime: computedEndTime,
    venueName,
    address: address || null,
    latitude: latitude || null,
    longitude: longitude || null,
    organizerId: organizerId || null,
    organizerName: organizerName || "Organizer",
    priceMinPkr: minPrice,
    priceMaxPkr: maxPrice,
    ticketUrl: isFreeEvent ? null : ticketUrl || null,
    ticketTypes,
    isFeatured,
    status,
  };

  // Publish gate check
  const missingPublishItems = getPublishGateMissingItems(currentFormData);
  const isPublishAllowed = missingPublishItems.length === 0;

  // Save Draft handler
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const draftData: EventFormValues = {
        ...currentFormData,
        status: status === "published" ? "published" : "draft",
      };

      if (isEditing && initialData) {
        await updateEvent(initialData.id, draftData, initialData);
        toast.success("Changes saved!");
      } else {
        const newId = await createEvent(draftData);
        toast.success("Draft event created!");
        router.push(`/events/${newId}`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      console.error("Save draft error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save draft. Check permissions or fields.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish handler
  const handleConfirmPublish = async ({
    skipNotification,
  }: {
    skipNotification: boolean;
  }) => {
    setIsPublishing(true);
    try {
      const adminUid = authState.status === "authenticated" ? authState.uid : "admin";

      let targetId = initialData?.id;
      if (!isEditing || !targetId) {
        // Save first then publish
        targetId = await createEvent({
          ...currentFormData,
          status: "published",
        });
      } else {
        await updateEvent(
          targetId,
          {
            ...currentFormData,
            status: "published",
          },
          initialData
        );
      }

      await publishEvent(targetId, adminUid, organizerId);
      setStatus("published");
      setIsPublishModalOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      toast.success(
        skipNotification
          ? "Event published quietly (no notifications sent)."
          : "Event published live with notifications broadcast!"
      );
      router.push("/events");
    } catch (err) {
      console.error("Publishing error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to publish event.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Cancel handler
  const handleConfirmCancel = async (reason: string) => {
    if (!initialData?.id) return;
    try {
      setIsCancelling(true);
      await cancelEvent(initialData.id, reason, organizerId);
      setStatus("cancelled");
      setIsCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      toast.success("Event has been cancelled.");
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel event.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Postpone handler
  const handleConfirmPostpone = async (data: {
    newStartTime?: Date | null;
    newEndTime?: Date | null;
    reason?: string;
  }) => {
    if (!initialData?.id) return;
    try {
      setIsPostponing(true);
      await postponeEvent(initialData.id, data, organizerId);
      setStatus("postponed");
      if (data.newStartTime) {
        const parts = dateToPktParts(data.newStartTime);
        setStartDateStr(parts.date);
        setStartTimeStr(parts.time);
      }
      if (data.newEndTime) {
        const parts = dateToPktParts(data.newEndTime);
        setEndDateStr(parts.date);
        setEndTimeStr(parts.time);
        setHasEndTime(true);
      }
      setIsPostponeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      toast.success("Event postponed successfully.");
    } catch (err) {
      console.error("Postpone error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to postpone event.");
    } finally {
      setIsPostponing(false);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!initialData?.id) return;
    try {
      setIsDeleting(true);
      await deleteEvent(initialData.id, organizerId);
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      toast.success("Event deleted permanently.");
      router.push("/events");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Top navigation header & Lifecycle bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {initialData?.id && (
            <Link
              href={`/events/${initialData.id}/registrations`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface border border-border text-ink hover:bg-surface-subtle transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-accent-deep" />
              <span>Registrations ({totalExistingSold})</span>
            </Link>
          )}

          {initialData?.id && status !== "cancelled" && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsPostponeModalOpen(true)}
              >
                <Clock className="w-3.5 h-3.5" />
                Postpone
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <XCircle className="w-3.5 h-3.5 text-crimson" />
                Cancel Event
              </Button>
            </>
          )}

          {initialData?.id && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          )}

          {status === "published" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent-deep border border-accent/40">
              Published Live
            </span>
          )}
        </div>
      </div>

      {/* Registration Warning Banner if Published with attendees */}
      {status === "published" && totalExistingSold > 0 && (
        <div className="p-4 bg-sand/30 border border-sand rounded-xl flex items-start gap-3 text-sm text-ink">
          <AlertTriangle className="w-5 h-5 text-accent-deep shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Live Event Registration Notice</span>
            <span className="text-xs text-ink-muted leading-relaxed">
              This published event currently has <strong className="text-ink">{totalExistingSold} registered attendees</strong>. Modifying the date/time, venue address, or ticket prices will directly affect existing ticket holders.
            </span>
          </div>
        </div>
      )}

      {/* Two Column Layout: Form (640px) and Sticky Preview (390px) */}
      <div className="flex flex-col xl:flex-row items-start gap-8">
        {/* Left Column: Form (640px) */}
        <div className="w-full xl:w-[640px] flex flex-col gap-6">
          {/* Section 1: Basics */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>1. Basics</CardTitle>
              <CardDescription>
                Title, primary category, tags, and detailed overview.
              </CardDescription>
            </CardHeader>

            <div className="flex flex-col gap-4">
              <Input
                label="Event Title"
                placeholder="e.g. Islamabad Sufi Night 2026"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helperText={`${title.length} / 80 characters`}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={CATEGORIES}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink uppercase tracking-wide">
                    Tags (Max 8)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tag and press +"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddTag}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border text-xs text-ink font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-ink-faint hover:text-crimson"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <Textarea
                label="Full Description"
                placeholder="Describe what attendees can expect, schedule, dress code..."
                rows={6}
                maxLength={5000}
                currentLength={description.length}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Card>

          {/* Section 2: When & Where (PKT Timezone Handling) */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>2. When &amp; Where</CardTitle>
              <CardDescription>
                Strictly scheduled in Pakistan Standard Time (PKT).
              </CardDescription>
            </CardHeader>

            <div className="flex flex-col gap-5">
              {/* Start Date & Time */}
              <div className="p-4 rounded-lg bg-surface-subtle border border-border flex flex-col gap-3">
                <span className="text-xs font-semibold text-ink uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent-deep" />
                  Event Start Date &amp; Time
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="date"
                    label="Date (PKT)"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    label="Time (PKT)"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                  />
                </div>

                {/* Read-back label strictly required under every datetime field */}
                <div className="text-xs font-medium text-accent-deep font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Saving as {pktLabel(computedStartTime)}</span>
                </div>
              </div>

              {/* End Date & Time Toggle */}
              <div className="flex flex-col gap-3">
                <Switch
                  label="Specify End Date & Time"
                  checked={hasEndTime}
                  onCheckedChange={setHasEndTime}
                />

                {hasEndTime && (
                  <div className="p-4 rounded-lg bg-surface-subtle border border-border flex flex-col gap-3">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent-deep" />
                      Event End Date &amp; Time
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="date"
                        label="End Date (PKT)"
                        value={endDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                      />
                      <Input
                        type="time"
                        label="End Time (PKT)"
                        value={endTimeStr}
                        onChange={(e) => setEndTimeStr(e.target.value)}
                      />
                    </div>

                    <div className="text-xs font-medium text-accent-deep font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Saving as {pktLabel(computedEndTime)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Venue & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Venue Name"
                  placeholder="e.g. Lok Virsa Amphitheatre"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  required
                />
                <Input
                  label="Street Address / Area"
                  placeholder="Garden Ave, Shakarparian, Islamabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Coordinates & Google Maps Link Parser */}
              <div className="p-4 rounded-lg bg-surface-subtle border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent-deep" />
                    Map Coordinates
                  </span>
                  {latitude != null && longitude != null && (
                    <a
                      href={`https://maps.google.com/?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent-deep hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on Google Maps ↗
                    </a>
                  )}
                </div>

                <Input
                  label="Google Maps link or coordinates"
                  placeholder="Paste URL or type e.g. 33.6892, 73.0729"
                  value={mapsInput}
                  onChange={(e) => handleMapsInputChange(e.target.value)}
                  helperText="Paste any Google Maps link (computer address bar or share link), or type coordinates directly like 33.6892, 73.0729"
                />

                {mapsError && (
                  <p className="text-xs text-crimson bg-crimson-surface p-2.5 rounded-md border border-crimson/20">
                    {mapsError}
                  </p>
                )}

                {latitude != null && longitude != null && (
                  <div className="flex items-center justify-between text-xs text-accent-deep font-semibold bg-surface px-3 py-2 rounded-md border border-accent/30">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-accent-deep shrink-0" />
                      ✓ {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-ink text-[11px]"
                    >
                      [View on Google Maps ↗]
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input
                    type="number"
                    step="any"
                    label="Latitude (23 – 37)"
                    placeholder="33.6892"
                    value={latitude ?? ""}
                    onChange={(e) =>
                      setLatitude(e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                  <Input
                    type="number"
                    step="any"
                    label="Longitude (60 – 78)"
                    placeholder="73.0729"
                    value={longitude ?? ""}
                    onChange={(e) =>
                      setLongitude(e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Organizer */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>3. Organizer</CardTitle>
              <CardDescription>
                Assign the responsible host entity for this event.
              </CardDescription>
            </CardHeader>

            <div className="flex flex-col gap-4">
              <Select
                label="Select Organizer"
                value={organizerId}
                onChange={(e) => setOrganizerId(e.target.value)}
                required
              >
                <option value="">-- Choose Organizer --</option>
                {organizers.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.email})
                  </option>
                ))}
              </Select>

              {organizerId && (
                <div className="p-3 bg-surface-subtle border border-border rounded-lg text-xs text-ink-muted flex items-center justify-between">
                  <span>Selected Host: <strong className="text-ink">{organizerName}</strong></span>
                  <Link
                    href={`/organizers/${organizerId}`}
                    className="text-accent-deep hover:underline font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Section 4: Tickets & Pricing */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>4. Tickets &amp; Pricing</CardTitle>
              <CardDescription>
                Configure ticket types, pricing tiers, and online registration links.
              </CardDescription>
            </CardHeader>

            <div className="flex flex-col gap-5">
              <Switch
                label="Free Event"
                description="Attendees do not require a paid ticket to attend."
                checked={isFreeEvent}
                onCheckedChange={(checked) => {
                  setIsFreeEvent(checked);
                  if (checked) {
                    setTicketTypes((prev) =>
                      prev.map((t) => ({ ...t, pricePkr: 0 }))
                    );
                  }
                }}
              />

              {!isFreeEvent && (
                <Input
                  label="External Ticket Purchase URL"
                  placeholder="https://bookme.pk/events/..."
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  helperText="Mandatory for paid events"
                  required
                />
              )}

              {/* Ticket types list */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                    Ticket Types / Passes
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTicketType}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tier
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {ticketTypes.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-lg bg-surface-subtle border border-border flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          {t.name}
                        </span>
                        {ticketTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTicketType(t.id)}
                            className="text-ink-faint hover:text-crimson p-1"
                            title="Remove ticket type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Tier Name"
                          value={t.name}
                          onChange={(e) =>
                            handleUpdateTicketType(t.id, "name", e.target.value)
                          }
                          required
                        />
                        <Input
                          type="number"
                          label="Price (PKR)"
                          value={isFreeEvent ? 0 : t.pricePkr}
                          disabled={isFreeEvent}
                          onChange={(e) =>
                            handleUpdateTicketType(
                              t.id,
                              "pricePkr",
                              Number(e.target.value)
                            )
                          }
                          required
                        />
                        <Input
                          type="number"
                          label="Capacity"
                          value={t.capacity}
                          onChange={(e) =>
                            handleUpdateTicketType(
                              t.id,
                              "capacity",
                              Number(e.target.value)
                            )
                          }
                          required
                        />
                      </div>

                      {isEditing && (
                        <div className="text-[11px] text-ink-muted">
                          Sold so far: <strong className="text-ink">{t.soldCount || 0}</strong> tickets (preserved on edit)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: Media & Multi-Image (Cover 2.4:1 + Gallery 4:3) */}
          <MultiImageManager
            imageUrls={imageUrls}
            onChange={setImageUrls}
            onUploadFile={(f) => uploadEventImage(initialData?.id || "temp", f)}
          />

          {/* Section 6: Visibility */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>6. Visibility &amp; Promotion</CardTitle>
            </CardHeader>

            <Switch
              label="Featured Event"
              description="Pins this event to the top carousel of the home feed in Islamabad."
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
          </Card>
        </div>

        {/* Right Column: Sticky Phone Preview (390px) */}
        <div className="w-full xl:w-[390px] shrink-0">
          <PhoneFrame data={currentFormData} />
        </div>
      </div>

      {/* Sticky Bottom Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xs border-t border-border px-8 py-3.5 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="text-xs text-ink-muted flex items-center gap-2">
            {lastSavedTime ? (
              <span>Last saved at <strong className="text-ink">{lastSavedTime}</strong></span>
            ) : (
              <span>Status: <strong className="capitalize text-ink">{status}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              isLoading={isSavingDraft}
              onClick={handleSaveDraft}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>

            {/* Publish Button with Tooltip / Missing Gate popover */}
            <div className="relative group">
              <Button
                type="button"
                variant="primary"
                disabled={!isPublishAllowed}
                onClick={() => setIsPublishModalOpen(true)}
              >
                <Send className="w-4 h-4" />
                {status === "published" ? "Publish Updates" : "Publish Event"}
              </Button>

              {!isPublishAllowed && (
                <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-surface border border-border rounded-lg shadow-xl text-xs text-ink opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <div className="flex items-center gap-1.5 font-bold text-crimson mb-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Publish Requirements ({missingPublishItems.length} missing):
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-ink-muted text-[11px]">
                    {missingPublishItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      <PublishConfirmModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handleConfirmPublish}
        eventTitle={title}
        organizerName={organizerName}
        isRepublish={initialData?.status === "published"}
        isLoading={isPublishing}
      />

      {/* Cancel Event Modal */}
      {initialData && (
        <CancelEventModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
          eventTitle={title}
          registeredCount={totalExistingSold}
          isLoading={isCancelling}
        />
      )}

      {/* Postpone Event Modal */}
      {initialData && (
        <PostponeEventModal
          isOpen={isPostponeModalOpen}
          onClose={() => setIsPostponeModalOpen(false)}
          onConfirm={handleConfirmPostpone}
          eventTitle={title}
          currentStartTime={computedStartTime}
          currentEndTime={computedEndTime}
          isLoading={isPostponing}
        />
      )}

      {/* Delete Event Modal */}
      {initialData && (
        <DeleteEventModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          eventTitle={title}
          registeredCount={totalExistingSold}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
