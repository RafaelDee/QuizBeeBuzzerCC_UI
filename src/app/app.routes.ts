import { Route, Routes } from '@angular/router';
import { SetupComponent } from './setup/setup.component';
import { SecondScreenComponent } from './pages/second-screen/second-screen.component';
import { MainScreenComponent } from './pages/main-screen/main-screen.component';
import { SerialConnectionGuard } from './utilities/guards/SerialConnection.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { QuizEditorComponent } from './pages/quiz-editor/quiz-editor.component';

export const routes: CustomRoutes = [
  { path: '', pathMatch: 'full', component: SetupComponent },
  {
    path: 'main',
    component: MainScreenComponent,
    canActivate: [SerialConnectionGuard],
  },
  {
    path: 'quiz_editor',
    component: QuizEditorComponent,
  },
  {
    path: 'sec_scr',
    component: SecondScreenComponent,data:{navItem:{name:'Points',routeOpenNewWindow:true,icon:'fa-solid fa-arrow-up-right-from-square'}}
  },
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
  routeOpenNewWindow?:boolean;
  routeActiveExact?: boolean;
  icon?: string;
  children?: NavItem[];
  order?: number;
  data?: { [key: string]: any };
}
