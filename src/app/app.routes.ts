import { Route, Routes } from '@angular/router';
import { SetupComponent } from './setup/setup.component';
import { SecondScreenComponent } from './pages/second-screen/second-screen.component';
import { MainScreenComponent } from './pages/main-screen/main-screen.component';
import { SerialConnectionGuard } from './utilities/guards/SerialConnection.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { QuizEditorComponent } from './pages/quiz-editor/quiz-editor.component';
import { SettingsComponent } from './settings/settings.component';
import { AboutComponent } from './pages/about/about.component';

export const routes: CustomRoutes = [
  { path: '', pathMatch: 'full', component: SetupComponent },
  {
    path: 'main',
    component: MainScreenComponent,
    canActivate: [SerialConnectionGuard],
    data: {
      navItem: {
        name: 'Control Center'
      },
    },
  },
  {
    path: 'quiz_editor',
    component: QuizEditorComponent,
  },
  {
    path: 'sec_scr',
    component: SecondScreenComponent,
    data: {
      navItem: {
        name: 'Scoreboard',
        routeOpenNewWindow: true,
        icon: 'fa-solid fa-arrow-up-right-from-square',
      },
    },
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [SerialConnectionGuard],
    data: {
      navItem: {
        name: 'Settings',
        icon: 'fa-solid fa-gear',
      },
    },
  },
  {path:'about',component:AboutComponent,data:{navItem:{name:'About'}}},
  { path: '404', component: NotFoundComponent, title: '404!' },
  { path: '**', redirectTo: '404' },
];
export const additionalRoutes: NavItem[] = [];
export declare type CustomRoutes = CustomRoute[];
export declare interface CustomRoute extends Route {
  data?: CustomData;
  children?: CustomRoutes;
}
export type CustomData = {
  [key: string | symbol]: any;
  navItem?: NavItem;
  navbarOpaque?: boolean;
};
export interface NavItem {
  name?: string;
  title?: string;
  route?: string;
  routeOpenNewWindow?: boolean;
  routeActiveExact?: boolean;
  icon?: string;
  children?: NavItem[];
  order?: number;
  data?: { [key: string]: any };
}
