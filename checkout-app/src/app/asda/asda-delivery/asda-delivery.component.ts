import { Component, OnInit, OnDestroy } from '@angular/core';
import { SchedulingService } from 'src/app/shared/services/scheduling/scheduling.service';
import { FormControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService } from 'src/app/shared/services/authentication/authentication.service';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-asda-delivery',
  templateUrl: './asda-delivery.component.html',
  styleUrls: ['./asda-delivery.component.scss'],
})
export class AsdaDeliveryComponent implements OnInit, OnDestroy {
  constructor(
    private firestore: AngularFirestore,
    private schedulingService: SchedulingService,
    private authenticationService: AuthenticationService
  ) {}

  postcode = new FormControl('');
  userPostcode = null;
  searchInProgress = false;
  subscriptions = new Subscription();

  ngOnInit(): void {
    this.checkIfPostcodeExists();
    this.isSearchInProgress();
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
      this.subscriptions.add(this.firestore
      .doc(`users/${this.authenticationService.getUserId()}`)
      .get()
      .subscribe((res) => {
        if (res.data().postcode) {
          this.userPostcode = res.data().postcode;
          this.postcode.setValue(this.userPostcode);
        }
      }));
  }

  isSearchInProgress() {
    this.subscriptions.add(this.firestore
      .collection('jobs', (ref) =>
        ref
          .where('userId', '==', `${this.authenticationService.getUserId()}`)
          .where('state', '==', 'Scheduled')
          .where('store', '==', 'ASDA')
      )
      .get()
      .subscribe((res) => {
        if (!res.empty) {
          this.searchInProgress = true;
        }
      }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
