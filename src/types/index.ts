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

export interface Event {
  id: string;
  title: string;
  description: string | null;
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
  ticketTypes: TicketType[];
  isFeatured: boolean;
  status: EventStatus;
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
  createdAt: Date;
}

export interface EventFilter {
  status?: EventStatus | 'all' | 'past';
  search?: string;
  categoryId?: string;
  organizerId?: string;
}
