import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase';
import { Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  userDetails = null;

  constructor(
    public afAuth: AngularFireAuth // Inject Firebase auth service
  ) {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        console.log('there is a user', user);
        this.userDetails = user;
      } else {
        console.log('user is signed out');
        // User is signed out.
      }
    });
  }

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth
      .setPersistence(auth.Auth.Persistence.LOCAL)
      .then(() => {
        this.afAuth
          .signInWithPopup(provider)
          .then((result) => {
            console.log('You have been successfully logged in!', result);
            this.getUserDetails();
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

  getUserDetails() {
    this.afAuth.user.subscribe((res) => {
      this.userDetails = res;
    });
  }

  getUserId() {
    return this.userDetails.uid;
  }

  isAuthenticated() {
    return this.afAuth.authState;
  }
}
