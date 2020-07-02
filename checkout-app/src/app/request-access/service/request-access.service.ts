import { Injectable } from '@angular/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RequestAccessService {
  constructor(private firestore: AngularFirestore) {}
  subscriptions = new Subscription();

  checkIfEmailExists(email: string, collection: string): Observable<boolean> {
    const emailExists = new Subject<boolean>();

    this.subscriptions.add(
      this.firestore
        .collection(collection)
        .get()
        .subscribe((res) => {
          if (!res.empty) {
            console.log('res is', res.docs);
            console.log(res.docs.filter((doc) => doc.data().email === email));
            res.docs.filter((doc) => doc.data().email === email).length
              ? emailExists.next(true)
              : emailExists.next(false);
            // res.docs
          } else {
            emailExists.next(false);
          }
        })
    );
    return emailExists.asObservable();
  }

  completeSignup(): void {}
}
