import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication/authentication.service';
import { take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LoginRedirectGuard implements CanActivate {
  constructor(
    private authenticationService: AuthenticationService,
    public router: Router
  ) {}
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authenticationService.afAuth.authState.pipe(
      take(1),
      map((user) => {
        if (user) {
          this.router.navigate(['home']);
          return false;
        }

        return true;
      })
    );
  }
}
