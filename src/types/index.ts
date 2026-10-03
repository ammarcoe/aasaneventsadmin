export type EventStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'postponed';

export interface TicketType {
  id: string;
  name: string;
  pricePkr: number;
  capacity: number;
  soldCount: number;
  maxPerPerson?: number;
}

export interface EventImageSizes {
  s: string; // <= 400px long edge - thumbnails
  m: string; // <= 800px
  l: string; // <= 1600px - cards, detail, story
}

export interface EventImage {
  id: string; // uuid
  path: string; // storage path
  sizes: EventImageSizes;
  w: number; // processed width, px
  h: number; // processed height, px
  focalX: number; // 0–1, left -> right
  focalY: number; // 0–1, top -> bottom
  fit: 'fill' | 'fit';
  bg: string; // '#RRGGBB' dominant color
  alt?: string | null; // accessibility description <= 200
}

export interface AgendaItem {
  id: string;
  time: string; // 'HH:mm' PKT wall-clock
  dayOffset: number; // 0 = start day, 1 = next day...
  title: string; // <= 80
  host?: string | null; // <= 60
  note?: string | null; // <= 200
}

export interface FaqItem {
  id: string;
  q: string; // <= 120
  a: string; // <= 600
}

export type AmenityId =
  | 'parking'
  | 'food'
  | 'free_water'
  | 'prayer_space'
  | 'washrooms'
  | 'family_friendly'
  | 'wheelchair'
  | 'indoor'
  | 'outdoor'
  | 'wifi';

export type AudienceId = 'students' | 'women' | 'families' | 'adults';

export type LanguageId = 'ur' | 'en' | 'pa' | 'ps' | 'sd' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  images: EventImage[];
  imageUrls: string[];
  categoryId: string;
  tags: string[];
  startTime: Date;
  endTime: Date | null;
  venueName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  organizerId: string | null;
  organizerName: string;
  priceMinPkr: number | null;
  priceMaxPkr: number | null;
  ticketUrl: string | null;
  /** Paid in-app events: payout types that take this event's money (empty = all approved). */
  payoutMethods?: PayoutType[];
  ticketTypes: TicketType[];
  isFeatured: boolean;
  status: EventStatus;
  agenda?: AgendaItem[];
  faq?: FaqItem[];
  amenities?: string[];
  audience?: string[];
  languages?: string[];
  seriesId?: string | null;
  seriesIndex?: number | null;
  seriesCount?: number | null;
  soldCount?: number;
  capacity?: number;
  mapImageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string; // normalised +92300...
  avatarUrl: string | null;
  bio?: string | null;
  linkedUserId: string | null;
  linkedUserEmail?: string | null;
  status: 'active' | 'suspended';
  /** Set by the server once an admin approves payout accounts. */
  acceptsPayments?: boolean;
  eventCount: number;
  upcomingEventCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'organizer' | 'user';
  isAdmin?: boolean;
  linkedOrganizerId?: string | null;
}

export type PayoutType = 'raast' | 'jazzcash' | 'easypaisa' | 'iban';

export interface PayoutMethod {
  type: PayoutType;
  value: string; // 03XXXXXXXXX or PK.. IBAN, normalized by the server
  accountTitle: string;
}

export interface PayoutProfile {
  methods: PayoutMethod[];
  qrImagePath: string | null;
  at: Date | null; // submittedAt (pending) or approvedAt (active)
}

export interface PayoutSettings {
  active: PayoutProfile | null;
  pending: PayoutProfile | null;
  rejectionReason: string | null;
}

export type RegistrationStatus =
  | 'awaiting_payment'
  | 'in_review'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface RegistrationPayment {
  method: PayoutType | null;
  transactionId: string | null;
  proofPath: string | null;
  submittedAt: Date | null;
  holdExpiresAt: Date | null;
  rejectionReason: string | null;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  status?: string;
  checkedIn?: boolean;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  totalPkr: number;
  organizerId?: string | null;
  reference?: string;
  payment?: RegistrationPayment | null;
  createdAt: Date;
}

export interface EventFilter {
  status?: EventStatus | 'all' | 'past';
  search?: string;
  categoryId?: string;
  organizerId?: string;
}
