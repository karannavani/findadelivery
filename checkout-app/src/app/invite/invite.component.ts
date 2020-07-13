import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) {}

  inviteCode = new FormControl();
  error = null;
  subscriptions = new Subscription();

  ngOnInit(): void {}

  next(): void {
    this.authService.validateInviteCode(this.inviteCode.value);

    this.subscriptions.add(
      this.authService
        .getInviteError()
        .pipe(
          map((error) => {
            error
              ? (this.error = error)
              : this.router.navigate([
                  'register',
                  { inviteCode: this.inviteCode.value },
                ]);
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
