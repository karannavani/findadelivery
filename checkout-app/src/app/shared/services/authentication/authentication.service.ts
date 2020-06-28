import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { reduce } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  userDetails = null;

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

  // Sign in with Google
  GoogleAuth(inviteCode?: string) {
    return this.AuthLogin(new auth.GoogleAuthProvider(), inviteCode);
  }

  // Auth logic to run auth providers
  AuthLogin(provider, inviteCode?: string) {
    return this.afAuth
      .setPersistence(auth.Auth.Persistence.LOCAL)
      .then(() => {
        this.afAuth
          .signInWithPopup(provider)
          .then((result) => {
            this.userDetails = result.user;
            this.handleInviteCode(inviteCode);
            this.checkIfUserExists(this.userDetails.uid);
            this.router.navigate(['dashboard']);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('Error', errorCode, errorMessage);
      });
  }

  getUserId() {
    return this.userDetails.uid;
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
    if (inviteCode) {
      this.firestore
        .collection('invites', (ref) =>
          ref.where('inviteCode', '==', inviteCode)
        )
        .get()
        .subscribe((snapshot) => {
          this.firestore
            .doc(`invites/${snapshot.docs[0].id}`)
            .update({ registered: true });
        });
    }
  }

  checkIfUserExists(id: string) {
    this.firestore
      .doc(`users/${id}`)
      .get()
      .subscribe((res) => {
        if (!res.exists) {
          this.firestore.collection('users').doc(id).set({
            userId: this.getUserId(),
            displayName: this.userDetails.displayName,
            email: this.userDetails.email,
          });
        }
      });
  }
}
