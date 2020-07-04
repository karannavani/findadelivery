import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
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
    this.createInvite(email).subscribe((inviteCreated) => {
      if (inviteCreated) {
        const created = new Date().toISOString();
        const invite = inviteCreated;
        const data = { created, email, invite };
        this.firestore.collection(collection).add(data);
        signupCompleted.next(true);
      } else {
        console.error('unable to complete sign up');
        signupCompleted.next(false);
      }
    });

    return signupCompleted.asObservable();
  }

  createInvite(email: string): Observable<DocumentReference | boolean> {
    const inviteCreated = new Subject<DocumentReference | boolean>();

    const inviteCode = generate({
      length: 5,
      count: 1,
    })[0];

    const created = new Date().toISOString();

    this.checkIfInviteCodeExists(inviteCode).subscribe((inviteExists) => {
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
            .then((ref) => {
              inviteCreated.next(ref);
            });
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
    const inviteExists = new Subject<boolean>();

    this.firestore
      .collection('invites')
      .get()
      .subscribe((res) => {
        if (!res.empty) {
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
