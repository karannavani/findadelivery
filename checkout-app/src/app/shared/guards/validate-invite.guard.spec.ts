import { TestBed } from '@angular/core/testing';

import { ValidateInviteGuard } from './validate-invite.guard';

describe('ValidateInviteGuard', () => {
  let guard: ValidateInviteGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ValidateInviteGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
