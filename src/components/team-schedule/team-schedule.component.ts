import { Component, ChangeDetectionStrategy, input, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ServiceProvider, Worker, AvailabilitySlot, RecurringAvailability } from '../../models/reservili.model';
import { DataService } from '../../services/data.service';

interface EnrichedSlotInfo extends AvailabilitySlot {
  customerName?: string;
  serviceName?: string;
}

interface TimeBlock {
  time: string;
  blockDate: Date;
  isUpcoming: boolean;
  slots: { [workerId: string]: EnrichedSlotInfo | null };
}

@Component({
  selector: 'app-team-schedule',
  templateUrl: './team-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  styles: [`
    .schedule-grid {
      grid-template-columns: 6rem repeat(var(--worker-count), minmax(0, 1fr));
    }
  `]
})
export class TeamScheduleComponent {
  provider = input.required<ServiceProvider>();
  private dataService = inject(DataService);
  private dayNames: RecurringAvailability['dayOfWeek'][];

  selectedDate = signal(new Date());
  selectedWorkerId = signal<string>('all');

  constructor() {
    this.dayNames = this.dataService.getDayNames();
  }

  scheduleData = computed(() => {
    const provider = this.provider();
    const selectedDate = this.selectedDate();
    const workerId = this.selectedWorkerId();

    if (!provider || !provider.workers || provider.workers.length === 0) {
      return { workers: provider.workers ?? [], timeBlocks: [], workerCount: provider.workers?.length ?? 0 };
    }
    
    const filteredWorkers = workerId === 'all'
        ? provider.workers
        : provider.workers.filter(w => w.id === workerId);

    const availabilityForDay = this.dataService.generateSlotsForProviderForDay(provider, selectedDate);

    const dayName = this.dayNames[selectedDate.getDay()];
    const schedule = provider.recurringAvailability.find(r => r.dayOfWeek === dayName);

    if (!schedule || !schedule.isEnabled) {
        return { workers: filteredWorkers, timeBlocks: [], workerCount: filteredWorkers.length };
    }

    const allWorkers = provider.workers;
    const { startTime, endTime } = schedule;
    const timeBlocks: TimeBlock[] = [];

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    const now = new Date();
    const upcomingThreshold = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    // Create time blocks every 30 minutes
    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 30) {
            const blockDate = new Date(selectedDate);
            blockDate.setHours(h, m, 0, 0);
            const time = blockDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const isUpcoming = blockDate > now && blockDate <= upcomingThreshold;
            
            const block: TimeBlock = { time, blockDate, isUpcoming, slots: {} };
            allWorkers.forEach(w => block.slots[w.id] = null); // Initialize for all workers
            timeBlocks.push(block);
        }
    }
    
    // Fill in the slots from provider availability
    availabilityForDay.forEach(slot => {
        const slotStart = new Date(slot.startTime);
        
        const blockIndex = timeBlocks.findIndex(block => block.blockDate.getTime() === slotStart.getTime());

        if (blockIndex !== -1 && slot.workerId) {
            let enrichedSlot: EnrichedSlotInfo = { ...slot };
            if(slot.bookingId) {
                const details = this.dataService.getBookingDetails(slot.bookingId);
                if (details) {
                    enrichedSlot.customerName = details.user.name.split(' ')[0]; // First name
                    enrichedSlot.serviceName = details.service.name;
                }
            }
            timeBlocks[blockIndex].slots[slot.workerId] = enrichedSlot;
        }
    });

    return { workers: filteredWorkers, timeBlocks, workerCount: filteredWorkers.length };
  });

  changeDate(days: number): void {
    const newDate = new Date(this.selectedDate());
    newDate.setDate(newDate.getDate() + days);
    this.selectedDate.set(newDate);
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
  }

  isToday(): boolean {
    const today = new Date();
    const selected = this.selectedDate();
    return today.getDate() === selected.getDate() &&
           today.getMonth() === selected.getMonth() &&
           today.getFullYear() === selected.getFullYear();
  }

  onFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedWorkerId.set(selectElement.value);
  }
}