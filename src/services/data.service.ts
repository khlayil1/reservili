import { Injectable } from '@angular/core';
import { ServiceProvider, ServiceCategory, Service, Worker, AvailabilitySlot, User, UserRole, Booking, RecurringAvailability, BlockedTime, Review } from '../models/reservili.model';

@Injectable({ providedIn: 'root' })
export class DataService {

  private users: User[] = [
    { id: 'cust1', name: 'Alex Doe', email: 'alex.doe@example.com', role: UserRole.Customer },
    { id: 'cust2', name: 'Jamie Smith', email: 'jamie.smith@example.com', role: UserRole.Customer },
    { id: 'cust3', name: 'Taylor Lee', email: 'taylor.lee@example.com', role: UserRole.Customer },
  ];

  private bookings: Booking[] = [];
  private reviews: Review[] = [];
  private dayNames: RecurringAvailability['dayOfWeek'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  private defaultRecurringAvailability: RecurringAvailability[] = this.dayNames.map(day => ({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
      isEnabled: day !== 'Sunday' && day !== 'Saturday'
  }));
  
  private serviceProviders: ServiceProvider[] = [
    {
      id: 'sp1',
      name: 'The Dapper Cut',
      category: 'Barbershop',
      location: '123 Main St, Anytown, USA',
      description: 'Classic and modern haircuts with a premium experience. We believe in quality, not quantity.',
      imageUrl: 'https://picsum.photos/seed/barber/800/600',
      galleryImages: [
        'https://picsum.photos/seed/barber-inside/600/400',
        'https://picsum.photos/seed/barber-chair/600/400',
        'https://picsum.photos/seed/barber-tools/600/400',
      ],
      rating: 0, // Will be calculated
      recurringAvailability: JSON.parse(JSON.stringify(this.defaultRecurringAvailability)),
      workers: [
        { id: 'w1a', name: 'Frankie', role: 'Senior Barber', serviceIds: ['s1a', 's1b', 's1c'], imageUrl: 'https://picsum.photos/seed/frankie/100/100' },
        { id: 'w1b', name: 'Miles', role: 'Barber', serviceIds: ['s1a', 's1b'], imageUrl: 'https://picsum.photos/seed/miles/100/100' },
        { id: 'w1c', name: 'Alex', role: 'Apprentice', serviceIds: ['s1b'], imageUrl: 'https://picsum.photos/seed/alex-w/100/100' },
      ],
      services: [
        { id: 's1a', name: 'Classic Haircut', description: 'A timeless cut tailored to you.', durationMinutes: 45, price: 35 },
        { id: 's1b', name: 'Beard Trim', description: 'Shape and define your beard.', durationMinutes: 20, price: 20 },
        { id: 's1c', name: 'Hot Towel Shave', description: 'The ultimate relaxing shave.', durationMinutes: 50, price: 45 }
      ],
      availability: []
    },
    {
      id: 'sp2',
      name: 'Padel Pro Arena',
      category: 'Sports',
      location: '456 Sports Ave, Sometown, USA',
      description: 'State-of-the-art indoor padel courts. Book a court for a friendly match or competitive game.',
      imageUrl: 'https://picsum.photos/seed/padel/800/600',
      galleryImages: [
        'https://picsum.photos/seed/padel-court1/600/400',
        'https://picsum.photos/seed/padel-action/600/400',
        'https://picsum.photos/seed/padel-lounge/600/400',
      ],
      rating: 0,
      recurringAvailability: this.dayNames.map(day => ({ dayOfWeek: day, startTime: '08:00', endTime: '22:00', isEnabled: true })),
      services: [
        { id: 's2a', name: 'Court Rental (60 min)', description: 'One hour of play time.', durationMinutes: 60, price: 25 },
        { id: 's2b', name: 'Court Rental (90 min)', description: 'An extended 90-minute session.', durationMinutes: 90, price: 35 }
      ],
      availability: []
    },
    {
      id: 'sp3',
      name: 'Bright Smiles Dental',
      category: 'Medical',
      location: '789 Health Rd, Medburg, USA',
      description: 'Comprehensive dental care for the whole family, from routine check-ups to cosmetic procedures.',
      imageUrl: 'https://picsum.photos/seed/dental/800/600',
      galleryImages: [
        'https://picsum.photos/seed/dental-office/600/400',
        'https://picsum.photos/seed/dental-exam/600/400',
      ],
      rating: 0,
      recurringAvailability: this.dayNames.map(day => ({ dayOfWeek: day, startTime: '08:30', endTime: '17:30', isEnabled: day !== 'Sunday' && day !== 'Saturday' })),
      workers: [
        { id: 'w3a', name: 'Dr. Chen', role: 'Dentist', serviceIds: ['s3a', 's3b', 's3c'], imageUrl: 'https://picsum.photos/seed/dr-chen/100/100' },
        { id: 'w3b', name: 'Maria', role: 'Hygienist', serviceIds: ['s3a'], imageUrl: 'https://picsum.photos/seed/maria/100/100' },
      ],
      services: [
        { id: 's3a', name: 'Dental Check-up & Cleaning', description: 'Routine examination and professional cleaning.', durationMinutes: 60, price: 120 },
        { id: 's3b', name: 'Teeth Whitening', description: 'Professional whitening for a brighter smile.', durationMinutes: 90, price: 250 },
        { id: 's3c', name: 'Consultation', description: 'Consult with our experts for any dental concerns.', durationMinutes: 30, price: 50 }
      ],
      availability: []
    },
    {
      id: 'sp4',
      name: 'The Gourmet Table',
      category: 'Restaurant',
      location: '101 Eatery Ln, Foodville, USA',
      description: 'An unforgettable fine dining experience with a modern twist on classic cuisine.',
      imageUrl: 'https://picsum.photos/seed/restaurant/800/600',
      rating: 0,
      recurringAvailability: this.dayNames.map(day => ({ dayOfWeek: day, startTime: '17:00', endTime: '23:00', isEnabled: day !== 'Monday' })),
      services: [
        { id: 's4a', name: 'Table for 2', description: 'Reserve a table for a party of two.', durationMinutes: 120, price: 0 },
        { id: 's4b', name: 'Table for 4', description: 'Reserve a table for a party of four.', durationMinutes: 120, price: 0 },
      ],
      availability: []
    },
    {
      id: 'sp5',
      name: 'Zenith Massage & Wellness',
      category: 'Wellness',
      location: '222 Relax Blvd, Calm City, USA',
      description: 'Escape the stress of daily life. Our certified therapists provide a range of massages to rejuvenate your body and mind.',
      imageUrl: 'https://picsum.photos/seed/massage/800/600',
      rating: 0,
      recurringAvailability: JSON.parse(JSON.stringify(this.defaultRecurringAvailability)),
      workers: [
        { id: 'w5a', name: 'Elena', role: 'Massage Therapist', serviceIds: ['s5a', 's5b'], imageUrl: 'https://picsum.photos/seed/elena/100/100' },
        { id: 'w5b', name: 'David', role: 'Massage Therapist', serviceIds: ['s5a', 's5b'], imageUrl: 'https://picsum.photos/seed/david/100/100' },
      ],
      services: [
        { id: 's5a', name: 'Swedish Massage', description: 'A gentle, full-body massage for relaxation.', durationMinutes: 60, price: 80 },
        { id: 's5b', name: 'Deep Tissue Massage', description: 'Targets deeper layers of muscle and connective tissue.', durationMinutes: 60, price: 95 },
      ],
      availability: []
    },
    {
      id: 'sp-owner1',
      ownerId: 'provider1',
      name: 'Ink & Iron Tattoo',
      category: 'Specialty',
      location: '555 Artistry Alley, Metro City, USA',
      description: 'Custom tattoos from award-winning artists. Bring your vision to life.',
      imageUrl: 'https://picsum.photos/seed/tattoo/800/600',
      galleryImages: [
          'https://picsum.photos/seed/tattoo-shop1/600/400',
          'https://picsum.photos/seed/tattoo-artist/600/400',
          'https://picsum.photos/seed/tattoo-flash/600/400',
          'https://picsum.photos/seed/tattoo-detail/600/400'
      ],
      rating: 0,
      recurringAvailability: this.dayNames.map(day => ({ dayOfWeek: day, startTime: '11:00', endTime: '19:00', isEnabled: day === 'Tuesday' || day === 'Wednesday' || day === 'Thursday' || day === 'Friday' || day === 'Saturday' })),
      blockedTimes: [],
      workers: [
        { id: 'w6a', name: 'Samantha "Sam" Inkwell', role: 'Lead Artist', serviceIds: ['s6a', 's6b'], imageUrl: 'https://picsum.photos/seed/sam-ink/100/100' },
        { id: 'w6b', name: 'Leo', role: 'Artist', serviceIds: ['s6a', 's6b'], imageUrl: 'https://picsum.photos/seed/leo/100/100' },
      ],
      services: [
        { id: 's6a', name: 'Consultation', description: '30-minute consultation to discuss your tattoo idea.', durationMinutes: 30, price: 0 },
        { id: 's6b', name: 'Small Tattoo (1-2 hours)', description: 'Book a session for a small piece.', durationMinutes: 120, price: 250 },
      ],
      availability: []
    }
  ];
  
  private categories: ServiceCategory[] = [
      { name: 'Barbershop', icon: 'scissors' },
      { name: 'Sports', icon: 'trophy' },
      { name: 'Medical', icon: 'beaker' },
      { name: 'Restaurant', icon: 'building-storefront' },
      { name: 'Wellness', icon: 'sparkles' },
      { name: 'Specialty', icon: 'paint-brush' },
      { name: 'All', icon: 'squares-2x2' }
  ];
  
  constructor() {
    this._initializeMockData();
  }

  private _initializeMockData() {
    this._initializeMockBookings();
    this._initializeMockReviews();
  }
  
  private _initializeMockReviews() {
    this.reviews = [
        { id: 'r1', userId: 'cust2', userName: 'Jamie Smith', providerId: 'sp1', workerId: 'w1a', workerName: 'Frankie', rating: 5, comment: 'Frankie is the best! Always a perfect cut.', date: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'r2', userId: 'cust3', userName: 'Taylor Lee', providerId: 'sp1', workerId: 'w1b', workerName: 'Miles', rating: 4, comment: 'Great haircut, very clean shop. Miles was very professional.', date: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 'r3', userId: 'cust1', userName: 'Alex Doe', providerId: 'sp2', rating: 5, comment: 'Amazing courts, super easy to book online. Will be back!', date: new Date(Date.now() - 1 * 86400000).toISOString() },
        { id: 'r4', userId: 'cust2', userName: 'Jamie Smith', providerId: 'sp3', workerId: 'w3b', workerName: 'Maria', rating: 5, comment: 'Maria is an excellent hygienist. So gentle and thorough.', date: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 'r5', userId: 'cust1', userName: 'Alex Doe', providerId: 'sp-owner1', workerId: 'w6a', workerName: 'Samantha "Sam" Inkwell', rating: 5, comment: 'Sam is an incredible artist. She brought my idea to life perfectly.', date: new Date(Date.now() - 3 * 86400000).toISOString() }
    ];
  }

  private _initializeMockBookings() {
    this.serviceProviders.forEach(provider => {
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const allSlotsForDay = this._generateAllPossibleSlotsForDay(provider, date);
            allSlotsForDay.forEach((slot, index) => {
                const daySeed = parseInt(date.toISOString().slice(0, 10).replace(/-/g, ''), 10);
                const workerIndex = provider.workers?.findIndex(w => w.id === slot.workerId) ?? 0;
                const pseudoRandom = Math.abs(Math.sin(daySeed + index + workerIndex * 10));

                if (pseudoRandom < 0.35 && provider.services.length > 0 && this.users.length > 0) {
                    const randomUser = this.users[Math.floor(pseudoRandom * 100) % this.users.length];
                    let servicesForWorker = provider.services;
                    if(slot.workerId && provider.workers) {
                        const worker = provider.workers.find(w => w.id === slot.workerId);
                        if(worker?.serviceIds) {
                            servicesForWorker = provider.services.filter(s => worker.serviceIds!.includes(s.id));
                        }
                    }
                    if(servicesForWorker.length === 0) servicesForWorker = provider.services;

                    if (servicesForWorker.length > 0) {
                        const randomService = servicesForWorker[Math.floor(pseudoRandom * 100) % servicesForWorker.length];
                        const bookingId = `b-${daySeed}-${provider.id}-${index}`;
                        if (randomService && !this.bookings.find(b => b.id === bookingId)) {
                            this.bookings.push({
                                id: bookingId, userId: randomUser.id, providerId: provider.id,
                                serviceId: randomService.id, workerId: slot.workerId,
                                startTime: slot.startTime, endTime: slot.endTime, status: 'confirmed'
                            });
                        }
                    }
                }
            });
        }
    });
  }
  
  private _generateAllPossibleSlotsForDay(provider: ServiceProvider, date: Date): AvailabilitySlot[] {
    const dayName = this.dayNames[date.getDay()];
    const schedule = provider.recurringAvailability.find(r => r.dayOfWeek === dayName);
    if (!schedule || !schedule.isEnabled) return [];

    let allSlots: AvailabilitySlot[] = [];
    const duration = provider.services[0]?.durationMinutes || 60;

    const generateSlots = (openTime: string, closeTime: string, slotDurationMinutes: number, workerId?: string): AvailabilitySlot[] => {
        const slots = [];
        const targetDay = new Date(date);
        const [startHour, startMinute] = openTime.split(':').map(Number);
        targetDay.setHours(startHour, startMinute, 0, 0);
        const endOfDay = new Date(targetDay);
        const [endHour, endMinute] = closeTime.split(':').map(Number);
        endOfDay.setHours(endHour, endMinute, 0, 0);
        let currentTime = new Date(targetDay);
        while (currentTime < endOfDay) {
            const endTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
            if (endTime > endOfDay) break;
            const isBlocked = (provider.blockedTimes || []).some(blocker => {
                const blockStart = new Date(blocker.startTime);
                const blockEnd = new Date(blocker.endTime);
                return currentTime < blockEnd && endTime > blockStart;
            });
            if (!isBlocked) {
                slots.push({ startTime: new Date(currentTime), endTime: endTime, isBooked: false, workerId: workerId });
            }
            currentTime = endTime;
        }
        return slots;
    };

    if (provider.workers && provider.workers.length > 0) {
        provider.workers.forEach(worker => {
            const workerSlots = generateSlots(schedule.startTime, schedule.endTime, duration, worker.id);
            allSlots = allSlots.concat(workerSlots);
        });
    } else {
        allSlots = generateSlots(schedule.startTime, schedule.endTime, duration);
    }
    return allSlots;
  }
  
  generateSlotsForProviderForDay(provider: ServiceProvider, date: Date): AvailabilitySlot[] {
    const allPossibleSlots = this._generateAllPossibleSlotsForDay(provider, date);
    allPossibleSlots.forEach(slot => {
        const booking = this.bookings.find(b =>
            b.providerId === provider.id &&
            b.workerId === slot.workerId &&
            new Date(b.startTime).getTime() === slot.startTime.getTime()
        );
        if (booking) {
            slot.isBooked = true;
            slot.bookingId = booking.id;
        }
    });
    return allPossibleSlots;
  }

  createBooking(details: { providerId: string; serviceId: string; workerId?: string; userId: string; slot: AvailabilitySlot }): Booking {
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      providerId: details.providerId,
      serviceId: details.serviceId,
      workerId: details.workerId,
      userId: details.userId,
      startTime: details.slot.startTime,
      endTime: details.slot.endTime,
      status: 'confirmed'
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  getServiceProviders(): ServiceProvider[] {
    const providers = JSON.parse(JSON.stringify(this.serviceProviders));
    providers.forEach((provider: ServiceProvider) => {
        const providerReviews = this.reviews.filter(r => r.providerId === provider.id);
        if (providerReviews.length > 0) {
            const total = providerReviews.reduce((acc, r) => acc + r.rating, 0);
            provider.rating = parseFloat((total / providerReviews.length).toFixed(1));
        } else {
            provider.rating = 0;
        }

        if (provider.workers) {
            provider.workers.forEach(worker => {
                const workerReviews = this.reviews.filter(r => r.workerId === worker.id);
                if (workerReviews.length > 0) {
                    const total = workerReviews.reduce((acc, r) => acc + r.rating, 0);
                    worker.rating = parseFloat((total / workerReviews.length).toFixed(1));
                } else {
                    worker.rating = 0;
                }
            });
        }
        // Attach reviews to provider object for easy access in components
        provider.reviews = providerReviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return providers;
  }
  
  getProviderByOwnerId(ownerId: string): ServiceProvider | null {
    // We need to call the main get function to ensure ratings are calculated
    const allProviders = this.getServiceProviders();
    const provider = allProviders.find(p => p.ownerId === ownerId);
    return provider ? provider : null;
  }
  
  getCategories(): ServiceCategory[] {
      return this.categories;
  }

  getFeaturedProviders(): ServiceProvider[] {
    // Use the main getter to ensure ratings are calculated before filtering
    return this.getServiceProviders()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }

  getBookingDetails(bookingId: string): { booking: Booking; user: User; service: Service; } | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    const user = this.users.find(u => u.id === booking.userId);
    const provider = this.serviceProviders.find(p => p.id === booking.providerId);
    const service = provider?.services.find(s => s.id === booking.serviceId);

    if (user && service) {
      return { booking, user, service };
    }
    return null;
  }
  
  getReviewsForProvider(providerId: string): Review[] {
    return this.reviews
        .filter(r => r.providerId === providerId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addReview(reviewDetails: Omit<Review, 'id' | 'date'>) {
      const newReview: Review = {
          ...reviewDetails,
          id: `r-${Date.now()}`,
          date: new Date().toISOString()
      };
      this.reviews.push(newReview);
  }

  addServiceProvider(
    providerDetails: Omit<ServiceProvider, 'id' | 'rating' | 'recurringAvailability' | 'services' | 'availability' | 'workers' | 'blockedTimes' | 'galleryImages'>, 
    ownerId: string
  ) {
    const newProvider: ServiceProvider = {
      ...providerDetails,
      id: `sp-${Date.now()}`,
      ownerId: ownerId,
      rating: 0,
      galleryImages: [],
      recurringAvailability: JSON.parse(JSON.stringify(this.defaultRecurringAvailability)),
      services: [],
      availability: [],
      workers: [],
      blockedTimes: []
    };
    this.serviceProviders.push(newProvider);
    return newProvider;
  }

  updateProvider(updatedProvider: ServiceProvider) {
    const index = this.serviceProviders.findIndex(p => p.id === updatedProvider.id);
    if (index !== -1) {
      this.serviceProviders[index] = updatedProvider;
    }
  }

  addServiceToProvider(providerId: string, service: Service) {
    const provider = this.serviceProviders.find(p => p.id === providerId);
    if (provider) {
      provider.services.push({ ...service, id: `s${provider.id}-${new Date().getTime()}`});
    }
  }

  updateServiceForProvider(providerId: string, updatedService: Service) {
    const provider = this.serviceProviders.find(p => p.id === providerId);
    if (provider) {
        const serviceIndex = provider.services.findIndex(s => s.id === updatedService.id);
        if (serviceIndex !== -1) {
            provider.services[serviceIndex] = updatedService;
        }
    }
  }

  deleteServiceForProvider(providerId: string, serviceId: string) {
      const provider = this.serviceProviders.find(p => p.id === providerId);
      if (provider) {
          provider.services = provider.services.filter(s => s.id !== serviceId);
          if (provider.workers) {
              provider.workers.forEach(worker => {
                  if (worker.serviceIds) {
                      worker.serviceIds = worker.serviceIds.filter(id => id !== serviceId);
                  }
              });
          }
      }
  }

  addWorkerToProvider(providerId: string, worker: Omit<Worker, 'id'>) {
    const provider = this.serviceProviders.find(p => p.id === providerId);
    if (provider) {
        if (!provider.workers) {
            provider.workers = [];
        }
        const newWorker: Worker = { ...worker, id: `w${provider.id}-${new Date().getTime()}`, serviceIds: []};
        provider.workers.push(newWorker);
    }
  }
  
  deleteWorkerForProvider(providerId: string, workerId: string) {
    const provider = this.serviceProviders.find(p => p.id === providerId);
    if (provider && provider.workers) {
      provider.workers = provider.workers.filter(w => w.id !== workerId);
    }
  }

  addBlockedTimeToProvider(providerId: string, blocker: Omit<BlockedTime, 'id'>) {
    const provider = this.serviceProviders.find(p => p.id === providerId);
    if (provider) {
        if (!provider.blockedTimes) {
            provider.blockedTimes = [];
        }
        const newBlocker = { ...blocker, id: `bt-${Date.now()}` };
        provider.blockedTimes.push(newBlocker);
    }
  }

  getDayNames(): RecurringAvailability['dayOfWeek'][] {
      return this.dayNames;
  }
}