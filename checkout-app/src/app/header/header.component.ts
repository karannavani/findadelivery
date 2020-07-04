import { Component, OnInit, Input, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';
import { Observable } from 'rxjs';
import { PageScrollService } from 'ngx-page-scroll-core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isAuthenticated$: any;

  constructor(
    private authenticationService: AuthenticationService,
    private pageScrollService: PageScrollService,
    private router: Router,

    @Inject(DOCUMENT) private document: any
  ) {}

  goToNextPage(buttonName: string): void {
    const homeRoute = '/home';
    const targetIds = {
      howItWorks: '#section-hiw',
      getInTouch: '#section-contact',
    };
    const currentlyOnHome = this.router.url.includes(homeRoute);
    const argsForScrollService = {
      duration: 300,
      document: this.document,
      scrollTarget: targetIds[buttonName],
      scrollOffset: buttonName === 'getInTouch' ? 60 : 0,
    };

    // Either navigate and scroll or just scroll
    if (!currentlyOnHome) {
      this.router
        .navigate([homeRoute])
        .then(() => this.pageScrollService.scroll(argsForScrollService));
    } else {
      this.pageScrollService.scroll(argsForScrollService);
    }
  }

  ngOnInit(): void {
    this.isAuthenticated$ = this.authenticationService.isAuthenticated();
  }

  signOut(): void {
    this.authenticationService.signOut();
  }
}
