import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from 'src/app/shared/services/authentication/authentication.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  subscriptions = new Subscription();
  error = null;

  constructor(public authService: AuthenticationService) {
    this.subscriptions.add(
      this.authService
        .getRegisterError()
        .subscribe((error) => (this.error = error))
    );
  }

  ngOnInit(): void {}

  googleLogin() {
    this.authService.GoogleAuth();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
