import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/reservili.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser = signal<User | null>(null);

  // In a real app, this would be part of a user database
  private users: User[] = [
      { id: 'cust1', name: 'Alex Doe', email: 'alex.doe@example.com', role: UserRole.Customer },
      { id: 'provider1', name: 'Sam Inkwell', email: 'sam.ink@example.com', role: UserRole.ServiceProvider },
  ];

  loginAsCustomer() {
    this.currentUser.set(this.users.find(u => u.role === UserRole.Customer && u.id === 'cust1') || null);
  }

  loginAsProvider() {
    this.currentUser.set(this.users.find(u => u.role === UserRole.ServiceProvider && u.id === 'provider1') || null);
  }

  registerUser(details: {name: string, email: string, role: UserRole, password?: string}): User {
    const newUser: User = {
        id: `${details.role.toLowerCase()}-${Date.now()}`,
        name: details.name,
        email: details.email,
        role: details.role,
    };
    this.users.push(newUser);
    this.currentUser.set(newUser); // Log in the new user immediately
    return newUser;
  }

  logout() {
    this.currentUser.set(null);
  }
}