import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-request-access-general',
  templateUrl: './request-access-general.component.html',
  styleUrls: ['./request-access-general.component.scss'],
})
export class RequestAccessGeneralComponent implements OnInit {
  constructor() {}

  email = new FormControl('', [Validators.required, Validators.email]);
  error = null;

  ngOnInit(): void {}

  onSubmit(): void {
    if (!this.email.invalid) {
      console.log('submitting...');
      this.error = null;
    } else {
      this.error = 'Please enter a valid email address';
    }
  }
}
