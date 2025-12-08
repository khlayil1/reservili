import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, FormsModule],
})
export class LoginComponent {
  loginRequest = output<{email: string, password: string}>();
  navigateRegister = output<void>();

  email = signal('');
  password = signal('');

  onLogin() {
    this.loginRequest.emit({
      email: this.email(),
      password: this.password()
    });
  }
  
  onNavigateToRegister() {
      this.navigateRegister.emit();
  }
}
