import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QuizManagerService } from '../../utilities/services/quiz-manager.service';

@Component({
  selector: 'app-second-screen',
  imports: [],
  templateUrl: './second-screen.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondScreenComponent {
  constructor(quizServ:QuizManagerService){

  }
}
