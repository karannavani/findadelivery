import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Job } from './job-interace';

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
  recentSearches = [];
  activeSearches = [];
  // icelandStatus: Job = { state: null } as Job;

  ngOnInit(): void {
    this.getUserRef();
    this.checkIfPostcodeExists();
    this.isSearchInProgress();
    this.getRecentSearches();
    // this.subscribeToIcelandStatus(this.userRef);
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  scheduleJob() {
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
          if (res.data().postcode) {
            this.userPostcode = res.data().postcode;
            this.postcode.setValue(this.userPostcode);
          }
        })
    );
  }

  // subscribeToIcelandStatus(userRef) {
  //   const icelandObservable = this.firestore
  //     .collection('jobs', (ref) =>
  //       ref
  //         .where('user', '==', this.userRef)
  //         .where('store', '==', 'iceland')
  //         .orderBy('created', 'desc')
  //     )
  //     .valueChanges();

  //   this.subscriptions.add(
  //     icelandObservable.subscribe((data) => {
  //       this.icelandStatus = data[0] as Job;
  //       console.log('iceland state is', data);
  //     })
  //   );
  // }

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
          this.activeSearches = res;
          this.activeSearches.forEach((activeSearch) => {
            activeSearch.store = this.formatStore(activeSearch.store);
            activeSearch.created = this.formatDate(activeSearch.created);
          });
          this.searchInProgress = res.length ? true : false;
        })
    );
  }

  getRecentSearches() {
    this.subscriptions.add(
      this.firestore
        .collection('jobs', (ref) =>
          ref
            .where('user', '==', this.userRef)
            .where('state', 'in', ['Completed'])
            .orderBy('created', 'desc')
        )
        .valueChanges()
        .subscribe((res) => {
          this.recentSearches = res.slice(0, 5);
          this.recentSearches.forEach((recentSearch) => {
            recentSearch.store = this.formatStore(recentSearch.store);
            recentSearch.created = this.formatDate(recentSearch.created);
          });
        })
    );
  }

  formatStore(store: string) {
    return store.charAt(0).toUpperCase() + store.slice(1);
  }

  formatDate(created: string) {
    return new Date(created).toLocaleString();
  }

  selectSupermarket(supermarket) {
    if (this.selectedSupermarket.includes(supermarket)) {
      const index = this.selectedSupermarket.indexOf(supermarket);
      this.selectedSupermarket.splice(index, 1);
    } else {
      this.selectedSupermarket.push(supermarket);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
