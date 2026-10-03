"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchOrganizers } from "@/features/organizers/api";
import {
  createEvent,
  createEventSeries,
  updateEvent,
  publishEvent,
  cancelEvent,
  postponeEvent,
  deleteEvent,
  duplicateEvent,
} from "./api";
import { eventSchemaV2, EventFormValues, TicketTypeFormValues } from "./schema";
import { pktToDate, dateToPktParts, pktLabel } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import { parseMapsInput } from "@/lib/maps";
import { useAuth } from "@/features/auth/AuthContext";
import type { Event, EventImage, TicketType, Organizer, PayoutType } from "@/types";
import { fetchPayoutSettings, methodLabel, displayValue } from "@/features/payments/api";

// Subcomponents
import { SectionNav, FormSectionStatus } from "@/components/event-form/SectionNav";
import { ImageManager } from "@/components/event-form/ImageManager";
import { ChipGroup } from "@/components/event-form/ChipGroup";
import { AgendaTable } from "@/components/event-form/AgendaTable";
import { FaqList } from "@/components/event-form/FaqList";
import { RepeatModal, SeriesOccurrence } from "@/components/event-form/RepeatModal";
import { PhonePreview } from "@/components/event-form/PhonePreview";
import { EventChecklist } from "@/components/event-form/EventChecklist";
import { PublishConfirmModal } from "./PublishGateModal";
import { CancelEventModal } from "./CancelEventModal";
import { PostponeEventModal } from "./PostponeEventModal";
import { DeleteEventModal } from "./DeleteEventModal";
import { DuplicateModal } from "./DuplicateModal";

// UI Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
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
  Repeat,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export interface EventFormProps {
  initialEvent?: Event | null;
  onSuccess?: (id: string) => void;
}

const CATEGORIES = [
  { value: "music", label: "Music & Concerts" },
  { value: "arts", label: "Arts & Culture" },
  { value: "food", label: "Food & Drinks" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "tech", label: "Tech & Workshops" },
  { value: "business", label: "Business & Networking" },
  { value: "community", label: "Community & Social" },
  { value: "outdoors", label: "Outdoors & Travel" },
  { value: "other", label: "Other" },
];

export function EventForm({ initialEvent, onSuccess }: EventFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  const adminUid = authState.status === "authenticated" ? authState.uid : "admin";
  const isEditing = Boolean(initialEvent?.id);
  const eventId = initialEvent?.id || "new";
  const draftKey = `admin_event_draft_${eventId}`;

  // Form State
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [categoryId, setCategoryId] = useState(initialEvent?.categoryId || "community");
  const [tags, setTags] = useState<string[]>(initialEvent?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(initialEvent?.isFeatured || false);

  // Organizer
  const [organizerId, setOrganizerId] = useState<string | null>(initialEvent?.organizerId || null);
  const [organizerName, setOrganizerName] = useState(initialEvent?.organizerName || "");

  // Date & Time in PKT
  const defaultPktStart = useMemo(
    () => (initialEvent?.startTime ? dateToPktParts(initialEvent.startTime) : { date: "", time: "19:00" }),
    [initialEvent?.startTime]
  );
  const defaultPktEnd = useMemo(
    () => (initialEvent?.endTime ? dateToPktParts(initialEvent.endTime) : { date: "", time: "22:00" }),
    [initialEvent?.endTime]
  );

  const [startDateStr, setStartDateStr] = useState(defaultPktStart.date);
  const [startTimeStr, setStartTimeStr] = useState(defaultPktStart.time);
  const [endDateStr, setEndDateStr] = useState(defaultPktEnd.date);
  const [endTimeStr, setEndTimeStr] = useState(defaultPktEnd.time);

  // Venue & Location
  const [venueName, setVenueName] = useState(initialEvent?.venueName || "");
  const [address, setAddress] = useState(initialEvent?.address || "");
  const [mapsInput, setMapsInput] = useState("");
  const [latitude, setLatitude] = useState<number | null>(initialEvent?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialEvent?.longitude ?? null);

  // Images v2
  const [images, setImages] = useState<EventImage[]>(initialEvent?.images || []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Tickets
  const [ticketTypes, setTicketTypes] = useState<TicketTypeFormValues[]>(
    initialEvent?.ticketTypes?.length
      ? initialEvent.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          pricePkr: t.pricePkr,
          capacity: t.capacity,
          soldCount: t.soldCount || 0,
          maxPerPerson: t.maxPerPerson || 10,
        }))
      : [
          {
            id: `ticket_${Date.now()}`,
            name: "General Admission",
            pricePkr: 0,
            capacity: 100,
            soldCount: 0,
            maxPerPerson: 10,
          },
        ]
  );
  const [ticketUrl, setTicketUrl] = useState(initialEvent?.ticketUrl || "");
  // Paid events sell in the app (organizer's approved accounts) or through a ticket link.
  const [saleMode, setSaleMode] = useState<"app" | "link">(initialEvent?.ticketUrl ? "link" : "app");
  const [payoutMethods, setPayoutMethods] = useState<PayoutType[]>(initialEvent?.payoutMethods ?? []);

  // Details v2 (Audience, Languages, Amenities, Agenda, FAQ)
  const [audience, setAudience] = useState<string[]>(initialEvent?.audience || []);
  const [languages, setLanguages] = useState<string[]>(initialEvent?.languages || ["ur", "en"]);
  const [amenities, setAmenities] = useState<string[]>(initialEvent?.amenities || []);
  const [agenda, setAgenda] = useState(initialEvent?.agenda || []);
  const [faq, setFaq] = useState(initialEvent?.faq || []);

  // Series / Repeat
  const [seriesOccurrences, setSeriesOccurrences] = useState<SeriesOccurrence[]>([]);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Modal actions
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Autosave status
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasRestorableDraft, setHasRestorableDraft] = useState(false);

  // Organizers query
  const { data: organizers = [] } = useQuery<Organizer[]>({
    queryKey: qk.organizers.all,
    queryFn: fetchOrganizers,
  });

  // Compute startDate & endDate Date objects
  const computedStartTime = useMemo(() => {
    if (!startDateStr || !startTimeStr) return null;
    try {
      return pktToDate(startDateStr, startTimeStr);
    } catch {
      return null;
    }
  }, [startDateStr, startTimeStr]);

  const computedEndTime = useMemo(() => {
    if (!endDateStr || !endTimeStr) return null;
    try {
      return pktToDate(endDateStr, endTimeStr);
    } catch {
      return null;
    }
  }, [endDateStr, endTimeStr]);

  // Compute priceMinPkr and priceMaxPkr from ticketTypes
  const priceMinPkr = useMemo(() => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.pricePkr));
  }, [ticketTypes]);

  const priceMaxPkr = useMemo(() => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.max(...ticketTypes.map((t) => t.pricePkr));
  }, [ticketTypes]);

  const isPaid = ticketTypes.some((t) => t.pricePkr > 0);
  const { data: payoutSettings, isLoading: isPayoutLoading } = useQuery({
    queryKey: qk.payouts.detail(organizerId || "_"),
    queryFn: () => fetchPayoutSettings(organizerId as string),
    enabled: Boolean(organizerId) && isPaid,
  });
  const approvedMethods = payoutSettings?.active?.methods ?? [];
  const sellsInApp = isPaid && saleMode === "app" && approvedMethods.length > 0;

  // Handle Maps link parsing
  const handleMapsInputChange = (val: string) => {
    setMapsInput(val);
    if (!val.trim()) return;
    const parsed = parseMapsInput(val);
    if (parsed.ok) {
      setLatitude(parsed.lat);
      setLongitude(parsed.lng);
      toast.success("Location coordinates extracted from Google Maps link!");
    }
  };

  // Build form values object for preview & validation
  const currentFormValues = useMemo<Partial<EventFormValues>>(() => {
    return {
      title,
      description: description || null,
      images,
      imageUrls: images.map((i) => i.sizes.l),
      categoryId,
      tags,
      startTime: computedStartTime || (initialEvent?.startTime ?? undefined),
      endTime: computedEndTime ?? null,
      venueName,
      address: address || null,
      latitude,
      longitude,
      organizerId,
      organizerName: organizerName || "Organizer",
      priceMinPkr,
      priceMaxPkr,
      ticketUrl: saleMode === "link" ? ticketUrl || null : null,
      payoutMethods: saleMode === "app" ? payoutMethods : [],
      sellsInApp,
      ticketTypes,
      isFeatured,
      status: initialEvent?.status || "draft",
      agenda,
      faq,
      amenities,
      audience,
      languages,
      seriesId: initialEvent?.seriesId || null,
      seriesIndex: initialEvent?.seriesIndex || null,
      seriesCount: initialEvent?.seriesCount || null,
    };
  }, [
    title,
    description,
    images,
    categoryId,
    tags,
    computedStartTime,
    computedEndTime,
    venueName,
    address,
    latitude,
    longitude,
    organizerId,
    organizerName,
    priceMinPkr,
    priceMaxPkr,
    ticketUrl,
    saleMode,
    payoutMethods,
    sellsInApp,
    ticketTypes,
    isFeatured,
    initialEvent,
    agenda,
    faq,
    amenities,
    audience,
    languages,
  ]);

  // Section Status calculation
  const sections: FormSectionStatus[] = useMemo(() => {
    const basicsHasError = Boolean(errors.title || errors.description || errors.categoryId);
    const basicsComplete = Boolean(title.trim() && categoryId && organizerName.trim());

    const whenWhereHasError = Boolean(errors.startTime || errors.endTime || errors.venueName || errors.latitude);
    const whenWhereComplete = Boolean(computedStartTime && venueName.trim());

    const imagesHasError = Boolean(errors.images);
    const imagesComplete = images.length > 0 && !isUploadingImages;

    const ticketsHasError = Boolean(errors.ticketUrl || errors.ticketTypes || errors.priceMaxPkr);
    const ticketsComplete =
      ticketTypes.length > 0 && (!isPaid || (saleMode === "link" ? Boolean(ticketUrl) : sellsInApp));

    const detailsHasError = Boolean(errors.agenda || errors.faq);
    const detailsComplete = agenda.length > 0 || faq.length > 0 || amenities.length > 0;

    return [
      {
        id: "section-basics",
        label: "Basics",
        status: basicsHasError ? "error" : basicsComplete ? "complete" : "untouched",
      },
      {
        id: "section-when-where",
        label: "When & where",
        status: whenWhereHasError ? "error" : whenWhereComplete ? "complete" : "untouched",
      },
      {
        id: "section-images",
        label: "Images",
        status: imagesHasError ? "error" : imagesComplete ? "complete" : "untouched",
      },
      {
        id: "section-tickets",
        label: "Tickets",
        status: ticketsHasError ? "error" : ticketsComplete ? "complete" : "untouched",
      },
      {
        id: "section-details",
        label: "Details",
        isOptional: true,
        status: detailsHasError ? "error" : detailsComplete ? "complete" : "untouched",
      },
    ];
  }, [
    errors,
    title,
    categoryId,
    organizerName,
    computedStartTime,
    venueName,
    images.length,
    isUploadingImages,
    ticketTypes,
    priceMinPkr,
    ticketUrl,
    isPaid,
    saleMode,
    sellsInApp,
    agenda.length,
    faq.length,
    amenities.length,
  ]);

  // Autosave to localStorage debounced 1.5s
  useEffect(() => {
    if (isEditing) return; // Autosave drafts for new events
    const timer = setTimeout(() => {
      try {
        const payload = {
          title,
          description,
          categoryId,
          tags,
          startDateStr,
          startTimeStr,
          endDateStr,
          endTimeStr,
          venueName,
          address,
          latitude,
          longitude,
          organizerId,
          organizerName,
          ticketTypes,
          ticketUrl,
          audience,
          languages,
          amenities,
          agenda,
          faq,
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch {}
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    title,
    description,
    categoryId,
    tags,
    startDateStr,
    startTimeStr,
    endDateStr,
    endTimeStr,
    venueName,
    address,
    latitude,
    longitude,
    organizerId,
    organizerName,
    ticketTypes,
    ticketUrl,
    audience,
    languages,
    amenities,
    agenda,
    faq,
    isEditing,
    draftKey,
  ]);

  // Check for restorable draft on mount
  useEffect(() => {
    if (isEditing) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        setHasRestorableDraft(true);
      }
    } catch {}
  }, [isEditing, draftKey]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.categoryId) setCategoryId(data.categoryId);
      if (data.tags) setTags(data.tags);
      if (data.startDateStr) setStartDateStr(data.startDateStr);
      if (data.startTimeStr) setStartTimeStr(data.startTimeStr);
      if (data.endDateStr) setEndDateStr(data.endDateStr);
      if (data.endTimeStr) setEndTimeStr(data.endTimeStr);
      if (data.venueName) setVenueName(data.venueName);
      if (data.address) setAddress(data.address);
      if (typeof data.latitude === "number") setLatitude(data.latitude);
      if (typeof data.longitude === "number") setLongitude(data.longitude);
      if (data.organizerId) setOrganizerId(data.organizerId);
      if (data.organizerName) setOrganizerName(data.organizerName);
      if (data.ticketTypes) setTicketTypes(data.ticketTypes);
      if (data.ticketUrl) setTicketUrl(data.ticketUrl);
      if (data.audience) setAudience(data.audience);
      if (data.languages) setLanguages(data.languages);
      if (data.amenities) setAmenities(data.amenities);
      if (data.agenda) setAgenda(data.agenda);
      if (data.faq) setFaq(data.faq);
      setHasRestorableDraft(false);
      toast.success("Draft restored from local cache");
    } catch {
      toast.error("Failed to restore draft");
    }
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      setHasRestorableDraft(false);
      toast.info("Local draft discarded");
    } catch {}
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (tags.length >= 8) {
      toast.error("Up to 8 tags");
      return;
    }
    if (trimmed.length > 24) {
      toast.error("Tag must be under 24 characters");
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  // Validate entire form against schema
  const validateForm = (allowDraft = false) => {
    setErrors({});
    if (isUploadingImages) {
      toast.error("Wait for images to finish uploading");
      return null;
    }

    const payload: Partial<EventFormValues> = {
      ...currentFormValues,
      priceMinPkr,
      priceMaxPkr,
    };

    if (allowDraft) {
      // Relaxed validation for draft saves
      if (!payload.title?.trim()) {
        setErrors({ title: "Add a title" });
        toast.error("Add a title to save a draft");
        return null;
      }
      return payload as EventFormValues;
    }

    const result = eventSchemaV2.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      const firstErrorMessage = result.error.errors[0]?.message || "Please fix validation errors";
      toast.error(firstErrorMessage);
      return null;
    }

    return result.data;
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    const validData = validateForm(true);
    if (!validData) return;

    try {
      setIsSubmitting(true);
      const payload: EventFormValues = {
        ...validData,
        status: initialEvent?.status || "draft",
      };

      if (isEditing && initialEvent?.id) {
        await updateEvent(initialEvent.id, payload, initialEvent);
        toast.success("Draft saved successfully");
        queryClient.invalidateQueries({ queryKey: qk.events.detail(initialEvent.id) });
      } else {
        if (seriesOccurrences.length > 1) {
          // Series create
          const occs = seriesOccurrences.map((o) => ({
            startTime: o.startTime,
            endTime: o.endTime,
          }));
          const ids = await createEventSeries(payload, occs);
          toast.success(`Created series of ${ids.length} event drafts!`);
          localStorage.removeItem(draftKey);
          router.push("/events");
          return;
        }

        const newId = await createEvent(payload);
        toast.success("Event created as draft");
        localStorage.removeItem(draftKey);
        router.push(`/events/${newId}`);
      }
    } catch (err: any) {
      console.error("Save draft error:", err);
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish / Submit Handler
  const handlePublishSubmit = async () => {
    const validData = validateForm(false);
    if (!validData) return;

    try {
      setIsSubmitting(true);

      if (isEditing && initialEvent?.id) {
        await updateEvent(initialEvent.id, { ...validData, status: "published" }, initialEvent);
        await publishEvent(initialEvent.id, adminUid, validData.organizerId);
        toast.success("Event published successfully!");
        queryClient.invalidateQueries({ queryKey: qk.events.all });
        router.push("/events");
      } else {
        if (seriesOccurrences.length > 1) {
          const occs = seriesOccurrences.map((o) => ({
            startTime: o.startTime,
            endTime: o.endTime,
          }));
          const payload: EventFormValues = { ...validData, status: "published" };
          const ids = await createEventSeries(payload, occs);
          toast.success(`Created and published series of ${ids.length} events!`);
          localStorage.removeItem(draftKey);
          router.push("/events");
          return;
        }

        const payload: EventFormValues = { ...validData, status: "published" };
        const newId = await createEvent(payload);
        await publishEvent(newId, adminUid, payload.organizerId);
        toast.success("Event published successfully!");
        localStorage.removeItem(draftKey);
        router.push("/events");
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Failed to publish event");
    } finally {
      setIsSubmitting(false);
      setIsPublishModalOpen(false);
    }
  };

  // Ticket builders
  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        id: `ticket_${Date.now()}`,
        name: "Standard Ticket",
        pricePkr: 1500,
        capacity: 50,
        soldCount: 0,
        maxPerPerson: 5,
      },
    ]);
  };

  const updateTicketType = (id: string, updates: Partial<TicketTypeFormValues>) => {
    setTicketTypes(ticketTypes.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length <= 1) {
      toast.error("At least one ticket type is required");
      return;
    }
    setTicketTypes(ticketTypes.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Restore banner if draft exists */}
      {hasRestorableDraft && (
        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-between text-xs text-[var(--color-ink)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            <span>
              You have an unsaved local draft for this event. Would you like to restore it?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={discardDraft}>
              Discard
            </Button>
            <Button size="sm" variant="primary" onClick={restoreDraft}>
              Restore draft
            </Button>
          </div>
        </div>
      )}

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: SectionNav (Sticky, 200px equivalent) */}
        <aside className="hidden lg:block lg:col-span-2 sticky top-20">
          <SectionNav sections={sections} />
        </aside>

        {/* Middle Column: Form Sections (max-w-[680px]) */}
        <main className="lg:col-span-6 space-y-10 max-w-[680px] w-full">
          {/* SECTION 1: BASICS */}
          <section
            id="section-basics"
            className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-5 shadow-xs"
          >
            <div className="border-b border-[var(--color-border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)]">1. Basics</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                General event identity, category, and host organization.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="field-title"
                  className="text-xs font-semibold text-[var(--color-ink)]"
                >
                  Event Title <span className="text-[var(--color-crimson)]">*</span>
                </label>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  {title.length}/80
                </span>
              </div>
              <Input
                id="field-title"
                maxLength={80}
                placeholder="e.g. Islamabad Sufi & Qawwali Night"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="field-description"
                  className="text-xs font-semibold text-[var(--color-ink)]"
                >
                  About the Event
                </label>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  {description.length}/5000
                </span>
              </div>
              <Textarea
                id="field-description"
                rows={4}
                maxLength={5000}
                placeholder="Provide event overview, what to expect, atmosphere, and house rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors.description}
              />
            </div>

            {/* Category & Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="field-category"
                  className="text-xs font-semibold text-[var(--color-ink)]"
                >
                  Category <span className="text-[var(--color-crimson)]">*</span>
                </label>
                <Select
                  id="field-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={CATEGORIES}
                />
              </div>

              <div className="flex flex-col justify-end p-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-ink)]">
                      Featured Event
                    </div>
                    <div className="text-[10px] text-[var(--color-ink-muted)]">
                      Display on top banner &amp; spotlight
                    </div>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-ink)]">
                Organizer <span className="text-[var(--color-crimson)]">*</span>
              </label>
              {organizers.length > 0 ? (
                <select
                  value={organizerId || ""}
                  onChange={(e) => {
                    const selected = organizers.find((o) => o.id === e.target.value);
                    if (selected) {
                      setOrganizerId(selected.id);
                      setOrganizerName(selected.name);
                    } else {
                      setOrganizerId(null);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">-- Select Organizer --</option>
                  {organizers.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.email ? `(${org.email})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Organizer name"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                />
              )}
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  Tags ({tags.length}/8)
                </label>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  Press Enter to add
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] min-h-[42px] items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-subtle)] text-[11px] font-medium text-[var(--color-ink)] border border-[var(--color-border-subtle)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[var(--color-crimson)] ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {tags.length < 8 && (
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "e.g. livemusic, outdoor, sufi" : "Add tag..."}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                        handleRemoveTag(tags[tags.length - 1]);
                      }
                    }}
                    className="text-xs bg-transparent border-none outline-none flex-1 min-w-[100px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]"
                  />
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: WHEN & WHERE */}
          <section
            id="section-when-where"
            className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-5 shadow-xs"
          >
            <div className="border-b border-[var(--color-border-subtle)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink)]">2. When &amp; where</h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Event date, schedule in Pakistan Standard Time (PKT), and venue mapping.
                </p>
              </div>

              {/* Repeat Toggle (in create mode) */}
              {!isEditing && (
                <div>
                  {seriesOccurrences.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setIsRepeatModalOpen(true)}
                      className="px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Series ({seriesOccurrences.length} dates) · Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRepeatModalOpen(true)}
                      className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Repeat this event
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Starts & Ends in PKT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Starts */}
              <div className="space-y-1" id="field-start-time">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  Starts (PKT) <span className="text-[var(--color-crimson)]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                  />
                </div>
                {computedStartTime && (
                  <div className="text-[11px] font-mono text-[var(--color-crimson)] font-semibold mt-1">
                    {pktLabel(computedStartTime)}
                  </div>
                )}
                {errors.startTime && (
                  <p className="text-xs text-[var(--color-crimson)]">{errors.startTime}</p>
                )}
              </div>

              {/* Ends */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  Ends (PKT)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                  />
                </div>
                {computedEndTime && (
                  <div className="text-[11px] font-mono text-[var(--color-ink-muted)] font-semibold mt-1">
                    {pktLabel(computedEndTime)}
                  </div>
                )}
                {errors.endTime && (
                  <p className="text-xs text-[var(--color-crimson)]">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Venue Name & Address */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1" id="field-venue">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  Venue Name <span className="text-[var(--color-crimson)]">*</span>
                </label>
                <Input
                  placeholder="e.g. Lok Virsa Amphitheatre, Shakarparian"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  error={errors.venueName}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  Street Address (Optional)
                </label>
                <Input
                  placeholder="e.g. Garden Ave, Shakarparian Hills, Islamabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Google Maps Link / Coordinates Parser */}
              <div className="space-y-2 p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                <label className="text-xs font-semibold text-[var(--color-ink)] flex items-center justify-between">
                  <span>Google Maps link or Coordinates</span>
                  {latitude && longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-1"
                    >
                      View on Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>

                <Input
                  placeholder="Paste Google Maps URL (https://maps.app.goo.gl/...) or 33.6844, 73.0479"
                  value={mapsInput}
                  onChange={(e) => handleMapsInputChange(e.target.value)}
                />

                <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-ink-muted)]">
                  <span>Lat: {latitude !== null ? latitude.toFixed(6) : "None"}</span>
                  <span>Lng: {longitude !== null ? longitude.toFixed(6) : "None"}</span>
                </div>
                {errors.latitude && (
                  <p className="text-xs text-[var(--color-crimson)]">{errors.latitude}</p>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 3: IMAGES */}
          <section
            id="section-images"
            className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-5 shadow-xs"
          >
            <div className="border-b border-[var(--color-border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--color-ink)]">
                3. Images <span className="text-[var(--color-crimson)]">*</span>
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Upload up to 8 images. Image 1 is the cover. Set focal points and preview crops in real time.
              </p>
            </div>

            <ImageManager
              images={images}
              organizerId={organizerId}
              onChange={setImages}
              onUploadingChange={setIsUploadingImages}
              error={errors.images}
            />
          </section>

          {/* SECTION 4: TICKETS */}
          <section
            id="section-tickets"
            className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-5 shadow-xs"
          >
            <div className="border-b border-[var(--color-border-subtle)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink)]">4. Tickets &amp; Pricing</h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Configure admission types, capacity limits, and external checkout links.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addTicketType}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Ticket Type
              </Button>
            </div>

            {/* Ticket Types List */}
            <div className="space-y-3">
              {ticketTypes.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-ink)]">
                      Tier #{idx + 1}
                    </span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(ticket.id)}
                        className="text-[var(--color-ink-faint)] hover:text-[var(--color-crimson)] transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-ink)]">
                        Name
                      </label>
                      <Input
                        value={ticket.name}
                        onChange={(e) => updateTicketType(ticket.id, { name: e.target.value })}
                        placeholder="e.g. VIP Pass, Early Bird"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-ink)]">
                        Price (PKR, 0 = Free)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={ticket.pricePkr}
                        onChange={(e) =>
                          updateTicketType(ticket.id, { pricePkr: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-ink)]">
                        Capacity
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={ticket.capacity}
                        onChange={(e) =>
                          updateTicketType(ticket.id, { capacity: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How people pay for paid tickets */}
            {isPaid && (
              <div className="space-y-3 pt-2" id="field-ticket-url">
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  How people pay <span className="text-[var(--color-crimson)]">*</span>
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      ["app", "In the app"],
                      ["link", "Own ticket link"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSaleMode(mode)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        saleMode === mode
                          ? "bg-[var(--color-ink)] text-[var(--color-on-ink)] border-[var(--color-ink)]"
                          : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] text-[var(--color-ink-muted)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {saleMode === "link" ? (
                  <Input
                    placeholder="https://ticketwala.pk/event/... or WhatsApp booking link"
                    value={ticketUrl}
                    onChange={(e) => setTicketUrl(e.target.value)}
                    error={errors.ticketUrl}
                  />
                ) : !organizerId ? (
                  <p className="text-xs text-[var(--color-ink-muted)]">Pick an organizer to see their payment accounts.</p>
                ) : isPayoutLoading ? (
                  <p className="text-xs text-[var(--color-ink-muted)]">Loading payment accounts…</p>
                ) : approvedMethods.length === 0 ? (
                  <p className="text-xs text-[var(--color-crimson)]">
                    {organizerName || "This organizer"} has no approved payment accounts yet. Approve them in{" "}
                    <Link href="/payouts" className="underline">
                      Payout reviews
                    </Link>
                    , or use a ticket link.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Attendees pay {organizerName || "the organizer"} directly. Tick the accounts for this event; none
                      ticked means all of them.
                    </p>
                    {approvedMethods.map((m) => (
                      <label key={m.type} className="flex items-center gap-3 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[var(--color-accent)]"
                          checked={payoutMethods.includes(m.type)}
                          onChange={(e) =>
                            setPayoutMethods((prev) =>
                              e.target.checked ? [...prev, m.type] : prev.filter((t) => t !== m.type)
                            )
                          }
                        />
                        <span className="font-semibold text-[var(--color-ink)] w-28">{methodLabel(m)}</span>
                        <span className="font-mono text-[var(--color-ink)]">{displayValue(m)}</span>
                        <span className="text-[var(--color-ink-muted)]">{m.accountTitle}</span>
                      </label>
                    ))}
                    {errors.ticketUrl && <p className="text-xs text-[var(--color-crimson)]">{errors.ticketUrl}</p>}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION 5: DETAILS (OPTIONAL) */}
          <section
            id="section-details"
            className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-6 shadow-xs"
          >
            <div className="border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--color-ink)]">
                  5. Details &amp; Amenities
                </h2>
                <span className="text-xs text-[var(--color-ink-muted)]">Optional</span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Audience restrictions, spoken languages, venue amenities, itinerary schedule, and FAQs.
              </p>
            </div>

            {/* Chip Groups */}
            <ChipGroup
              selectedAudience={audience}
              selectedLanguages={languages}
              selectedAmenities={amenities}
              onAudienceChange={setAudience}
              onLanguagesChange={setLanguages}
              onAmenitiesChange={setAmenities}
              onAddEntryFaq={() => {
                const entryFaq = "How will entry be checked?";
                if (!faq.some((f) => f.q === entryFaq)) {
                  setFaq([
                    ...faq,
                    {
                      id: `faq_${Date.now()}`,
                      q: entryFaq,
                      a: "Please present your valid student ID / CNIC card at the entrance gate.",
                    },
                  ]);
                  toast.success("Added door check FAQ");
                }
              }}
            />

            <hr className="border-[var(--color-border-subtle)]" />

            {/* Agenda Table */}
            <AgendaTable
              agenda={agenda}
              startTime={computedStartTime}
              endTime={computedEndTime}
              onChange={setAgenda}
              error={errors.agenda}
            />

            <hr className="border-[var(--color-border-subtle)]" />

            {/* FAQ List */}
            <FaqList faq={faq} onChange={setFaq} error={errors.faq} />
          </section>
        </main>

        {/* Right Column: Phone Preview & Checklist (Sticky, 400px equivalent) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-6">
          <PhonePreview data={currentFormValues} />
          <EventChecklist data={currentFormValues} isUploadingImages={isUploadingImages} />
        </aside>
      </div>

      {/* Sticky Bottom Footer */}
      <footer className="sticky bottom-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border-subtle)] py-3 px-6 -mx-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to events
            </Button>
          </Link>
          {lastSavedTime && (
            <span className="text-xs text-[var(--color-ink-muted)] hidden sm:inline">
              Autosaved draft at {lastSavedTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPostponeModalOpen(true)}
              >
                Postpone
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel event
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
          >
            <Save className="w-4 h-4 mr-1.5" /> Save draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isSubmitting || isUploadingImages}
            onClick={() => setIsPublishModalOpen(true)}
          >
            <Send className="w-4 h-4 mr-1.5" />
            {seriesOccurrences.length > 1
              ? `Publish series (${seriesOccurrences.length})`
              : "Publish"}
          </Button>
        </div>
      </footer>

      {/* Repeat Modal */}
      <RepeatModal
        isOpen={isRepeatModalOpen}
        baseStartTime={computedStartTime || new Date()}
        baseEndTime={computedEndTime}
        initialOccurrences={seriesOccurrences}
        onClose={() => setIsRepeatModalOpen(false)}
        onApply={(occs) => {
          setSeriesOccurrences(occs);
          toast.success(`Series configured: ${occs.length} occurrences`);
        }}
      />

      {/* Publish Confirm Modal */}
      <PublishConfirmModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handlePublishSubmit}
        isPublishing={isSubmitting}
        seriesCount={seriesOccurrences.length > 1 ? seriesOccurrences.length : undefined}
      />

      {/* Other Modals for existing event actions */}
      {isEditing && initialEvent && (
        <>
          <CancelEventModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            eventTitle={title || initialEvent.title}
            registeredCount={initialEvent.soldCount || 0}
            onConfirm={async (reason) => {
              await cancelEvent(initialEvent.id, reason, initialEvent.organizerId);
              toast.success("Event cancelled");
              queryClient.invalidateQueries({ queryKey: qk.events.all });
              router.push("/events");
            }}
          />

          <PostponeEventModal
            isOpen={isPostponeModalOpen}
            onClose={() => setIsPostponeModalOpen(false)}
            eventTitle={title || initialEvent.title}
            onConfirm={async (params) => {
              await postponeEvent(initialEvent.id, params, initialEvent.organizerId);
              toast.success("Event postponed");
              queryClient.invalidateQueries({ queryKey: qk.events.all });
              router.push("/events");
            }}
          />

          <DeleteEventModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            eventTitle={title || initialEvent.title}
            registeredCount={initialEvent.soldCount || 0}
            onConfirm={async () => {
              await deleteEvent(initialEvent.id, initialEvent.organizerId);
              toast.success("Event deleted");
              queryClient.invalidateQueries({ queryKey: qk.events.all });
              router.push("/events");
            }}
          />
        </>
      )}
    </div>
  );
}
export default EventForm;
