import { TestBed } from '@angular/core/testing';

import { ModalService } from './modal';

describe('ModalServiceService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
