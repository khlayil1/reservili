import { Component, ChangeDetectionStrategy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { ProviderDetailComponent } from './components/provider-detail/provider-detail.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { ProviderDashboardComponent } from './components/provider-dashboard/provider-dashboard.component';
import { RegistrationComponent } from './components/registration/registration.component';

import { DataService } from './services/data.service';
import { UserService } from './services/user.service';
import { ServiceProvider, User, UserRole, Service, Worker, BlockedTime, RecurringAvailability, AvailabilitySlot, Booking, Review } from './models/reservili.model';
import { RegistrationDetails } from './components/registration/registration.component';

type View = 'login' | 'registration' | 'home' | 'searchResults' | 'providerDetail' | 'providerDashboard';

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
    RegistrationComponent
  ],
})
export class AppComponent {
  private dataService = inject(DataService);
  userService = inject(UserService);

  currentView = signal<View>('login');
  allProviders = signal<ServiceProvider[]>([]);
  filteredProviders = signal<ServiceProvider[]>([]);
  selectedProvider = signal<ServiceProvider | null>(null);
  
  currentUser = this.userService.currentUser;
  
  loggedInProvider = computed(() => {
    const user = this.currentUser();
    if (user?.role === UserRole.ServiceProvider) {
      return this.dataService.getProviderByOwnerId(user.id);
    }
    return null;
  });

  constructor() {
    this.allProviders.set(this.dataService.getServiceProviders());
    this.filteredProviders.set(this.allProviders());
    
    // Effect to handle view changes on authentication state change
    effect(() => {
        const user = this.currentUser();
        if (user) {
            if (this.currentView() === 'login' || this.currentView() === 'registration') {
                if (user.role === UserRole.ServiceProvider) {
                    this.currentView.set('providerDashboard');
                } else {
                    this.currentView.set('home');
                }
            }
        } else {
            if (this.currentView() !== 'registration') {
              this.currentView.set('login');
            }
        }
    });
  }

  onLogin(role: UserRole) {
    if (role === UserRole.Customer) {
      this.userService.loginAsCustomer();
    } else {
      this.userService.loginAsProvider();
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

  onRegistrationComplete(details: RegistrationDetails) {
    const newUser = this.userService.registerUser({
        name: details.name,
        email: details.email,
        role: details.role,
        password: details.password
    });

    if (newUser.role === UserRole.ServiceProvider && details.provider) {
        this.dataService.addServiceProvider(details.provider, newUser.id);
        this.allProviders.set(this.dataService.getServiceProviders());
    }
    // The effect will handle redirection upon login
  }

  onSearch(searchTerm: string) {
    const lowerCaseTerm = searchTerm.toLowerCase();
    if (!lowerCaseTerm) {
      this.filteredProviders.set(this.allProviders());
    } else {
      const results = this.allProviders().filter(p => 
        p.name.toLowerCase().includes(lowerCaseTerm) ||
        p.category.toLowerCase().includes(lowerCaseTerm) ||
        p.services.some(s => s.name.toLowerCase().includes(lowerCaseTerm))
      );
      this.filteredProviders.set(results);
    }
    this.currentView.set('searchResults');
  }

  onSelectCategory(category: string) {
    if (category === 'All') {
        this.filteredProviders.set(this.allProviders());
    } else {
        const results = this.allProviders().filter(p => p.category === category);
        this.filteredProviders.set(results);
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
    if(this.currentUser()?.role === UserRole.ServiceProvider) {
      this.currentView.set('providerDashboard');
    }
  }

  onNavigateBack() {
    const currentView = this.currentView();
    if (currentView === 'providerDetail') {
      this.currentView.set('searchResults');
    } else if (currentView === 'searchResults') {
        this.currentView.set('home');
    } else {
      this.currentView.set('home');
    }
  }

  onProviderUpdated(updatedProvider: ServiceProvider) {
    this.dataService.updateProvider(updatedProvider);
    this.allProviders.set(this.dataService.getServiceProviders());
    // Refresh lists and potentially the logged-in provider's view
    const currentProvider = this.loggedInProvider();
    if(currentProvider && currentProvider.id === updatedProvider.id) {
        this.dataService.getProviderByOwnerId(currentProvider.ownerId!); // This would refetch
    }
  }

  onServiceAdded({ providerId, service }: { providerId: string; service: Service }) {
    this.dataService.addServiceToProvider(providerId, service);
    this.allProviders.set(this.dataService.getServiceProviders());
  }

  onServiceUpdated({ providerId, service }: { providerId: string; service: Service }) {
    this.dataService.updateServiceForProvider(providerId, service);
    this.allProviders.set(this.dataService.getServiceProviders());
  }

  onServiceDeleted({ providerId, serviceId }: { providerId: string; serviceId: string }) {
    this.dataService.deleteServiceForProvider(providerId, serviceId);
    this.allProviders.set(this.dataService.getServiceProviders());
  }
  
  onWorkerAdded({ providerId, worker }: { providerId: string; worker: Omit<Worker, 'id'> }) {
    this.dataService.addWorkerToProvider(providerId, worker);
    this.allProviders.set(this.dataService.getServiceProviders());
  }
  
  onWorkerDeleted({ providerId, workerId }: { providerId: string; workerId: string }) {
    this.dataService.deleteWorkerForProvider(providerId, workerId);
    this.allProviders.set(this.dataService.getServiceProviders());
  }

  onBlockerAdded({ providerId, blocker }: { providerId: string; blocker: Omit<BlockedTime, 'id'> }) {
    this.dataService.addBlockedTimeToProvider(providerId, blocker);
    this.allProviders.set(this.dataService.getServiceProviders());
  }

  onBookingRequest(details: { providerId: string; serviceId: string; workerId?: string; userId: string; slot: AvailabilitySlot; }) {
    this.dataService.createBooking(details);
    // The data service is stateful, so the change will be reflected automatically
    // in the provider detail component when it recalculates available slots.
  }

  // FIX: The type of the `review` parameter was incorrect, missing the `userName` property. It has been corrected to `Omit<Review, 'id' | 'date'>`.
  onReviewAdded(review: Omit<Review, 'id' | 'date'>) {
    this.dataService.addReview(review);
    this.allProviders.set(this.dataService.getServiceProviders());
    const currentSelectedProvider = this.selectedProvider();
    if(currentSelectedProvider) {
        // This is a bit of a hack to refresh the selected provider signal with the new review data
        const refreshedProvider = this.allProviders().find(p => p.id === currentSelectedProvider.id);
        if(refreshedProvider) {
            this.selectedProvider.set(refreshedProvider);
        }
    }
  }
}