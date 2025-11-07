import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceProvider, Service, AvailabilitySlot, Worker, Booking, Review, User } from '../../models/reservili.model';
import { DataService } from '../../services/data.service';
import { UserService } from '../../services/user.service';

interface BookingDetails {
  provider: ServiceProvider;
  service: Service;
  worker?: Worker;
  slot: AvailabilitySlot;
}

@Component({
  selector: 'app-provider-detail',
  templateUrl: './provider-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, FormsModule],
})
export class ProviderDetailComponent {
  provider = input.required<ServiceProvider>();
  navigateBack = output<void>();
  bookingRequest = output<{
    providerId: string;
    serviceId: string;
    workerId?: string;
    userId: string;
    slot: AvailabilitySlot;
  }>();
  reviewAdded = output<Omit<Review, 'id' | 'date'>>();

  private dataService = inject(DataService);
  userService = inject(UserService);

  selectedService = signal<Service | null>(null);
  selectedWorker = signal<Worker | null>(null);

  calendarStartDate = signal(new Date());
  selectedDate = signal(new Date());

  bookingDetails = signal<BookingDetails | null>(null);
  showConfirmation = signal(false);
  isBooking = signal(false);
  
  // Review state
  isReviewModalOpen = signal(false);
  newReview = signal({ rating: 5, comment: '', workerId: '' });

  currentUser = this.userService.currentUser;

  availableWorkersForService = computed(() => {
    const prov = this.provider();
    const service = this.selectedService();
    
    if (!service || !prov.workers) {
      return [];
    }
    
    return prov.workers.filter(worker => 
      worker.serviceIds && worker.serviceIds.includes(service.id)
    );
  });

  canProceedToBooking = computed(() => {
    const p = this.provider();
    return this.selectedService() && (!p.workers || p.workers.length === 0 || this.selectedWorker());
  });

  calendarDays = computed(() => {
    const days: Date[] = [];
    const startDate = new Date(this.calendarStartDate());
    startDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  });

  canGoToPreviousWeek = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(this.calendarStartDate());
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  });

  availableSlots = computed(() => {
    const prov = this.provider();
    const date = this.selectedDate();
    const allSlotsForDay = this.dataService.generateSlotsForProviderForDay(prov, date);

    if (!this.canProceedToBooking()) return [];

    const worker = this.selectedWorker();
    if (worker) { // Provider has workers, and one is selected
        return allSlotsForDay.filter(slot => !slot.isBooked && slot.workerId === worker.id);
    } else if (!prov.workers || prov.workers.length === 0) { // Provider has no workers
        return allSlotsForDay.filter(slot => !slot.isBooked && !slot.workerId);
    }
    return [];
  });
  
  getFormattedTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  onSelectService(service: Service) {
    this.selectedService.set(service);
    this.selectedWorker.set(null);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    this.calendarStartDate.set(today);
    this.selectedDate.set(today);

    const availableWorkers = this.availableWorkersForService();
    if (availableWorkers.length === 1) {
        this.selectedWorker.set(availableWorkers[0]);
    }
  }

  onSelectWorker(worker: Worker) {
    this.selectedWorker.set(worker);
  }

  onSelectDate(date: Date) {
    if (this.isDateInPast(date)) return;
    this.selectedDate.set(date);
  }

  changeWeek(offset: number) {
    const newStartDate = new Date(this.calendarStartDate());
    newStartDate.setDate(newStartDate.getDate() + (offset * 7));
    
    if (offset < 0 && !this.canGoToPreviousWeek()) return;

    this.calendarStartDate.set(newStartDate);
    this.selectedDate.set(newStartDate); 
  }
  
  isDateSelected(date: Date): boolean {
    const selected = this.selectedDate();
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  }

  isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  }

  onSelectSlot(slot: AvailabilitySlot) {
    const currentService = this.selectedService();
    if (currentService) {
      this.bookingDetails.set({
        provider: this.provider(),
        service: currentService,
        worker: this.selectedWorker() ?? undefined,
        slot: slot,
      });
    }
  }

  onConfirmBooking() {
    const details = this.bookingDetails();
    const currentUser = this.userService.currentUser();
    if (!details || !currentUser) return;

    this.isBooking.set(true);
    
    setTimeout(() => {
      this.bookingRequest.emit({
        providerId: details.provider.id,
        serviceId: details.service.id,
        workerId: details.worker?.id,
        userId: currentUser.id,
        slot: details.slot
      });

      this.isBooking.set(false);
      this.showConfirmation.set(true);
      this.bookingDetails.set(null);
    }, 1500);
  }
  
  onCancelBooking() {
    this.bookingDetails.set(null);
  }

  onCloseConfirmation(openReview: boolean = false) {
    this.showConfirmation.set(false);
    this.selectedService.set(null);
    this.selectedWorker.set(null);
    if(openReview) {
      this.openReviewModal();
    }
  }
  
  onGoBack() {
    this.navigateBack.emit();
  }

  // --- Review Methods ---
  openReviewModal() {
    this.newReview.set({ rating: 5, comment: '', workerId: '' });
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal() {
    this.isReviewModalOpen.set(false);
  }

  setReviewRating(rating: number) {
    this.newReview.update(r => ({...r, rating: rating}));
  }

  onSubmitReview() {
    const user = this.currentUser();
    const provider = this.provider();
    const reviewData = this.newReview();
    if (!user || !provider || !reviewData.comment) return;

    const worker = provider.workers?.find(w => w.id === reviewData.workerId);

    this.reviewAdded.emit({
        userId: user.id,
        userName: user.name,
        providerId: provider.id,
        workerId: worker?.id,
        workerName: worker?.name,
        rating: reviewData.rating,
        comment: reviewData.comment
    });
    this.closeReviewModal();
  }
}