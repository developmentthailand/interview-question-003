import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { appConfig } from './app.config';
import { ApprovalDocument } from './services/approval-api.service';

const documents: ApprovalDocument[] = [
  { id: 1, documentNo: 'APR-2026-001', title: 'Office equipment purchase', status: 'Pending', decisionReason: null, submittedAtUtc: '2026-10-19T10:00:00Z', decidedAtUtc: null },
  { id: 2, documentNo: 'APR-2026-002', title: 'Quarterly travel expense', status: 'Approved', decisionReason: 'Verified', submittedAtUtc: '2026-10-18T10:00:00Z', decidedAtUtc: '2026-10-19T10:00:00Z' },
  { id: 3, documentNo: 'APR-2026-003', title: 'Workshop registration', status: 'Rejected', decisionReason: 'Out of plan', submittedAtUtc: '2026-10-17T10:00:00Z', decidedAtUtc: '2026-10-18T10:00:00Z' },
];

describe('Approval workspace', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...(appConfig.providers ?? []), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads all statuses and prevents selecting completed documents', () => {
    const fixture = createLoadedWorkspace();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Office equipment purchase');
    expect(root.textContent).toContain('รออนุมัติ');
    expect(root.textContent).toContain('อนุมัติแล้ว');
    expect(root.textContent).toContain('ไม่อนุมัติ');
    expect(checkbox(root, 1).disabled).toBe(false);
    expect(checkbox(root, 2).disabled).toBe(true);
    expect(checkbox(root, 3).disabled).toBe(true);
  });

  it('records a reason and updates a selected pending row after approval', () => {
    const fixture = createLoadedWorkspace();
    const root = fixture.nativeElement as HTMLElement;
    choose(checkbox(root, 1));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.approve-button')!.click();
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).not.toBeNull();
    const reason = root.querySelector<HTMLTextAreaElement>('#decision-reason');
    expect(reason).not.toBeNull();
    reason!.value = 'Verified purchase and budget';
    reason!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.modal-confirm')!.click();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/approvals/decision');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      ids: [1],
      status: 'Approved',
      reason: 'Verified purchase and budget',
    });
    request.flush([{ ...documents[0], status: 'Approved', decisionReason: 'Verified purchase and budget', decidedAtUtc: '2026-10-20T01:00:00Z' }]);
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).toBeNull();
    expect(root.querySelector('[data-row-id="1"]')?.textContent).toContain('อนุมัติแล้ว');
    expect(root.querySelector('.selection-copy')?.textContent).toContain('0');
  });

  it('lets the reviewer cancel a decision without sending an update', () => {
    const fixture = createLoadedWorkspace();
    const root = fixture.nativeElement as HTMLElement;
    choose(checkbox(root, 1));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.reject-button')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.cancel-button')!.click();
    fixture.detectChanges();

    expect(root.querySelector('[role="dialog"]')).toBeNull();
    TestBed.inject(HttpTestingController).expectNone('/api/approvals/decision');
  });

  it('requires a non-blank reason before confirming', () => {
    const fixture = createLoadedWorkspace();
    const root = fixture.nativeElement as HTMLElement;
    choose(checkbox(root, 1));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.approve-button')!.click();
    fixture.detectChanges();

    expect(root.querySelector<HTMLButtonElement>('.modal-confirm')?.disabled).toBe(true);
    TestBed.inject(HttpTestingController).expectNone('/api/approvals/decision');
  });
});

function createLoadedWorkspace() {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  TestBed.inject(HttpTestingController).expectOne('/api/approvals').flush(documents);
  fixture.detectChanges();
  return fixture;
}

function checkbox(root: HTMLElement, id: number): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(`[data-row-id="${id}"] input[type="checkbox"]`);
  if (!input) throw new Error(`No selection checkbox for row ${id}.`);
  return input;
}

function choose(input: HTMLInputElement): void {
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

