import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase';
import { Router } from '@angular/router';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  userDetails = null;
  private registerError = new Subject<string>();
  private inviteError = new Subject<string>();

  constructor(
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    private firestore: AngularFirestore,
    public router: Router
  ) {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.userDetails = user;
      }
    });
  }

  // Sign up with email/password
  async SignUp(
    email: string,
    password,
    displayName: string,
    inviteCode: string
  ) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      result.user.updateProfile({ displayName }).then(() => {
        this.userDetails = result.user;
        this.checkIfUserExists(this.userDetails.uid, inviteCode);
      });
    } catch (error) {
      this.registerError.next(error);
    }
  }

  // Sign in with email/password
  async SignIn(email, password) {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['dashboard']);
    } catch (error) {
      this.registerError.next(error);
    }
  }

  // Sign in with Google
  GoogleAuth(inviteCode?: string) {
    return this.AuthLogin(new auth.GoogleAuthProvider(), inviteCode);
  }

  // Auth logic to run auth providers
  AuthLogin(provider, inviteCode?: string) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.userDetails = result.user;
        this.checkIfUserExists(this.userDetails.uid, inviteCode);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserId() {
    return this.userDetails.uid;
  }

  getRegisterError() {
    return this.registerError.asObservable();
  }

  isAuthenticated() {
    return this.afAuth.authState;
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['login']);
    });
  }

  handleInviteCode(inviteCode: string) {
    const registeredBy = this.firestore
      .collection('users')
      .doc(this.userDetails.uid).ref;

    this.firestore
      .collection('invites', (ref) => ref.where('inviteCode', '==', inviteCode))
      .get()
      .subscribe((snapshot) => {
        if (!snapshot.empty) {
          this.firestore
            .doc(`invites/${snapshot.docs[0].id}`)
            .update({
              registered: true,
              registeredBy,
            })
            .then(() => this.addMemberType(snapshot.docs[0].ref));
        }
      });
  }

  addMemberType(inviteRef: DocumentReference) {
    this.firestore
      .doc(inviteRef)
      .get()
      .pipe(
        map((doc) => doc.data().collection),
        map((collection) => {
          const userType = collection === 'nhsSignups' ? 'nhs' : 'general';
          this.firestore
            .doc(`users/${this.userDetails.uid}`)
            .update({ userType });
        })
      )
      .subscribe();
  }

  checkIfUserExists(id: string, inviteCode?: string) {
    this.firestore
      .doc(`users/${id}`)
      .get()
      .subscribe((doc) => {
        if (!doc.exists && inviteCode) {
          const created = new Date().toISOString();

          this.firestore
            .collection('users')
            .doc(id)
            .set({
              created,
              userId: this.getUserId(),
              displayName: this.userDetails.displayName,
              email: this.userDetails.email,
            })
            .then(() => {
              this.handleInviteCode(inviteCode);
              this.handleLogin();
            });
        } else if (doc.exists) {
          this.handleLogin();
        } else {
          this.afAuth.signOut();
          this.afAuth.currentUser.then((user) => user.delete());
          this.registerError.next(
            'Sorry, this email was not found in our records. Contact us at support@findadelivery.com for help.'
          );
        }
      });
  }

  handleLogin() {
    this.afAuth
      .setPersistence(auth.Auth.Persistence.LOCAL)
      .then(() => {
        this.router.navigate(['dashboard']);
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('Error', errorCode, errorMessage);
      });
  }

  validateInviteCode(inviteCode: string) {
    this.firestore
      .collection('invites', (ref) => ref.where('inviteCode', '==', inviteCode))
      .get()
      .subscribe((doc) => {
        if (doc.empty) {
          this.inviteError.next('This code is not valid');
        } else if (doc.docs[0].data().registered) {
          this.inviteError.next('This code has already been used');
        } else {
          this.inviteError.next(null);
        }
      });
  }

  getInviteError() {
    return this.inviteError.asObservable();
  }
}
