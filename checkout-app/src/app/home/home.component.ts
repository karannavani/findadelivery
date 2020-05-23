import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  public onClickRegister(): void {
    console.log('Navigating to registration form...');
  }

  public onClickSignIn(): void {
    console.log('Navigating to registration form...');
  }

  ngOnInit(): void {
  }

}
