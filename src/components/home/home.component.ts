import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ServiceCategory, ServiceProvider } from '../../models/reservili.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HomeComponent {
  search = output<string>();
  categorySelected = output<string>();
  providerSelected = output<ServiceProvider>();
  
  private dataService = inject(DataService);
  categories: ServiceCategory[] = this.dataService.getCategories();
  featuredProviders: ServiceProvider[] = this.dataService.getFeaturedProviders();
  
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