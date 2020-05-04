import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isAuthenticated$: any;

  constructor(private authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authenticationService.isAuthenticated();
  }
}
