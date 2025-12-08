import { Component, ChangeDetectionStrategy, input, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ServiceProvider, Worker, AvailabilitySlot, RecurringAvailability, Booking, User, Service } from '../../models/reservili.model';
import { ApiService } from '../../services/api.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
  imports: [CommonModule, DatePipe, TranslatePipe],
  styles: [`
    .schedule-grid {
      grid-template-columns: 6rem repeat(var(--worker-count), minmax(0, 1fr));
    }
  `]
})
export class TeamScheduleComponent {
  provider = input.required<ServiceProvider>();
  private apiService = inject(ApiService);

  selectedDate = signal(new Date());
  selectedWorkerId = signal<string>('all');
  
  // This signal will hold all schedule data for the selected day
  scheduleData = signal<{ workers: Worker[], timeBlocks: TimeBlock[], workerCount: number }>({ workers: [], timeBlocks: [], workerCount: 0});
  isLoading = signal(false);

  constructor() {
    effect(() => {
        const provider = this.provider();
        const date = this.selectedDate();
        this.loadScheduleForDay(provider, date);
    });
  }

  async loadScheduleForDay(provider: ServiceProvider, date: Date) {
    if (!provider || !provider.workers || provider.workers.length === 0) {
      this.scheduleData.set({ workers: [], timeBlocks: [], workerCount: 0 });
      return;
    }
    
    this.isLoading.set(true);

    try {
        const dateString = date.toISOString().split('T')[0];
        const availabilityForDay = await firstValueFrom(this.apiService.getAvailability(provider.id, dateString, true));

        const dayNames: RecurringAvailability['dayOfWeek'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        const schedule = provider.recurringAvailability.find(r => r.dayOfWeek === dayName);

        if (!schedule || !schedule.isEnabled) {
            this.scheduleData.set({ workers: provider.workers, timeBlocks: [], workerCount: provider.workers.length });
            return;
        }

        const { startTime, endTime } = schedule;
        const timeBlocks: TimeBlock[] = [];
        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);
        const now = new Date();
        const upcomingThreshold = new Date(now.getTime() + 60 * 60 * 1000);

        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                const blockDate = new Date(date);
                blockDate.setHours(h, m, 0, 0);
                const time = blockDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                const isUpcoming = blockDate > now && blockDate <= upcomingThreshold;
                const block: TimeBlock = { time, blockDate, isUpcoming, slots: {} };
                provider.workers.forEach(w => block.slots[w.id] = null);
                timeBlocks.push(block);
            }
        }

        availabilityForDay.forEach(slot => {
            const slotStart = new Date(slot.startTime);
            const blockIndex = timeBlocks.findIndex(block => block.blockDate.getTime() === slotStart.getTime());
            if (blockIndex !== -1 && slot.workerId) {
                timeBlocks[blockIndex].slots[slot.workerId] = slot as EnrichedSlotInfo;
            }
        });

        const filteredWorkers = this.selectedWorkerId() === 'all'
            ? provider.workers
            : provider.workers.filter(w => w.id === this.selectedWorkerId());

        this.scheduleData.set({
            workers: filteredWorkers,
            timeBlocks,
            workerCount: filteredWorkers.length
        });

    } catch (error) {
        console.error("Failed to load schedule data", error);
        this.scheduleData.set({ workers: provider.workers, timeBlocks: [], workerCount: provider.workers.length });
    } finally {
        this.isLoading.set(false);
    }
  }


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
    // The effect will re-trigger the schedule generation
    this.loadScheduleForDay(this.provider(), this.selectedDate());
  }
}