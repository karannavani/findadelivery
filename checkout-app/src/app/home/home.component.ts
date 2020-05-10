import { Component, OnInit } from '@angular/core';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';
import { AuthenticationService } from '../shared/services/authentication/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private schedulingService: SchedulingService, private authenticationService: AuthenticationService) { }

  ngOnInit(): void { }

  scheduleJob(store) {
   this.schedulingService.createJob(store);
  }

}
