import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastsContainer } from './utilities/services/toast/toasts-container.component';
import { SettingsConfigService } from './utilities/services/settings-config.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ToastsContainer],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(settingsServ: SettingsConfigService) {}
}
