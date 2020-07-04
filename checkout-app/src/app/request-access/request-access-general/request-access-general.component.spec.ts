import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestAccessGeneralComponent } from './request-access-general.component';

describe('RequestAccessGeneralComponent', () => {
  let component: RequestAccessGeneralComponent;
  let fixture: ComponentFixture<RequestAccessGeneralComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestAccessGeneralComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestAccessGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
