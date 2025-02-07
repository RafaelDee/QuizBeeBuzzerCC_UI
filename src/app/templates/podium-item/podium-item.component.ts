import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  DnrSeverity,
  LEDState,
  Podium,
  podiumStatusColor,
} from '../../values/podium.values';
import { bsColor } from '../../bootstrap_plus/ts/bootstrap';
import { CommonModule } from '@angular/common';
const standByColorUI: `bg-${bsColor}` = 'bg-warning';
const ledStateToUI: Partial<{
  [state in LEDState]: `#${string}` | `bg-${bsColor}`;
}> = {
  [LEDState.OFF]: 'bg-secondary',
  [LEDState.SpotLight]: 'bg-warning',
  [LEDState.CorrectAnswer]: 'bg-success',
  [LEDState.WrongAnswer]: 'bg-danger',
  [LEDState.StandBy]: standByColorUI,
};
@Component({
  selector: 'app-podium-item',
  imports: [CommonModule],
  templateUrl: './podium-item.component.html',
  styleUrls: ['./podium-item.component.scss'],
})
export class PodiumItemComponent {
  @Input() podium: Podium;

  @Input() defaultTitle: string = 'PODIUM';
  @Input() index: number = 0;
  @Input() podiumPlacement:number = null;
  @Output() onSpotlight = new EventEmitter<void>();
  get readableIndex() {
    return this.index + 1;
  }
  get namePlateColor() {
    const color =
      ledStateToUI[this.podium?.ledState ?? LEDState.OFF] ?? 'bg-secondary';
    return { isClass: !color.charAt(0).match('#'), color };
  }
  get status() {
    return {
      color: podiumStatusColor[this.podium.dnr] ?? 'danger',
      title: this.podium?.dnr ?? 'disconnected',
    };
  }
}
