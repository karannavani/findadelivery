import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  Subscription,
  of,
  Observable,
  Subject,
  forkJoin,
  merge,
  concat,
} from 'rxjs';
import { RequestAccessService } from '../service/request-access.service';
import { tap, map, switchMap, mergeMap } from 'rxjs/operators';

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
    if (this.email.valid && this.email.value.endsWith('nhs.uk')) {
      if (!this.verifyEmail(this.email.value)) {
        this.requestAccessService
          .completeSignup(this.email.value, 'nhsSignups')
          .subscribe((res) => {
            console.log('res is', res);
          });
      } else {
        this.error = 'This email already exists';
      }
      // this.requestAccessService
      //   .checkIfEmailExists(this.email.value, 'nhsSignups')
      //   .pipe()
      //   // .pipe(
      //   //   tap((emailExists) => console.log('emailExists is', emailExists)),
      //   //   map((emailExists) => {
      //   //     if (!emailExists) {
      //   //       return forkJoin(
      //   //         this.requestAccessService.completeSignup(
      //   //           this.email.value,
      //   //           'nhsSignUps'
      //   //         )
      //   //       );
      //   //     } else {
      //   //       console.error('email already exists');
      //   //       return 'hi';
      //   //     }
      //   //   })
      //   //   // tap((res) => console.log('tap is', res)),
      //   //   // map((signupCompleted) => {
      //   //   //   if (signupCompleted) {
      //   //   //     return signupCompleted.
      //   //   //   } else {
      //   //   //     this.error = 'This email already exists';
      //   //   //   }
      //   //   // })
      //   // )
      //   .subscribe((res) => console.log('res is', res));

      // this.subscriptions.add(
      //   this.requestAccessService
      //     .checkIfEmailExists(this.email.value, 'nhsSignups')
      //     .subscribe((emailExists) => {
      //       if (!emailExists) {
      //         console.log('email does not exist');
      //         this.requestAccessService
      //           .completeSignup(this.email.value, 'nhsSignups')
      //           .pipe(
      //             tap((signupCompleted) => {
      //               if (signupCompleted) {
      //                 this.error = null;
      //                 this.submitted = true;
      //               } else {
      //                 this.error =
      //                   'Unable to complete your signup at the moment, please try again later';
      //                 this.submitted = false;
      //               }
      //             })
      //           );
      //       } else {
      //         this.error = 'This email already exists';
      //         console.error('email already exists');
      //       }
      //     })
      // );
    } else if (this.email.invalid) {
      this.error = 'Please enter a valid email address';
    } else if (!this.email.value.endsWith('nhs.uk')) {
      this.error = 'Please enter an email ending with "@nhs.uk"';
    } else {
      this.error = 'Please enter a valid email address';
    }
  }

  verifyEmail(email: string): any {
    this.requestAccessService
      .checkIfEmailExists(email, 'nhsSignups')
      .pipe(map((emailExists) => emailExists));
  }

  // completeSignup(): any {
  //   this.requestAccessService.completeSignup()
  // }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
