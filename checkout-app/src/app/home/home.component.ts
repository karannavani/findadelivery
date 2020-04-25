import { Component, OnInit } from '@angular/core';
import { SchedulingService } from '../shared/services/scheduling/scheduling.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private schedulingService: SchedulingService) { }

  ngOnInit(): void { }

  scheduleJob(store) {
   this.schedulingService.createJob(store);
   console.log('created job');
  }

}
