import { Injectable } from '@angular/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { filter, map } from 'rxjs/operators';
import { generate } from 'voucher-code-generator';

@Injectable({
  providedIn: 'root',
})
export class RequestAccessService {
  constructor(private firestore: AngularFirestore) {}

  checkIfEmailExists(email: string, collection: string): Observable<boolean> {
    const emailExists = new Subject<boolean>();

    this.firestore
      .collection(collection)
      .get()
      .subscribe((res) => {
        if (!res.empty) {
          res.docs.filter((doc) => doc.data().email === email).length
            ? emailExists.next(true)
            : emailExists.next(false);
        } else {
          emailExists.next(false);
        }
      });
    return emailExists.asObservable();
  }

  completeSignup(email: string, collection: string): Observable<boolean> {
    const signupCompleted = new Subject<boolean>();
    console.log('complete sign up called');

    this.createInvite(email).subscribe((inviteCreated) => {
      if (inviteCreated) {
        console.log('invite created in compl sign up');
        const created = new Date().toISOString();
        const invite = '';
        const data = { created, email, invite };
        // this.firestore.collection(collection).add(data);
        signupCompleted.next(true);
      } else {
        console.error('unable to complete sign up');
        signupCompleted.next(false);
      }
    });

    return signupCompleted.asObservable();
  }

  createInvite(email): Observable<boolean> {
    console.log('create invite called');

    const inviteCreated = new Subject<boolean>();

    const inviteCode = generate({
      length: 5,
      count: 1,
    })[0];

    const created = new Date().toISOString();

    this.checkIfInviteCodeExists(inviteCode).subscribe((inviteExists) => {
      console.log('invite exists is', inviteExists);
      if (!inviteExists) {
        const data = {
          inviteCode,
          registered: false,
          sendInvite: false,
          created,
        };
        try {
          this.firestore
            .collection('invites')
            .add(data)
            .then((ref) => console.log('ref is', ref)); // try passing ref in the invite created
          inviteCreated.next(true);
        } catch (error) {
          console.error(error);
          inviteCreated.next(false);
        }
      } else {
        console.error('invite code already exists');
        this.createInvite(email);
      }
    });

    return inviteCreated.asObservable();
  }

  checkIfInviteCodeExists(inviteCode): Observable<boolean> {
    console.log('called with', inviteCode);
    const inviteExists = new Subject<boolean>();

    this.firestore
      .collection('invites')
      .get()
      .subscribe((res) => {
        if (!res.empty) {
          console.log('inside check invite');
          res.docs.filter((doc) => doc.data().inviteCode === inviteCode).length
            ? inviteExists.next(true)
            : inviteExists.next(false);
        } else {
          inviteExists.next(false);
        }
      });

    return inviteExists.asObservable();
  }
}
