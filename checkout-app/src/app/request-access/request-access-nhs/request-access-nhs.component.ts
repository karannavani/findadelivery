import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-request-access-nhs',
  templateUrl: './request-access-nhs.component.html',
  styleUrls: ['./request-access-nhs.component.scss'],
})
export class RequestAccessNhsComponent implements OnInit {
  constructor() {}

  email = new FormControl('', [Validators.required, Validators.email]);
  error = null;

  ngOnInit(): void {}

  onSubmit(): void {
    if (!this.email.invalid && this.email.value.endsWith('nhs.uk')) {
      console.log('submitting...');
      this.error = null;
    } else if (!this.email.value.endsWith('nhs.uk')) {
      this.error = 'Please enter an email ending with "@nhs.uk"';
    } else {
      this.error = 'Please enter a valid email address';
    }
  }
}
