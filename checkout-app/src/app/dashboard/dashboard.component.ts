import { Component, OnInit } from '@angular/core';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private schedulingService: SchedulingService, private authenticationService: AuthenticationService) { }

  ngOnInit(): void { }

  scheduleJob(store) {
    this.schedulingService.createJob(store);
  }

}
