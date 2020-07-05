import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Job } from './job-interace';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private schedulingService: SchedulingService,
    private authenticationService: AuthenticationService,
    private titleService: Title,
    private firestore: AngularFirestore
  ) {}

  postcode = new FormControl('');
  userPostcode = null;
  searchInProgress = false;
  subscriptions = new Subscription();
  selectedSupermarket = [];
  userRef: any;
  errors = [];
  // recentSearches = [];
  // activeSearches = [];

  ngOnInit(): void {
    this.getUserRef();
    this.checkIfPostcodeExists();
    this.isSearchInProgress();
    this.checkForErrors();
    // this.getRecentSearches();
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  scheduleJob() {
    this.dismissError();

    this.selectedSupermarket.forEach((supermarket) => {
      if (this.userPostcode && this.userPostcode !== this.postcode.value) {
        this.firestore
          .doc(`users/${this.authenticationService.getUserId()}`)
          .update({ postcode: this.postcode.value });
      } else {
        this.firestore
          .doc(`users/${this.authenticationService.getUserId()}`)
          .update({ postcode: this.postcode.value });
      }
      this.schedulingService.createJob(supermarket, {
        postcode: this.postcode.value,
        worker: `${supermarket}DeliveryScan`,
      });
    });
    this.searchInProgress = true;
  }

  getUserRef() {
    this.userRef = this.firestore
      .collection('users')
      .doc(this.authenticationService.getUserId()).ref;
  }

  checkIfPostcodeExists() {
    this.subscriptions.add(
      this.firestore
        .doc(`users/${this.authenticationService.getUserId()}`)
        .get()
        .subscribe((res) => {
          if (res.exists && res.data().postcode) {
            this.userPostcode = res.data().postcode;
            this.postcode.setValue(this.userPostcode);
          }
        })
    );
  }

  isSearchInProgress() {
    this.subscriptions.add(
      this.firestore
        .collection('jobs', (ref) =>
          ref
            .where('user', '==', this.userRef)
            .where('state', 'in', ['Scheduled', 'Active'])
        )
        .valueChanges()
        .subscribe((res) => {
          // this.activeSearches = res;
          // this.activeSearches.forEach((activeSearch) => {
          //   activeSearch.store = this.formatStore(activeSearch.store);
          //   activeSearch.created = this.formatDate(activeSearch.created);
          // });
          this.searchInProgress = res.length ? true : false;
        })
    );
  }

  // getRecentSearches() {
  //   this.subscriptions.add(
  //     this.firestore
  //       .collection('jobs', (ref) =>
  //         ref
  //           .where('user', '==', this.userRef)
  //           .where('state', 'in', ['Completed'])
  //           .orderBy('created', 'desc')
  //       )
  //       .valueChanges()
  //       .subscribe((res) => {
  //         this.recentSearches = res.slice(0, 5);
  //         this.recentSearches.forEach((recentSearch) => {
  //           recentSearch.store = this.formatStore(recentSearch.store);
  //           recentSearch.created = this.formatDate(recentSearch.created);
  //         });
  //       })
  //   );
  // }

  formatStore(store: string) {
    return store.charAt(0).toUpperCase() + store.slice(1);
  }

  formatDate(created: any) {
    // const options = {}
    const date = new Date(created).toLocaleString('en-GB', {
      timeStyle: 'short',
      dateStyle: 'medium',
    } as any);

    const time = date.split(',')[1];
    const day = date.split(',')[0];

    return `${time}, ${day}`;
  }

  selectSupermarket(supermarket) {
    if (this.selectedSupermarket.includes(supermarket)) {
      const index = this.selectedSupermarket.indexOf(supermarket);
      this.selectedSupermarket.splice(index, 1);
    } else {
      this.selectedSupermarket.push(supermarket);
    }
  }

  dismissError() {
    this.subscriptions.add(
      this.firestore
        .collection('jobs', (ref) =>
          ref
            .where('user', '==', this.userRef)
            .where('state', '==', 'Error')
            .where('dismissed', '==', false)
        )
        .get()
        .pipe(
          map((snapshot) =>
            snapshot.docs.forEach((doc) => {
              this.firestore
                .doc(doc.ref)
                .update({ dismissed: true })
                .then(() => (this.errors = []));
            })
          )
        )
        .subscribe()
    );
  }

  checkForErrors() {
    this.subscriptions.add(
      this.firestore
        .collection('jobs', (ref) =>
          ref
            .where('user', '==', this.userRef)
            .where('state', '==', 'Error')
            .where('dismissed', '==', false)
        )
        .valueChanges()
        .subscribe((res) => {
          if (res.length) {
            this.errors = [];
            res.forEach((job: any) => {
              this.formatErrorMessage(job.error, job.store);
            });
          }
        })
    );
  }

  formatErrorMessage(error: string, store: string) {
    const supermarket = this.formatStore(store);
    let errorMessage;
    if (
      error.includes('does not deliver to this address') ||
      error.includes('Invalid postcode')
    ) {
      errorMessage = error.split(':')[2].trim();
      const end = errorMessage.indexOf(' at');
      errorMessage = errorMessage.slice(0, end);
      this.errors.push({ errorMessage, supermarket });
    } else {
      errorMessage =
        'The cause is unknown. We are looking into this. Feel free to contact us at support@findadelivery.com for help';
      this.errors.push({ errorMessage, supermarket });
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
