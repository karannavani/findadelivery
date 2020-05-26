import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    private schedulingService: SchedulingService,
    private authenticationService: AuthenticationService,
    private titleService: Title
  ) { }

  ngOnInit(): void { }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  scheduleJob(store) {
    this.schedulingService.createJob(store);
  }

}
