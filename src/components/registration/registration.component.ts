import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole, ServiceProvider } from '../../models/reservili.model';

export interface RegistrationDetails {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  provider?: Omit<ServiceProvider, 'id' | 'rating' | 'recurringAvailability' | 'services' | 'availability' | 'workers' | 'blockedTimes' | 'ownerId' | 'galleryImages'>;
}

type Step = 'roleSelection' | 'form' | 'businessProfile';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class RegistrationComponent {
  registrationComplete = output<RegistrationDetails>();
  navigateToLogin = output<void>();

  step = signal<Step>('roleSelection');
  selectedRole = signal<UserRole | null>(null);

  formData = signal({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    provider: {
      name: '',
      category: '',
      location: '',
      description: '',
      imageUrl: '',
    }
  });

  get userRole() { return UserRole; }

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
    this.step.set('form');
  }

  goToPreviousStep() {
    if (this.step() === 'form') {
      this.step.set('roleSelection');
    } else if (this.step() === 'businessProfile') {
      this.step.set('form');
    }
  }

  handleAccountSubmit() {
    if (this.selectedRole() === UserRole.Customer) {
      this.completeRegistration();
    } else {
      this.step.set('businessProfile');
    }
  }

  generateRandomImage() {
    const seed = Math.random().toString(36).substring(7);
    this.formData.update(data => ({
      ...data,
      provider: {
        ...data.provider,
        imageUrl: `https://picsum.photos/seed/${seed}/800/600`
      }
    }));
  }

  completeRegistration() {
    const form = this.formData();
    const role = this.selectedRole();
    if (!role) return;

    const details: RegistrationDetails = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: role,
    };
    
    if (role === UserRole.ServiceProvider) {
      details.provider = form.provider;
    }

    this.registrationComplete.emit(details);
  }

  onNavigateToLogin() {
    this.navigateToLogin.emit();
  }
}