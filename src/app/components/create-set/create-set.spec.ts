import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSet } from './create-set';

describe('CreateSet', () => {
  let component: CreateSet;
  let fixture: ComponentFixture<CreateSet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateSet],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
