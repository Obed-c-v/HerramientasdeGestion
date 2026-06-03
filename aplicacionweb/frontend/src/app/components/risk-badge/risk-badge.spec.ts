import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskBadge } from './risk-badge';

describe('RiskBadge', () => {
  let component: RiskBadge;
  let fixture: ComponentFixture<RiskBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskBadge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskBadge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
