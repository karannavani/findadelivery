import { Component, OnInit } from '@angular/core';
import { SchedulingService } from 'src/app/shared/services/scheduling/scheduling.service';
import { FormControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService } from 'src/app/shared/services/authentication/authentication.service';

@Component({
  selector: 'app-asda-delivery',
  templateUrl: './asda-delivery.component.html',
  styleUrls: ['./asda-delivery.component.scss'],
})
export class AsdaDeliveryComponent implements OnInit {
  constructor(
    private firestore: AngularFirestore,
    private schedulingService: SchedulingService,
    private authenticationService: AuthenticationService
  ) {}

  postcode = new FormControl('');

  ngOnInit(): void {
    // this.populatePostcode();
  }

  populatePostcode() {
    const userId = this.authenticationService.getUserId();

    return this.firestore
      .collection('users', (ref) => ref.where('userId', '==', userId))
      .snapshotChanges()
      .subscribe((res) => console.log('res is', res));
  }

  scheduleJob(store) {
    this.schedulingService.createJob(store);
    console.log('created job');
  }
}
