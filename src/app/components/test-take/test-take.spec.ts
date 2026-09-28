import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTake } from './test-take';

describe('TestTake', () => {
  let component: TestTake;
  let fixture: ComponentFixture<TestTake>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestTake],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTake);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
