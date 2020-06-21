import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

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

  ngOnInit(): void {
    this.checkIfPostcodeExists();
    this.isSearchInProgress();
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  scheduleJob(store: string) {
    if (this.userPostcode && this.userPostcode !== this.postcode.value) {
      this.firestore
        .doc(`users/${this.authenticationService.getUserId()}`)
        .update({ postcode: this.postcode.value });
    } else {
      this.firestore
        .doc(`users/${this.authenticationService.getUserId()}`)
        .update({ postcode: this.postcode.value });
    }
    this.schedulingService.createJob(store, {
      postcode: this.postcode.value,
      worker: 'asdaDeliveryScan',
    });

    this.searchInProgress = true;
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

  isSearchInProgress() {
    const userRef = this.firestore
      .collection('users')
      .doc(this.authenticationService.getUserId()).ref;
    this.subscriptions.add(
      this.firestore
        .collection('jobs', (ref) =>
          ref
            .where('user', '==', userRef)
            .where('state', 'in', ['Scheduled', 'Active'])
            .where('store', '==', 'ASDA')
        )
        .get()
        .subscribe((res) => {
          if (!res.empty) {
            this.searchInProgress = true;
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
