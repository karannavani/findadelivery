import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestAccessNhsComponent } from './request-access-nhs.component';

describe('RequestAccessNhsComponent', () => {
  let component: RequestAccessNhsComponent;
  let fixture: ComponentFixture<RequestAccessNhsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestAccessNhsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestAccessNhsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
