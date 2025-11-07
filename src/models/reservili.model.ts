export enum UserRole {
  Customer = 'Customer',
  ServiceProvider = 'ServiceProvider',
  Admin = 'Admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  serviceIds?: string[];
  imageUrl?: string;
  rating?: number;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  bookingId?: string;
  workerId?: string;
}

export interface RecurringAvailability {
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isEnabled: boolean;
}

export interface BlockedTime {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  reason?: string;
}


export interface ServiceProvider {
  id: string;
  ownerId?: string; // Link to the User who owns this profile
  name: string;
  category: string;
  location: string;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  rating: number;
  recurringAvailability: RecurringAvailability[];
  blockedTimes?: BlockedTime[];
  services: Service[];
  workers?: Worker[];
  availability: AvailabilitySlot[];
  reviews?: Review[];
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  workerId?: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  providerId: string;
  workerId?: string;
  workerName?: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO String
}

export interface ServiceCategory {
  name: string;
  icon: string; // Heroicon name
}