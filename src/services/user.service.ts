import { Injectable, signal, inject } from '@angular/core';
import { User, UserRole, ServiceProvider } from '../models/reservili.model';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

// In a real app, this would be part of the registration payload
export interface RegistrationPayload {
  name: string,
  email: string,
  role: UserRole,
  password?: string,
  provider?: Omit<ServiceProvider, 'id' | 'rating' | 'recurringAvailability' | 'services' | 'availability' | 'workers' | 'blockedTimes' | 'ownerId' | 'galleryImages'>;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);
  currentUser = signal<User | null>(null);

  async login(credentials: {email: string, password: string}) {
    const user = await firstValueFrom(this.apiService.login(credentials.email, credentials.password));
    this.currentUser.set(user);
  }

  async registerUser(details: RegistrationPayload): Promise<User> {
    const { user } = await firstValueFrom(this.apiService.register(details));
    this.currentUser.set(user); // Log in the new user immediately
    return user;
  }

  async updateUser(user: User) {
    const updatedUser = await firstValueFrom(this.apiService.updateUser(user));
    this.currentUser.set(updatedUser);
  }

  logout() {
    this.currentUser.set(null);
  }
}
