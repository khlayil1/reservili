import { Injectable, signal, inject, effect } from '@angular/core';
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
  private readonly TOKEN_KEY = 'booky_auth_token';

  currentUser = signal<User | null>(null);
  private authToken = signal<string | null>(null);

  constructor() {
    // On service initialization, try to load token from storage
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    if (storedToken) {
      this.authToken.set(storedToken);
      // If we have a token, we should verify it by fetching the user account.
      // The interceptor will use the token we just set.
      this.apiService.getAccount().subscribe({
          next: user => this.currentUser.set(user),
          error: () => this.logout() // If token is invalid/expired, log out
      });
    }

    // Effect to clear token from storage when user logs out
    effect(() => {
        if (this.currentUser() === null) {
            this.authToken.set(null);
            localStorage.removeItem(this.TOKEN_KEY);
        }
    });
  }

  async login(credentials: {email: string, password: string}) {
    const { user, token } = await firstValueFrom(this.apiService.login(credentials.email, credentials.password));
    this.authToken.set(token);
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUser.set(user);
  }

  async registerUser(details: RegistrationPayload): Promise<User> {
    const { user, token } = await firstValueFrom(this.apiService.register(details));
    this.authToken.set(token);
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUser.set(user);
    return user;
  }

  async updateUser(user: User) {
    const updatedUser = await firstValueFrom(this.apiService.updateUser(user));
    this.currentUser.set(updatedUser);
  }

  logout() {
    this.currentUser.set(null);
    // The effect will handle clearing the token and storage
  }

  getToken(): string | null {
    return this.authToken();
  }
}