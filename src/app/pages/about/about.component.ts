import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavBarComponent } from "../../templates/nav-bar/nav-bar.component";

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
export class AboutComponent { }
