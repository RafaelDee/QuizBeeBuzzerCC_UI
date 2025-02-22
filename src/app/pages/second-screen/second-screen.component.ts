import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuizManagerService } from '../../utilities/services/quiz-manager.service';
import { ScoringService } from '../../utilities/services/scoring.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-second-screen',
  imports: [CommonModule],
  templateUrl: './second-screen.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SecondScreenComponent {
  constructor(public score: ScoringService) {
    document.documentElement.removeAttribute('data-bs-theme');
  }
  identify(index, item) {
    return index;
  }
}
