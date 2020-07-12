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
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ValidateInviteGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.router.navigated && next.params.inviteCode) {
      this.authService.validateInviteCode(next.params.inviteCode);
      this.authService
        .getInviteError()
        .pipe(
          map((error) => {
            if (error) {
              this.router.navigate(['invite']);
              return false;
            }
          })
        )
        .subscribe();
    } else if (!this.router.navigated && !next.params.inviteCode) {
      this.router.navigate(['invite']);
      return false;
    } else {
      return true;
    }
  }
}
