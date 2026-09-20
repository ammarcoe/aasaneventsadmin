import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { eventConverter, organizerConverter } from "@/lib/converters";
import { formatRelativeTime } from "@/lib/utils";

export interface DashboardMetrics {
  pendingCount: number;
  oldestPendingSubtitle: string;
  publishedCount: number;
  publishedThisWeekSubtitle: string;
  registrationsCount: number;
  registrationsThisWeekSubtitle: string;
  organizersCount: number;
  unlinkedOrganizersSubtitle: string;
}

export interface NeedsAttentionItem {
  id: string;
  type:
    | "missing_image"
    | "high_sold"
    | "old_pending"
    | "idle_organizer"
    | "past_featured"
    | "zero_sold_48h"
    | "no_venue_registrations";
  title: string;
  subtitle: string;
  urgency: "high" | "medium";
  fixHref: string;
  eventId?: string;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Pending count & oldest pending query
  let pendingCount = 0;
  let oldestPendingSubtitle = "None pending";
  try {
    const pendingQ = query(collection(db, "events"), where("status", "==", "pending"));
    const pendingSnap = await getCountFromServer(pendingQ);
    pendingCount = pendingSnap.data().count;

    if (pendingCount > 0) {
      const oldestQ = query(
        collection(db, "events").withConverter(eventConverter),
        where("status", "==", "pending"),
        orderBy("createdAt", "asc"),
        limit(1)
      );
      const oldestSnap = await getDocs(oldestQ);
      if (!oldestSnap.empty) {
        const oldestDoc = oldestSnap.docs[0].data();
        oldestPendingSubtitle = `oldest ${formatRelativeTime(oldestDoc.createdAt) || "recently"}`;
      }
    }
  } catch (err) {
    console.warn("Metrics pending count failed:", err);
  }

  // 2. Published count & this week
  let publishedCount = 0;
  let publishedThisWeek = 0;
  try {
    const pubQ = query(collection(db, "events"), where("status", "==", "published"));
    const pubSnap = await getCountFromServer(pubQ);
    publishedCount = pubSnap.data().count;

    const pubWeekQ = query(
      collection(db, "events"),
      where("status", "==", "published"),
      where("createdAt", ">=", oneWeekAgo)
    );
    const pubWeekSnap = await getCountFromServer(pubWeekQ);
    publishedThisWeek = pubWeekSnap.data().count;
  } catch (err) {
    console.warn("Metrics published count failed:", err);
  }

  // 3. Registrations count & this week
  let registrationsCount = 0;
  let registrationsThisWeek = 0;
  try {
    const regQ = collection(db, "registrations");
    const regSnap = await getCountFromServer(regQ);
    registrationsCount = regSnap.data().count;

    const regWeekQ = query(
      collection(db, "registrations"),
      where("createdAt", ">=", oneWeekAgo)
    );
    const regWeekSnap = await getCountFromServer(regWeekQ);
    registrationsThisWeek = regWeekSnap.data().count;
  } catch (err) {
    console.warn("Metrics registration count failed:", err);
  }

  // 4. Organizers count & unlinked count
  let organizersCount = 0;
  let unlinkedCount = 0;
  try {
    const orgQ = collection(db, "organizers");
    const orgSnap = await getCountFromServer(orgQ);
    organizersCount = orgSnap.data().count;

    const unlinkedQ = query(
      collection(db, "organizers"),
      where("linkedUserId", "==", null)
    );
    const unlinkedSnap = await getCountFromServer(unlinkedQ);
    unlinkedCount = unlinkedSnap.data().count;
  } catch (err) {
    console.warn("Metrics organizer count failed:", err);
  }

  return {
    pendingCount,
    oldestPendingSubtitle,
    publishedCount,
    publishedThisWeekSubtitle: `${publishedThisWeek} this week`,
    registrationsCount,
    registrationsThisWeekSubtitle: `+${registrationsThisWeek} this week`,
    organizersCount,
    unlinkedOrganizersSubtitle: `${unlinkedCount} not linked`,
  };
}

export async function fetchNeedsAttentionItems(): Promise<NeedsAttentionItem[]> {
  const items: NeedsAttentionItem[] = [];
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  try {
    // 1. Check featured events to catch past featured ones (W4)
    try {
      const featuredQ = query(
        collection(db, "events").withConverter(eventConverter),
        where("isFeatured", "==", true),
        limit(20)
      );
      const featuredSnap = await getDocs(featuredQ);
      featuredSnap.docs.forEach((d) => {
        const e = d.data();
        const isPast = e.endTime ? e.endTime < now : e.startTime < now;
        if (isPast) {
          items.push({
            id: `past_feat_${e.id}`,
            type: "past_featured",
            title: e.title,
            subtitle: "Past event is still marked as featured on home feed",
            urgency: "high",
            fixHref: `/events/${e.id}`,
            eventId: e.id,
          });
        }
      });
    } catch (err) {
      console.warn("Featured check for needs attention failed:", err);
    }

    // 2. Published events checks
    const upcomingEventsQ = query(
      collection(db, "events").withConverter(eventConverter),
      where("status", "==", "published"),
      limit(50)
    );
    const upcomingSnap = await getDocs(upcomingEventsQ);

    upcomingSnap.docs.forEach((d) => {
      const e = d.data();
      const capacity = e.capacity || e.ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);
      const sold = e.soldCount ?? e.ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);

      // Check: Event with registrations but no venue
      if (sold > 0 && (!e.venueName || e.venueName.trim().length === 0)) {
        items.push({
          id: `no_venue_${e.id}`,
          type: "no_venue_registrations",
          title: e.title,
          subtitle: `Has ${sold} registrations but venue name is empty`,
          urgency: "high",
          fixHref: `/events/${e.id}`,
          eventId: e.id,
        });
      }

      if (e.startTime < now) return; // Remaining checks are for upcoming

      // Condition 1: Starting within 48h, no image
      if (e.startTime <= in48Hours && (!e.imageUrls || e.imageUrls.length === 0 || !e.imageUrls[0])) {
        items.push({
          id: `missing_img_${e.id}`,
          type: "missing_image",
          title: e.title,
          subtitle: "Starting within 48 hours with no banner image uploaded",
          urgency: "high",
          fixHref: `/events/${e.id}`,
          eventId: e.id,
        });
      }

      // Condition 2: Above 90% sold
      if (capacity > 0 && sold / capacity >= 0.9) {
        items.push({
          id: `sold_out_${e.id}`,
          type: "high_sold",
          title: e.title,
          subtitle: `${Math.round((sold / capacity) * 100)}% capacity sold (${sold}/${capacity} tickets)`,
          urgency: "medium",
          fixHref: `/events/${e.id}`,
          eventId: e.id,
        });
      }

      // Condition 3: Starting in 48h with 0 tickets sold
      if (e.startTime <= in48Hours && sold === 0 && capacity > 0) {
        items.push({
          id: `zero_sold_${e.id}`,
          type: "zero_sold_48h",
          title: e.title,
          subtitle: "Starting within 48 hours with 0 tickets sold",
          urgency: "high",
          fixHref: `/events/${e.id}`,
          eventId: e.id,
        });
      }
    });

    // Condition 3: Pending over 3 days old
    const oldPendingQ = query(
      collection(db, "events").withConverter(eventConverter),
      where("status", "==", "pending"),
      where("createdAt", "<=", threeDaysAgo),
      limit(20)
    );
    const oldPendingSnap = await getDocs(oldPendingQ);
    oldPendingSnap.docs.forEach((d) => {
      const e = d.data();
      items.push({
        id: `pending_${e.id}`,
        type: "old_pending",
        title: e.title,
        subtitle: `Awaiting review for ${formatRelativeTime(e.createdAt)}`,
        urgency: "high",
        fixHref: "/pending",
      });
    });

    // Condition 4: Organizers with zero upcoming events
    const idleOrgQ = query(
      collection(db, "organizers").withConverter(organizerConverter),
      where("status", "==", "active"),
      where("upcomingEventCount", "==", 0),
      limit(20)
    );
    const idleOrgSnap = await getDocs(idleOrgQ);
    idleOrgSnap.docs.forEach((d) => {
      const org = d.data();
      items.push({
        id: `idle_org_${org.id}`,
        type: "idle_organizer",
        title: org.name,
        subtitle: "Active organizer with 0 upcoming events scheduled",
        urgency: "medium",
        fixHref: `/organizers/${org.id}`,
      });
    });
  } catch (err) {
    console.error("Needs attention query failed:", err);
  }

  return items;
}
