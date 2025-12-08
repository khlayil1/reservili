import { Component, ChangeDetectionStrategy, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ServiceCategory, ServiceProvider } from '../../models/reservili.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
})
export class HomeComponent implements OnInit {
  search = output<string>();
  categorySelected = output<string>();
  providerSelected = output<ServiceProvider>();
  
  private apiService = inject(ApiService);
  categories = signal<ServiceCategory[]>([]);
  featuredProviders = signal<ServiceProvider[]>([]);
  
  async ngOnInit() {
    try {
      const [categories, featuredProviders] = await Promise.all([
        firstValueFrom(this.apiService.getCategories()),
        firstValueFrom(this.apiService.getFeaturedProviders())
      ]);
      this.categories.set(categories);
      this.featuredProviders.set(featuredProviders);
    } catch (error) {
      console.error("Failed to load home page data", error);
    }
  }

  onSearch(searchInput: HTMLInputElement) {
    this.search.emit(searchInput.value);
  }
  
  onCategoryClick(categoryName: string) {
    this.categorySelected.emit(categoryName);
  }

  onSelectProvider(provider: ServiceProvider) {
    this.providerSelected.emit(provider);
  }
}