import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceProvider } from '../../models/reservili.model';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SearchResultsComponent {
  providers = input.required<ServiceProvider[]>();
  providerSelected = output<ServiceProvider>();
  navigateBack = output<void>();

  onSelectProvider(provider: ServiceProvider) {
    this.providerSelected.emit(provider);
  }

  onGoBack() {
    this.navigateBack.emit();
  }
}
