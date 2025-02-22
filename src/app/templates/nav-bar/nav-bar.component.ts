import { Component, HostListener, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AsyncComponent } from '../../utilities/async/async.component';
import { LoadingComponent } from '../async/loading/loading.component';
import { environment } from '../../../environment/environment.prod';
import { additionalRoutes, CustomRoutes, NavItem } from '../../app.routes';
import { CookieManager } from '../../utilities/cookieManager';
import { capitalizeFirstLetter } from '../../utilities/common-utils';
//import { AuthService } from 'src/app/utilities/services/auth.service';
export type TitleType = 'logo' | 'title' | 'both';
@Component({
  selector: 'nav-bar',
  standalone: true,
  imports: [CommonModule, AsyncComponent, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {
  allowTopTransparency: boolean = false;
  isScrolled = false;
  titleType: TitleType = 'both';
  enableTitleIcon = true;
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.allowTopTransparency) {
      return;
    }
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    this.isScrolled = scrollPosition > 0;
  }
  title = environment['appName'];
  /** the items that will be displayed on the navbar */
  navItems: NavItem[] = [];
  LoadingComponent = LoadingComponent;
  AdditionalnavItems: NavItem[] = [];
  profilePath = `users/me`;
  setDark = ThemeService.setDark;
  getIsDarkThemed = getIsDarkThemed;
  currentRoute = '';
  constructor(public router: Router, private route: ActivatedRoute) {
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((url) => {
        let title;
        this.allowTopTransparency = (() => {
          let child = this.route.firstChild;
          while (child) {
            if (child.snapshot.title) title = child.snapshot.title;
            if (child.firstChild) {
              child = child.firstChild;
            } else if (
              child.snapshot.data &&
              child.snapshot.data['navbarOpaque']
            ) {
              return child.snapshot.data['navbarOpaque'];
            } else {
              return false;
            }
          }
          return false;
        })();
        //console.log(`allow transparency? ${route.snapshot.data['navbarOpaque']??false}`)

        console.log(url);
        this.currentRoute = capitalizeFirstLetter(
          title ?? environment['appName']
        );
        /* const index = 0;
          this.navItems
            .sort((a, b) => {
              let f = index + (b?.order ?? 0) - (index + (a?.order ?? 0));
              index++;
              return f;
            })
            .find((f) => f.route == (url as NavigationEnd).url?.split('/')[1])
            ?.name ?? ''; */
      });
  }
  openRouteBlank(navItem: NavItem) {
    if (!navItem.route) return;
    const url = this.router.serializeUrl(
      this.router.createUrlTree([navItem.route])
    );
    window.open(url, '_blank');
  }
  filterRoutes(navItem: NavItem[], user: any) {
    return navItem;
  }
  async ngOnInit(): Promise<void> {
    this.getAllNavbarRoutes(undefined);
  }
  /**gets all navPaths that will be displayed in the navbar */
  async getAllNavbarRoutes(user: any) {
    this.navItems = [
      ...this.AdditionalnavItems,
      ...this.getNavbarRoute(this.router.config, user),
      ...this.checkNavItem(additionalRoutes, user),
    ];
  }
  private getNavbarRoute(
    navitems: CustomRoutes,
    user?: any,
    parentRoute?: string
  ) {
    let navItms: NavItem[] = [];
    navitems.forEach((route) => {
      const compoundRoute = [parentRoute, route.path]
        .filter((f) => !!f)
        .join('/');
      const navItem = route?.data?.navItem;
      //if user is still loading, give all routes so it will be snappy
      if (navItem) {
        // eslint-disable-next-line no-useless-escape
        const regex = /[*\/:]/;
        if (route.path == undefined) return;
        if (regex.test(route.path)) {
          return;
        }
        //check in the parent Route param if some settings already exist like title, routeActiveExact = pathmatch = 'full'
        //TODO add function to get title of route param before name

        /* navItem.children?.forEach((c) => {
          //check if path is root
          if(c.route?.[0] == '/')return;
          console.log(`${c.route} + ${compoundRoute}`)
          c.route = [compoundRoute, c.route].filter(f=>!!f).join('/');
        }); */
        console.log(route.title);
        navItms.push({
          name: route.title?.toString(),
          route: compoundRoute,
          routeActiveExact: route.pathMatch == 'full',
          ...navItem,
        });
        console.log(navItms);
      }
      //get children
      if (route.children) {
        navItms = navItms.concat(
          this.getNavbarRoute(route.children, user, compoundRoute)
        );
      }
    });
    return navItms;
  }
  checkNavItem(navItem: NavItem[], user: any) {
    return navItem
      ?.map((route) => {
        const hasPriv = true;
        console.log(hasPriv);
        if (!hasPriv) return null;
        if (route.children) {
          route.children = this.checkNavItem(route.children, user);
        }
        return route;
      })
      ?.filter((f) => !!f);
  }
}

export interface NavBarItem {
  name: string;
  route: string;
  icon: string;
}

export function toggleTheme() {
  const currDrkTheme = getIsDarkThemed();
  if (currDrkTheme == null) {
    ThemeService.setDark(false);
    return;
  }
}
export class ThemeService {
  private static _isDarkMode: boolean = false;

  public static get isDarkMode(): boolean {
    return ThemeService._isDarkMode;
  }
  //TODO: seperate into ThemeManager
  public static setDark(state: boolean | null) {
    const htmlElement = document.documentElement;
    const procState =
      state == null
        ? window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        : state;
    if (procState) {
      htmlElement.setAttribute('data-bs-theme', 'dark');
    } else {
      htmlElement.setAttribute('data-bs-theme', '');
    }
    ThemeService._isDarkMode = procState;
    CookieManager.setCookie('darkThemed', String(procState), 1000);
  }
}

export function getIsDarkThemed() {
  return document.documentElement.getAttribute('data-bs-theme') == 'dark';
}
function setThemeViaCookie() {
  const cookie = CookieManager.getCookie('darkThemed');
  ThemeService.setDark(
    cookie == null || cookie == undefined ? null : cookie == 'true'
  );
}
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    setThemeViaCookie();
  });
setThemeViaCookie();
