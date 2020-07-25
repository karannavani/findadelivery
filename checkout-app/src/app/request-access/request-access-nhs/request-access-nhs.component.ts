import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { RequestAccessService } from '../service/request-access.service';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-request-access-nhs',
  templateUrl: './request-access-nhs.component.html',
  styleUrls: ['./request-access-nhs.component.scss'],
})
export class RequestAccessNhsComponent implements OnInit, OnDestroy {
  constructor(private requestAccessService: RequestAccessService) {}

  email = new FormControl('', [Validators.required, Validators.email]);
  error = null;
  submitted = false;
  subscriptions = new Subscription();

  ngOnInit(): void {}

  onSubmit(): any {
    if (
      this.email.valid &&
      (this.email.value.endsWith('nhs.uk') ||
        this.email.value.endsWith('nhs.net'))
    ) {
      this.subscriptions.add(
        this.requestAccessService
          .checkIfEmailExists(this.email.value, 'nhsSignups')
          .pipe(
            map((emailExists) => emailExists),
            mergeMap((emailExists) => {
              if (!emailExists) {
                return this.requestAccessService.completeSignup(
                  this.email.value,
                  'nhsSignups'
                );
              } else {
                this.error = 'This email already exists';
                return of(null);
              }
            })
          )
          .subscribe((success) => {
            if (success) {
              this.error = null;
              this.submitted = true;
            } else {
              if (!this.error.includes('already exists')) {
                this.error =
                  'Unable to complete your signup at the moment, please try again later';
              }
              this.submitted = false;
            }
          })
      );
    } else if (this.email.invalid) {
      this.error = 'Please enter a valid email address';
    } else if (!this.email.value.endsWith('nhs.uk')) {
      this.error = 'Please enter an email ending with "nhs.uk" or "nhs.net';
    } else {
      this.error = 'Please enter a valid email address';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
