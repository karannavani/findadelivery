import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../authentication/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  constructor(private firestore: AngularFirestore, private http: HttpClient, private authService: AuthenticationService) {}

  createJob() {
    const created = new Date().toISOString();
    const userId = this.authService.getUserId();
    const data = {
      userId,
      created,
      store: 'Amazon',
      type: 'Delivery',
      state: 'Scheduled'
    };
    return new Promise<any>((resolve, reject) => {
      this.firestore
        .collection('jobs')
        .add(data)
        .then(
          (res) => {
            this.triggerJobCheck();
          },
          (err) => reject(err)
        );
    });
  }

  triggerJobCheck() {
    console.log('triggered');
    this.http.get('http://localhost:3124/api/trigger-job-check').subscribe();
  }
}
