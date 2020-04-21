import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  constructor(private firestore: AngularFirestore) {}

  createJob() {

    const created = new Date().toISOString();
    const data = {
      created,
      service: 'Amazon',
    };
    return new Promise<any>((resolve, reject) => {
      this.firestore
        .collection('jobs')
        .add(data)
        .then(
          // add API call here to get the backend to check the queue
          (res) => {},
          (err) => reject(err)
        );
    });
  }
}
