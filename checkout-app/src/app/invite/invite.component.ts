import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit {
  constructor(private router: Router) {}

  inviteCode = new FormControl();

  ngOnInit(): void {}

  next(): void {
    this.router.navigate(['register', { inviteCode: this.inviteCode.value }]);
  }
}
