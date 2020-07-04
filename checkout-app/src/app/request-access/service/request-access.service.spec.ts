import { TestBed } from '@angular/core/testing';

import { RequestAccessService } from './request-access.service';

describe('RequestAccessService', () => {
  let service: RequestAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
