import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../authentication/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  constructor(
    private firestore: AngularFirestore,
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}

  createJob(store, options?: object) {
    const created = new Date().toISOString();
    const userId = this.authenticationService.getUserId();
    const data = {
      userId,
      created,
      store,
      type: 'Delivery',
      state: 'Scheduled',
    };

    if (options) {
      Object.keys(options).forEach((key) => {
        data[key] = options[key];
      });
    }

    return new Promise<any>((resolve, reject) => {
      this.firestore
        .collection('jobs')
        .add(data)
        .then(
          (res) => {
            // this.triggerJobCheck(store);
          },
          (err) => reject(err)
        );
    });
  }

  triggerJobCheck(store) {
    console.log('triggered');
    this.http
      .post('http://localhost:3124/api/trigger-job-check', { store })
      .subscribe();
  }
}
