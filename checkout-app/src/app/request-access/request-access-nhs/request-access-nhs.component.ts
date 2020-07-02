import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription, of, Observable, Subject } from 'rxjs';
import { RequestAccessService } from '../service/request-access.service';

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

  onSubmit(): void {
    if (this.email.valid && this.email.value.endsWith('nhs.uk')) {
      this.subscriptions.add(
        this.requestAccessService
          .checkIfEmailExists(this.email.value, 'nhsSignups')
          .subscribe((emailExists) => {
            console.log('email exists is', emailExists);
            if (emailExists) {
            } else {
              this.error = null;
              this.submitted = true;
              this.requestAccessService.completeSignup(
                this.email.value,
                'nhsSignups'
              );
            }
          })
      );
    } else if (this.email.invalid) {
      this.error = 'Please enter a valid email address';
    } else if (!this.email.value.endsWith('nhs.uk')) {
      this.error = 'Please enter an email ending with "@nhs.uk"';
    } else {
      this.error = 'Please enter a valid email address';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
