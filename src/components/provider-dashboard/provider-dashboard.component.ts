import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceProvider, Service, Worker, RecurringAvailability, BlockedTime, Review } from '../../models/reservili.model';
import { TeamScheduleComponent } from '../team-schedule/team-schedule.component';
import { DataService } from '../../services/data.service';

type DashboardTab = 'profile' | 'services' | 'workers' | 'availability' | 'reviews';

@Component({
  selector: 'app-provider-dashboard',
  templateUrl: './provider-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TeamScheduleComponent, DatePipe],
})
export class ProviderDashboardComponent {
  provider = input.required<ServiceProvider>();
  providerUpdated = output<ServiceProvider>();
  serviceAdded = output<{ providerId: string; service: Service }>();
  serviceUpdated = output<{ providerId: string; service: Service }>();
  serviceDeleted = output<{ providerId: string; serviceId: string }>();
  workerAdded = output<{ providerId: string; worker: Omit<Worker, 'id'> }>();
  workerDeleted = output<{ providerId: string; workerId: string }>();
  blockerAdded = output<{ providerId: string; blocker: Omit<BlockedTime, 'id'> }>();

  private dataService = inject(DataService);

  activeTab = signal<DashboardTab>('profile');
  
  editableProvider = signal<ServiceProvider | null>(null);
  newService = signal<Omit<Service, 'id'>>({ name: '', description: '', durationMinutes: 60, price: 0 });
  newWorker = signal<Omit<Worker, 'id'>>({ name: '', role: '' });
  newBlocker = signal({ startTime: '', endTime: '', reason: '' });
  
  editingWorkerServices = signal<Worker | null>(null);
  serviceAssignments = signal<{[serviceId: string]: boolean}>({});

  isEditingProfile = signal(false);
  isAddingService = signal(false);
  isAddingWorker = signal(false);
  isEditingAvailability = signal(false);
  isBlockingTime = signal(false);

  // Signals for inline service editing and deletion
  editingServiceId = signal<string | null>(null);
  editableService = signal<Service | null>(null);
  deletingService = signal<Service | null>(null);
  
  // Signals for worker editing and deletion
  editingWorker = signal<Worker | null>(null);
  deletingWorker = signal<Worker | null>(null);
  
  reviewsForProvider = computed(() => {
    return this.dataService.getReviewsForProvider(this.provider().id);
  });
  
  reviewsByWorker = computed(() => {
    const reviews = this.reviewsForProvider();
    const workers = this.provider().workers ?? [];
    const reviewMap: { [workerId: string]: { worker: Worker, reviews: Review[] } } = {};

    workers.forEach(worker => {
      reviewMap[worker.id] = { worker, reviews: [] };
    });

    reviews.forEach(review => {
      if (review.workerId && reviewMap[review.workerId]) {
        reviewMap[review.workerId].reviews.push(review);
      }
    });

    return Object.values(reviewMap);
  });


  constructor() {
    effect(() => {
      this.editableProvider.set(JSON.parse(JSON.stringify(this.provider())));
    }, { allowSignalWrites: true });
  }

  // --- Tab Management ---
  selectTab(tab: DashboardTab) {
    this.activeTab.set(tab);
  }

  // --- Profile Management ---
  onSaveProfile() {
    if (this.editableProvider()) {
      this.providerUpdated.emit(this.editableProvider()!);
      this.isEditingProfile.set(false);
    }
  }

  onCancelEditProfile() {
    this.editableProvider.set(JSON.parse(JSON.stringify(this.provider())));
    this.isEditingProfile.set(false);
  }

  onAddGalleryImage() {
    this.editableProvider.update(provider => {
      if (!provider) return null;
      if (!provider.galleryImages) {
        provider.galleryImages = [];
      }
      const seed = Math.random().toString(36).substring(7);
      provider.galleryImages.push(`https://picsum.photos/seed/${seed}/600/400`);
      return provider;
    });
  }

  onDeleteGalleryImage(index: number) {
    this.editableProvider.update(provider => {
      if (!provider || !provider.galleryImages) return null;
      provider.galleryImages.splice(index, 1);
      return provider;
    });
  }

  // --- Service Management ---
  openAddServiceModal() {
    this.newService.set({ name: '', description: '', durationMinutes: 60, price: 0 });
    this.isAddingService.set(true);
  }
  
  onSaveNewService() {
    if (this.newService().name && this.newService().durationMinutes > 0) {
      this.serviceAdded.emit({
        providerId: this.provider().id,
        service: this.newService() as Service,
      });
      this.isAddingService.set(false);
    }
  }

  openEditServiceModal(service: Service) {
    this.editableService.set({ ...service });
  }

  onSaveServiceUpdate() {
    if (this.editableService()) {
      this.serviceUpdated.emit({
        providerId: this.provider().id,
        service: this.editableService()!,
      });
      this.editableService.set(null);
    }
  }

  openDeleteServiceModal(service: Service) {
    this.deletingService.set(service);
  }

  onConfirmDeleteService() {
    const serviceToDelete = this.deletingService();
    if (serviceToDelete) {
      this.serviceDeleted.emit({
        providerId: this.provider().id,
        serviceId: serviceToDelete.id
      });
      this.deletingService.set(null);
    }
  }

  // --- Worker Management ---
  openAddWorkerModal() {
    this.newWorker.set({ name: '', role: '' });
    this.isAddingWorker.set(true);
  }

  onSaveNewWorker() {
    if (this.newWorker().name && this.newWorker().role) {
      this.workerAdded.emit({
        providerId: this.provider().id,
        worker: this.newWorker(),
      });
      this.isAddingWorker.set(false);
    }
  }

  openEditWorkerModal(worker: Worker) {
    this.editingWorker.set(JSON.parse(JSON.stringify(worker)));
  }
  
  onGenerateWorkerImage() {
    this.editingWorker.update(worker => {
      if (!worker) return null;
      const seed = Math.random().toString(36).substring(7);
      worker.imageUrl = `https://picsum.photos/seed/${seed}/100/100`;
      return worker;
    })
  }

  onSaveWorkerUpdate() {
    const workerToUpdate = this.editingWorker();
    if (!workerToUpdate) return;
    this.editableProvider.update(provider => {
      if (!provider || !provider.workers) return provider;
      const index = provider.workers.findIndex(w => w.id === workerToUpdate.id);
      if (index !== -1) {
        provider.workers[index] = workerToUpdate;
      }
      return provider;
    });
    this.providerUpdated.emit(this.editableProvider()!);
    this.editingWorker.set(null);
  }

  openDeleteWorkerModal(worker: Worker) {
    this.deletingWorker.set(worker);
  }

  onConfirmDeleteWorker() {
    const workerToDelete = this.deletingWorker();
    if(workerToDelete) {
      this.workerDeleted.emit({
        providerId: this.provider().id,
        workerId: workerToDelete.id
      });
      this.deletingWorker.set(null);
    }
  }

  openEditWorkerServicesModal(worker: Worker) {
    const assignments: {[serviceId: string]: boolean} = {};
    this.provider().services.forEach(s => {
      assignments[s.id] = worker.serviceIds?.includes(s.id) ?? false;
    });
    this.serviceAssignments.set(assignments);
    this.editingWorkerServices.set(worker);
  }

  toggleServiceAssignment(serviceId: string) {
    this.serviceAssignments.update(currentAssignments => ({
      ...currentAssignments, [serviceId]: !currentAssignments[serviceId]
    }));
  }

  onSaveWorkerServices() {
    const workerToUpdate = this.editingWorkerServices();
    const provider = this.editableProvider();
    if (!workerToUpdate || !provider || !provider.workers) return;

    const updatedServiceIds = Object.keys(this.serviceAssignments()).filter(
      serviceId => this.serviceAssignments()[serviceId]
    );
    const workerIndex = provider.workers.findIndex(w => w.id === workerToUpdate.id);
    if (workerIndex !== -1) {
      provider.workers[workerIndex].serviceIds = updatedServiceIds;
      this.providerUpdated.emit(provider);
    }
    this.editingWorkerServices.set(null);
  }

  // --- Availability Management ---
  onSaveAvailability() {
    if (this.editableProvider()) {
      this.providerUpdated.emit(this.editableProvider()!);
      this.isEditingAvailability.set(false);
    }
  }

  onCancelEditAvailability() {
     this.editableProvider.set(JSON.parse(JSON.stringify(this.provider())));
     this.isEditingAvailability.set(false);
  }

  openBlockTimeModal() {
    this.newBlocker.set({ startTime: '', endTime: '', reason: '' });
    this.isBlockingTime.set(true);
  }

  onSaveBlocker() {
    const blocker = this.newBlocker();
    if (blocker.startTime && blocker.endTime) {
        this.blockerAdded.emit({
            providerId: this.provider().id,
            blocker: {
                startTime: new Date(blocker.startTime).toISOString(),
                endTime: new Date(blocker.endTime).toISOString(),
                reason: blocker.reason
            }
        });
        this.isBlockingTime.set(false);
    }
  }

  getTodayISO(): string {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 16);
  }
}