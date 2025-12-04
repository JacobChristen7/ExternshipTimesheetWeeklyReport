import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekCard } from './week-card';

describe('WeekCard', () => {
  let component: WeekCard;
  let fixture: ComponentFixture<WeekCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
