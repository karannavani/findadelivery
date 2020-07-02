import { Injectable } from '@angular/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { filter } from 'rxjs/operators';
import { generate } from 'voucher-code-generator';

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
          } else {
            emailExists.next(false);
          }
        })
    );
    return emailExists.asObservable();
  }

  completeSignup(email: string, collection: string): void {
    const created = new Date().toISOString();
    const invite = '';
    const data = { created, email, invite };
    this.generateInvite();
    // this.firestore.collection(collection).add(data);
  }

  generateInvite(): void {
    // generate({
    //   length: 5,
    //   count: 1
    // });
    console.log(
      generate({
        length: 5,
        count: 1,
      })
    );
    let inviteCode, registered, sendInvite;
    const data = { inviteCode, registered, sendInvite };
  }
}
