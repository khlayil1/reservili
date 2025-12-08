import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../models/reservili.model';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
})
export class HeaderComponent {
  user = input<User | null>(null);
  navigateHome = output<void>();
  navigateDashboard = output<void>();
  navigateProfile = output<void>();
  logout = output<void>();

  translationService = inject(TranslationService);
  themeService = inject(ThemeService);
  isLangMenuOpen = signal(false);
  isUserMenuOpen = signal(false);

  userRole = UserRole;
  
  get currentTheme() {
    return this.themeService.theme();
  }

  onHomeClick() {
    this.navigateHome.emit();
  }

  onDashboardClick() {
    this.navigateDashboard.emit();
    this.isUserMenuOpen.set(false);
  }
  
  onProfileClick() {
    this.navigateProfile.emit();
    this.isUserMenuOpen.set(false);
  }

  onLogoutClick() {
    this.logout.emit();
    this.isUserMenuOpen.set(false);
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  changeLanguage(lang: 'en' | 'fr' | 'ar') {
    this.translationService.setLanguage(lang);
    this.isLangMenuOpen.set(false);
  }
}
