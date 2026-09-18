import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Match } from './match';

describe('Match', () => {
  let component: Match;
  let fixture: ComponentFixture<Match>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Match],
    }).compileComponents();

    fixture = TestBed.createComponent(Match);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
