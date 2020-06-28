import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  inviteCode = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthenticationService
  ) {}

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
}
