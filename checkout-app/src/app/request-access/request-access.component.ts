import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-request-access',
  templateUrl: './request-access.component.html',
  styleUrls: ['./request-access.component.scss'],
})
export class RequestAccessComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  selectedOption = '';

  ngOnInit(): void {
    this.checkRoute();
  }

  select(option): void {
    this.selectedOption = option;
    this.router.navigate([option], { relativeTo: this.route });
  }

  checkRoute(): void {
    const url = this.router.url.split('/');
    if (url.length > 2) {
      this.selectedOption = url[2];
    }
  }
}
