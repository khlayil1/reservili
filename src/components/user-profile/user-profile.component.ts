import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/reservili.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
})
export class UserProfileComponent {
  user = input.required<User>();
  userUpdated = output<User>();
  navigateBack = output<void>();

  editableUser = signal<User | null>(null);
  
  constructor() {
    effect(() => {
        this.editableUser.set({ ...this.user() });
    }, { allowSignalWrites: true });
  }

  onSaveProfile() {
    if (this.editableUser()) {
      this.userUpdated.emit(this.editableUser()!);
    }
  }

  onCancel() {
    this.navigateBack.emit();
  }
  
  onGenerateImage() {
    this.editableUser.update(user => {
      if (!user) return null;
      const seed = `user-${Date.now()}`;
      user.imageUrl = `https://i.pravatar.cc/150?u=${seed}`;
      return user;
    });
  }
}