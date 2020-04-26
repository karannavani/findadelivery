import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsdaDeliveryComponent } from './asda-delivery.component';

describe('AsdaDeliveryComponent', () => {
  let component: AsdaDeliveryComponent;
  let fixture: ComponentFixture<AsdaDeliveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AsdaDeliveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsdaDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
