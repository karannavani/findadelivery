import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  inviteCode = null;
  subscriptions = new Subscription();
  error = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthenticationService
  ) {
    this.subscriptions.add(
      this.authService
        .getRegisterError()
        .subscribe((error) => (this.error = error))
    );
  }

  ngOnInit(): void {
    this.checkForInvite();
  }

  checkForInvite(): void {
    this.route.params.subscribe(
      (params) => (this.inviteCode = params.inviteCode)
    );
  }

  googleLogin() {
    this.authService.GoogleAuth(this.inviteCode);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
