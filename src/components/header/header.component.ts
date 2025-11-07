import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../models/reservili.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HeaderComponent {
  user = input<User | null>(null);
  navigateHome = output<void>();
  navigateDashboard = output<void>();
  logout = output<void>();

  userRole = UserRole;

  onHomeClick() {
    this.navigateHome.emit();
  }

  onDashboardClick() {
    this.navigateDashboard.emit();
  }

  onLogoutClick() {
    this.logout.emit();
  }
}