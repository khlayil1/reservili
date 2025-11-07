import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../models/reservili.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class LoginComponent {
  loginRequest = output<UserRole>();
  navigateRegister = output<void>();

  onLogin(role: UserRole) {
    this.loginRequest.emit(role);
  }
  
  onNavigateToRegister() {
      this.navigateRegister.emit();
  }

  get customerRole() {
    return UserRole.Customer;
  }

  get providerRole() {
    return UserRole.ServiceProvider;
  }
}