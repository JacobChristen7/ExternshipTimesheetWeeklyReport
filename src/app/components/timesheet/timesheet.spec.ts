import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Timesheet } from './timesheet';

describe('Timesheet', () => {
  let component: Timesheet;
  let fixture: ComponentFixture<Timesheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Timesheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Timesheet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
