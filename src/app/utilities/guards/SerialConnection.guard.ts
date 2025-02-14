import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  ActivatedRoute,
} from '@angular/router';
import { filter, firstValueFrom, map, Observable, take } from 'rxjs';
import { SerialService } from '../services/serial.service';

@Injectable({
  providedIn: 'root',
})
export class SerialConnectionGuard implements CanActivate {
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.serialServ.connectionStatus.pipe(
      filter((f) => f != 'connecting'),
      map((status) => {
        const isConnected = status=='connected';
        console.log(isConnected);
        if (!isConnected) this.router.navigate(['/'], { replaceUrl: true }); // Redirect if not connected
        return isConnected;
      })
    );
  }
  constructor(
    private serialServ: SerialService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
}
