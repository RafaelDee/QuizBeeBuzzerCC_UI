import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
import { EmptyContentComponent } from '../templates/async/empty/empty/empty-content.component';
import { AdvancedImgDirective } from '../utilities/directives/advanced-img.directive';
import { SettingsConfigService } from '../utilities/services/settings-config.service';
import { SimpleModalComponent } from '../utilities/modal/modal-component/simple-modal.component';

@Component({
  selector: 'app-settings',
  imports: [
    NavBarComponent,
    CommonModule,
    FormsModule,
    SecondScreenComponent,
    EmptyContentComponent,
    AdvancedImgDirective,
  ],
  templateUrl: './settings.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SettingsComponent implements OnDestroy, OnInit {
  constructor(
    public soundFx: SoundFXService,
    private modal: ModalService,
    public gameManager: GameManagerService,
    public settingsServ: SettingsConfigService
  ) {
    this.gameManager.editorMode(true);
  }
  ngOnInit(): void {
    this.gameManager.editorMode(true);
  }
  ngOnDestroy(): void {
    //this.gameManager.editorMode(false);
  }
  async clearMemory() {
    await SimpleModalComponent.showMessage(
      this.modal,
      'Clearing Memory',
      `are you sure you want to <b class="text-danger">Clear Memory</b>`,
      { title: 'Clear', params: { color: 'danger', dismiss: true } },
      { title: 'Cancel', params: { dismiss: true } }
    );
    this.gameManager.clearMemory();
    this.settingsServ.clear();
  }
  uploadImage(id: string) {
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
          this.settingsServ.setSettings({ [id]: base64String });
        },
        false
      );
      modalRef.close();
    });
  }
}
