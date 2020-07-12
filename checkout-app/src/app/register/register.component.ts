import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { Subscription } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  inviteCode = null;
  subscriptions = new Subscription();
  error = null;
  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required]],
    password: [null, [Validators.required, Validators.minLength(5)]],
  });

  constructor(
    private route: ActivatedRoute,
    public authService: AuthenticationService,
    private fb: FormBuilder
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

  emailSignUp() {
    const { email, password, name } = this.registerForm.controls;
    this.authService.SignUp(
      email.value,
      password.value,
      name.value,
      this.inviteCode
    );
  }

  googleLogin() {
    this.authService.GoogleAuth(this.inviteCode);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
