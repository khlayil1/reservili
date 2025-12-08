import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, switchMap, forkJoin } from 'rxjs';
import { ServiceProvider, ServiceCategory, Service, Worker, AvailabilitySlot, User, Booking, BlockedTime, Review, UserRole } from '../models/reservili.model';
import { RegistrationPayload } from './user.service';

// --- Interfaces for Backend DTOs ---
// These interfaces represent the data structures from the JHipster-style backend.

interface AdminUserDTO {
  id: string;
  login: string; // Used as email
  firstName: string;
  lastName: string;
  imageUrl?: string;
  authorities: string[];
}

interface JWTToken {
  id_token: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  // Base URL is proxied via proxy.conf.json
  private apiUrl = '/api'; 

  // --- Mappers ---
  // Maps backend DTOs to frontend models to avoid changing components.
  private mapAdminUserDtoToUser(dto: AdminUserDTO): User {
    // Determine role based on authorities array
    let role = UserRole.Customer;
    if (dto.authorities?.includes('ROLE_ADMIN')) {
      role = UserRole.Admin;
    } else if (dto.authorities?.includes('ROLE_PROVIDER')) {
      role = UserRole.ServiceProvider;
    }

    return {
      id: dto.id,
      name: `${dto.firstName || ''} ${dto.lastName || ''}`.trim(),
      email: dto.login,
      role: role,
      imageUrl: dto.imageUrl,
    };
  }

  // --- Auth ---
  login(email: string, password: string): Observable<User> {
    // JHipster uses /api/authenticate and expects 'username'
    // It only returns a token, so we must make a second call to /api/account
    return this.http.post<JWTToken>(`${this.apiUrl}/authenticate`, { username: email, password, rememberMe: false }).pipe(
      // Assuming token is handled by an interceptor/cookie, now fetch account details
      switchMap(() => this.http.get<AdminUserDTO>(`${this.apiUrl}/account`)),
      map(this.mapAdminUserDtoToUser)
    );
  }

  register(payload: RegistrationPayload): Observable<{ user: User; token: string }> {
    // This now becomes a multi-step process for providers
    const userPayload = {
      login: payload.email,
      email: payload.email,
      password: payload.password,
      firstName: payload.name.split(' ')[0] || '',
      lastName: payload.name.split(' ').slice(1).join(' ') || '',
      langKey: 'en',
      authorities: [payload.role === UserRole.ServiceProvider ? 'ROLE_PROVIDER' : 'ROLE_USER']
    };

    // Step 1: Register the user
    const registerUser$ = this.http.post<any>(`${this.apiUrl}/register`, userPayload);

    return registerUser$.pipe(
      switchMap((registeredUser) => {
        // Step 2: Log in to get a token for the next step
        return this.http.post<JWTToken>(`${this.apiUrl}/authenticate`, { username: payload.email, password: payload.password }).pipe(
          switchMap(token => {
            if (payload.role === UserRole.ServiceProvider && payload.provider) {
              // Step 3: Create the service provider profile
              const providerPayload = {
                ...payload.provider,
                owner: { id: registeredUser.id, login: registeredUser.login }
              };
              return this.http.post<ServiceProvider>(`${this.apiUrl}/service-providers`, providerPayload).pipe(
                map(() => ({
                  user: this.mapAdminUserDtoToUser({ ...registeredUser, firstName: userPayload.firstName, lastName: userPayload.lastName }),
                  token: token.id_token
                }))
              );
            }
            // For customers, we are done after login
            return of({
              user: this.mapAdminUserDtoToUser({ ...registeredUser, firstName: userPayload.firstName, lastName: userPayload.lastName }),
              token: token.id_token
            });
          })
        );
      })
    );
  }

  updateUser(user: User): Observable<User> {
    const [firstName, ...lastNameParts] = user.name.split(' ');
    const payload: Partial<AdminUserDTO> = {
      id: user.id,
      login: user.email,
      firstName: firstName,
      lastName: lastNameParts.join(' '),
      imageUrl: user.imageUrl,
    };
    // The spec uses POST to /api/account for updates
    return this.http.post<AdminUserDTO>(`${this.apiUrl}/account`, payload).pipe(
      map(this.mapAdminUserDtoToUser)
    );
  }

  // --- Providers ---
  getServiceProviders(searchTerm?: string, category?: string): Observable<ServiceProvider[]> {
    let params = new HttpParams();
    if (searchTerm) {
      // The new spec uses 'location' for search, we'll adapt by using it as a general search term
      params = params.set('location', searchTerm); 
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<ServiceProvider[]>(`${this.apiUrl}/service-providers`, { params });
  }

  getProviderById(id: string): Observable<ServiceProvider> {
    return this.http.get<ServiceProvider>(`${this.apiUrl}/service-providers/${id}`);
  }

  getProviderByOwnerId(ownerId: string): Observable<ServiceProvider | null> {
    // This endpoint doesn't exist in the new spec. We fetch all and filter client-side.
    // In a real app, the backend should provide a `GET /api/service-providers?ownerId=...`
    return this.http.get<ServiceProvider[]>(`${this.apiUrl}/service-providers`).pipe(
      map(providers => providers.find(p => p.ownerId === ownerId) || null)
    );
  }

  getFeaturedProviders(): Observable<ServiceProvider[]> {
    // This endpoint is missing in the new spec. We simulate it by getting all,
    // sorting by rating, and taking the top 3.
    return this.getServiceProviders().pipe(
      map(providers => providers
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
      )
    );
  }

  updateProvider(provider: ServiceProvider): Observable<ServiceProvider> {
    return this.http.patch<ServiceProvider>(`${this.apiUrl}/service-providers/${provider.id}`, provider);
  }

  // --- Services ---
  addServiceToProvider(providerId: string, service: Omit<Service, 'id'>): Observable<Service> {
    const payload = {
      ...service,
      serviceProvider: { id: providerId } // Add provider ID to body for flat endpoint
    };
    return this.http.post<Service>(`${this.apiUrl}/offered-services`, payload);
  }

  updateServiceForProvider(providerId: string, service: Service): Observable<Service> {
    // providerId is ignored as the new endpoint is flat
    return this.http.patch<Service>(`${this.apiUrl}/offered-services/${service.id}`, service);
  }

  deleteServiceForProvider(providerId: string, serviceId: string): Observable<void> {
    // providerId is ignored
    return this.http.delete<void>(`${this.apiUrl}/offered-services/${serviceId}`);
  }

  // --- Workers ---
  addWorkerToProvider(providerId: string, worker: Omit<Worker, 'id'>): Observable<Worker> {
    const payload = {
      ...worker,
      provider: { id: providerId }
    };
    return this.http.post<Worker>(`${this.apiUrl}/workers`, payload);
  }

  deleteWorkerForProvider(providerId: string, workerId: string): Observable<void> {
    // providerId is ignored
    return this.http.delete<void>(`${this.apiUrl}/workers/${workerId}`);
  }

  // --- Availability & Bookings ---
  getAvailability(providerId: string, dateStr: string, withDetails: boolean = false): Observable<AvailabilitySlot[]> {
    // This endpoint remains nested in the user's spec
    let params = new HttpParams().set('date', dateStr);
    if (withDetails) {
        params = params.set('withDetails', 'true');
    }

    return this.http.get<any[]>(`${this.apiUrl}/providers/${providerId}/availability`, { params }).pipe(
        map(slots => slots.map(slot => ({
            ...slot,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime)
        })))
    );
  }

  addBlockedTimeToProvider(providerId: string, blocker: Omit<BlockedTime, 'id'>): Observable<BlockedTime> {
    const payload = {
      ...blocker,
      provider: { id: providerId }
    };
    return this.http.post<BlockedTime>(`${this.apiUrl}/blocked-times`, payload);
  }

  createBooking(details: { providerId: string; serviceId: string; workerId?: string; userId: string; slot: AvailabilitySlot; }): Observable<Booking> {
    const payload = {
      providerId: details.providerId,
      serviceId: details.serviceId,
      workerId: details.workerId,
      userId: details.userId,
      startTime: details.slot.startTime.toISOString()
    };
    return this.http.post<any>(`${this.apiUrl}/bookings`, payload).pipe(
      map(booking => ({
        ...booking,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime)
      }))
    );
  }

  // --- Other Data ---
  getCategories(): Observable<ServiceCategory[]> {
    // This endpoint is missing. We return a hardcoded list as an observable to
    // mimic an API call without changing components that use it.
    const categories: ServiceCategory[] = [
      { name: 'Barbershop', icon: 'scissors' },
      { name: 'Sports', icon: 'trophy' },
      { name: 'Medical', icon: 'beaker' },
      { name: 'Restaurant', icon: 'building-storefront' },
      { name: 'Wellness', icon: 'sparkles' },
      { name: 'Specialty', icon: 'paint-brush' },
      { name: 'Other', icon: 'squares-2x2' }
    ];
    return of(categories);
  }

  addReview(reviewDetails: Omit<Review, 'id' | 'date'>): Observable<Review> {
     return this.http.post<Review>(`${this.apiUrl}/reviews`, reviewDetails);
  }
}
