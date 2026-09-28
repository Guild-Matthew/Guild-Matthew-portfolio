import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestSetup } from './test-setup';

describe('TestSetup', () => {
  let component: TestSetup;
  let fixture: ComponentFixture<TestSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(TestSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
