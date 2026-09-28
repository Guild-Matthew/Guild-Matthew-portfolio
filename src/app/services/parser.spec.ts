import { TestBed } from '@angular/core/testing';

import { Parser } from './parser';

describe('Parser', () => {
  let service: Parser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Parser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
