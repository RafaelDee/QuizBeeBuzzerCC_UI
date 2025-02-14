import { Routes } from '@angular/router';
import { SetupComponent } from './setup/setup.component';
import { SecondScreenComponent } from './pages/second-screen/second-screen.component';
import { MainScreenComponent } from './pages/main-screen/main-screen.component';
import { SerialConnectionGuard } from './utilities/guards/SerialConnection.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: SetupComponent },
  {
    path: 'main',
    component: MainScreenComponent,
    canActivate: [SerialConnectionGuard],
  },
  {
    path: 'sec_scr',
    component: SecondScreenComponent,
    canActivate: [SerialConnectionGuard],
  },
  {
    path: '404',
    component: SecondScreenComponent,
    canActivate: [SerialConnectionGuard],
  },
  { path: '404', component: NotFoundComponent, title: '404!' },
  { path: '**', redirectTo: '404' },
];
