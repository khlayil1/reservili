import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { AppComponent } from './src/app.component';
import { authInterceptor } from './src/services/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(FormsModule),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.