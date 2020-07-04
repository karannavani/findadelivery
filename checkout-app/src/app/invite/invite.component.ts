import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit {
  constructor(private router: Router, private firestore: AngularFirestore) {}

  inviteCode = new FormControl();
  error = null;

  ngOnInit(): void {}

  next(): void {
    this.firestore
      .collection('invites', (ref) =>
        ref.where('inviteCode', '==', this.inviteCode.value)
      )
      .get()
      .subscribe((doc) => {
        if (doc.empty) {
          this.error = 'This code is not valid';
        } else if (doc.docs[0].data().registered) {
          this.error = 'This code has already been used';
        } else {
          this.router.navigate([
            'register',
            { inviteCode: this.inviteCode.value },
          ]);
        }
      });
  }
}
