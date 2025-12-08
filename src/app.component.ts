import { Component, ChangeDetectionStrategy, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { ProviderDetailComponent } from './components/provider-detail/provider-detail.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { ProviderDashboardComponent } from './components/provider-dashboard/provider-dashboard.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

import { ApiService } from './services/api.service';
import { UserService } from './services/user.service';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';
import { ServiceProvider, User, UserRole, Service, Worker, BlockedTime, Review, AvailabilitySlot } from './models/reservili.model';
import { RegistrationDetails } from './components/registration/registration.component';
import { TranslatePipe } from './pipes/translate.pipe';

type View = 'login' | 'registration' | 'home' | 'searchResults' | 'providerDetail' | 'providerDashboard' | 'userProfile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HeaderComponent,
    HomeComponent,
    SearchResultsComponent,
    ProviderDetailComponent,
    FooterComponent,
    LoginComponent,
    ProviderDashboardComponent,
    RegistrationComponent,
    UserProfileComponent,
    TranslatePipe
  ],
})
export class AppComponent implements OnInit {
  private apiService = inject(ApiService);
  userService = inject(UserService);
  translationService = inject(TranslationService);
  themeService = inject(ThemeService); // Initialize theme service

  currentView = signal<View>('login');
  allProviders = signal<ServiceProvider[]>([]);
  filteredProviders = signal<ServiceProvider[]>([]);
  selectedProvider = signal<ServiceProvider | null>(null);
  
  loggedInProvider = signal<ServiceProvider | null>(null);

  constructor() {
    // Effect to handle view changes on authentication state change
    effect(async () => {
        const user = this.userService.currentUser();
        if (user) {
            if (user.role === UserRole.ServiceProvider) {
              const provider = await firstValueFrom(this.apiService.getProviderByOwnerId(user.id));
              this.loggedInProvider.set(provider);
            } else {
              this.loggedInProvider.set(null);
            }

            if (this.currentView() === 'login' || this.currentView() === 'registration') {
                if (user.role === UserRole.ServiceProvider) {
                    this.currentView.set('providerDashboard');
                } else {
                    this.currentView.set('home');
                }
            }
        } else {
            this.loggedInProvider.set(null);
            if (this.currentView() !== 'registration') {
              this.currentView.set('login');
            }
        }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    try {
      const providers = await firstValueFrom(this.apiService.getServiceProviders());
      this.allProviders.set(providers);
      this.filteredProviders.set(providers);
    } catch (error) {
      console.error("Failed to load providers", error);
      // Optionally set an error state to show in the UI
    }
  }

  async onLogin(credentials: { email: string, password: string }) {
    try {
      await this.userService.login(credentials);
    } catch (error) {
      console.error("Login failed", error);
      // Here you would typically set an error signal to show a message in the UI.
    }
  }

  onLogout() {
    this.userService.logout();
    this.currentView.set('login');
  }

  onNavigateToRegister() {
    this.currentView.set('registration');
  }
  
  onNavigateToLogin() {
      this.currentView.set('login');
  }

  async onRegistrationComplete(details: RegistrationDetails) {
    try {
      await this.userService.registerUser({
          name: details.name,
          email: details.email,
          role: details.role,
          password: details.password,
          provider: details.provider,
      });
      // The effect will handle redirection upon login
    } catch (error) {
      console.error("Registration failed", error);
    }
  }

  async onSearch(searchTerm: string) {
    try {
      const results = await firstValueFrom(this.apiService.getServiceProviders(searchTerm));
      this.filteredProviders.set(results);
    } catch (error) {
      console.error("Search failed", error);
    }
    this.currentView.set('searchResults');
  }

  async onSelectCategory(category: string) {
    try {
        const results = await firstValueFrom(this.apiService.getServiceProviders(undefined, category === 'All' ? undefined : category));
        this.filteredProviders.set(results);
    } catch (error) {
        console.error("Category filter failed", error);
    }
    this.currentView.set('searchResults');
  }

  onSelectProvider(provider: ServiceProvider) {
    this.selectedProvider.set(provider);
    this.currentView.set('providerDetail');
  }

  onNavigateHome() {
    this.currentView.set('home');
    this.selectedProvider.set(null);
  }

  onNavigateToDashboard() {
    if(this.userService.currentUser()?.role === UserRole.ServiceProvider) {
      this.currentView.set('providerDashboard');
    }
  }

  onNavigateToProfile() {
    this.currentView.set('userProfile');
  }

  async onUserUpdated(user: User) {
    try {
        await this.userService.updateUser(user);
        // After update, navigate back to a sensible page
        if (user.role === UserRole.ServiceProvider) {
            this.currentView.set('providerDashboard');
        } else {
            this.currentView.set('home');
        }
    } catch (error) {
        console.error("Failed to update user profile", error);
        // Optionally show an error message to the user
    }
  }

  onNavigateBack() {
    const currentView = this.currentView();
    if (currentView === 'userProfile') {
      const user = this.userService.currentUser();
      if (user?.role === UserRole.ServiceProvider) {
        this.currentView.set('providerDashboard');
      } else {
        this.currentView.set('home');
      }
    } else if (currentView === 'providerDetail') {
      this.currentView.set('searchResults');
    } else if (currentView === 'searchResults') {
        this.currentView.set('home');
    } else {
      this.currentView.set('home');
    }
  }

  async refreshProviderData(providerId: string) {
    try {
        const updatedProvider = await firstValueFrom(this.apiService.getProviderById(providerId));
        // Update the main list
        this.allProviders.update(providers => {
            const index = providers.findIndex(p => p.id === providerId);
            if (index > -1) {
                providers[index] = updatedProvider;
                return [...providers];
            }
            return providers;
        });
        
        // Update logged in provider view if it's them
        if (this.loggedInProvider()?.id === providerId) {
            this.loggedInProvider.set(updatedProvider);
        }
        
        // Update selected provider view if it's them
        if (this.selectedProvider()?.id === providerId) {
            this.selectedProvider.set(updatedProvider);
        }

    } catch (error) {
        console.error(`Failed to refresh provider ${providerId}`, error);
    }
  }

  async onProviderUpdated(updatedProvider: ServiceProvider) {
    await firstValueFrom(this.apiService.updateProvider(updatedProvider));
    await this.refreshProviderData(updatedProvider.id);
  }

  async onServiceAdded({ providerId, service }: { providerId: string; service: Service }) {
    await firstValueFrom(this.apiService.addServiceToProvider(providerId, service));
    await this.refreshProviderData(providerId);
  }

  async onServiceUpdated({ providerId, service }: { providerId: string; service: Service }) {
    await firstValueFrom(this.apiService.updateServiceForProvider(providerId, service));
    await this.refreshProviderData(providerId);
  }

  async onServiceDeleted({ providerId, serviceId }: { providerId: string; serviceId: string }) {
    await firstValueFrom(this.apiService.deleteServiceForProvider(providerId, serviceId));
    await this.refreshProviderData(providerId);
  }
  
  async onWorkerAdded({ providerId, worker }: { providerId: string; worker: Omit<Worker, 'id'> }) {
    await firstValueFrom(this.apiService.addWorkerToProvider(providerId, worker));
    await this.refreshProviderData(providerId);
  }
  
  async onWorkerDeleted({ providerId, workerId }: { providerId: string; workerId: string }) {
    await firstValueFrom(this.apiService.deleteWorkerForProvider(providerId, workerId));
    await this.refreshProviderData(providerId);
  }

  async onBlockerAdded({ providerId, blocker }: { providerId: string; blocker: Omit<BlockedTime, 'id'> }) {
    await firstValueFrom(this.apiService.addBlockedTimeToProvider(providerId, blocker));
    await this.refreshProviderData(providerId);
  }

  async onBookingRequest(details: { providerId: string; serviceId: string; workerId?: string; userId: string; slot: AvailabilitySlot; }) {
    await firstValueFrom(this.apiService.createBooking(details));
    await this.refreshProviderData(details.providerId);
  }

  async onReviewAdded(review: Omit<Review, 'id' | 'date'>) {
    await firstValueFrom(this.apiService.addReview(review));
    await this.refreshProviderData(review.providerId);
  }
}