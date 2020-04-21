import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    public afAuth: AngularFireAuth // Inject Firebase auth service
  ) {}

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        console.log('You have been successfully logged in!', result);
        this.getUserDetails();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserDetails() {
    this.afAuth.user.subscribe((res) => console.log('user is', res));
  }
}
