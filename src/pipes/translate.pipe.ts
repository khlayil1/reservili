import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Needed to react to language changes from the service
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  
  transform(key: string): string {
    // By reading this signal, the pipe becomes aware of language changes
    this.translationService.currentLang(); 
    return this.translationService.get(key);
  }
}
