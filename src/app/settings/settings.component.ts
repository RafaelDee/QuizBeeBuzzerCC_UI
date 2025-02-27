import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavBarComponent } from '../templates/nav-bar/nav-bar.component';
import {
  SoundFX,
  SoundFXService,
  SoundEffects,
} from '../utilities/services/soundFX.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecondScreenComponent } from '../pages/second-screen/second-screen.component';
import { ModalService } from '../utilities/services/modal.service';
import { FileManagerModalComponent } from '../utilities/modal/modal-component/file-manager/file-managerModal.component';
import { GameManagerService } from '../utilities/services/game-manager.service';

@Component({
  selector: 'app-settings',
  imports: [NavBarComponent, CommonModule, FormsModule, SecondScreenComponent],
  templateUrl: './settings.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SettingsComponent {
  constructor(
    public soundFx: SoundFXService,
    private modal: ModalService,
    public gameManager: GameManagerService
  ) {}
  uploadImage() {
    const modalRef = this.modal.open(FileManagerModalComponent, {
      backdrop: 'static',
    });
    const compInstance = modalRef.componentInstance;
    compInstance.accept = 'image/*';
    compInstance.multiple = false;
    compInstance.onFileDrop.subscribe((f) => {
      const file = f[0];
      if (file == null) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener(
        'load',
        () => {
          const base64String = reader.result as string;
          // convert image file to base64 string and save to localStorage
          //this.podium.photo = base64String;
          this.gameManager.setSettings({ secondScrBkg: base64String });
        },
        false
      );
      modalRef.close();
    });
  }
}
