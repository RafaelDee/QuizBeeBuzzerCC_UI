import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavBarComponent } from "../../templates/nav-bar/nav-bar.component";
import { environment } from '../../../environment/environment.prod';
import { GameManagerService } from '../../utilities/services/game-manager.service';

@Component({
  selector: 'app-about',
  imports: [NavBarComponent],
  templateUrl: './about.component.html',
  styles: `
    :host {
      display: block;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  version = environment.version;
  constructor(public gameManager:GameManagerService){
    gameManager.sendDeviceInfo();
  }
}
