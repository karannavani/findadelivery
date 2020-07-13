import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from 'src/app/shared/services/authentication/authentication.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  subscriptions = new Subscription();
  error = null;
  loginForm = this.fb.group({
    email: ['', [Validators.required]],
    password: [null, [Validators.required, Validators.minLength(5)]],
  });
  constructor(
    public authService: AuthenticationService,
    private fb: FormBuilder
  ) {
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

  emailLogin() {
    const { email, password } = this.loginForm.controls;
    this.authService.SignIn(email.value, password.value);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
