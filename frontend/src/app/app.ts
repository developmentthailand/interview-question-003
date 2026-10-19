import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApprovalApiService, ApprovalDecision, ApprovalDocument, ApprovalStatus } from './services/approval-api.service';

type StatusFilter = 'All' | ApprovalStatus;

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly api = inject(ApprovalApiService);
  protected readonly documents = signal<ApprovalDocument[]>([]);
  protected readonly selectedIds = signal<Set<number>>(new Set());
  protected readonly filter = signal<StatusFilter>('All');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly decision = signal<ApprovalDecision | null>(null);
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)],
  });
  protected readonly visibleDocuments = computed(() =>
    this.filter() === 'All' ? this.documents() : this.documents().filter((row) => row.status === this.filter()),
  );
  protected readonly pendingCount = computed(() => this.documents().filter((row) => row.status === 'Pending').length);
  protected readonly allVisiblePendingSelected = computed(() => {
    const pendingIds = this.visibleDocuments().filter((row) => row.status === 'Pending').map((row) => row.id);
    return pendingIds.length > 0 && pendingIds.every((id) => this.selectedIds().has(id));
  });

  constructor() {
    this.load();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.saving()) this.closeDecision();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.documents.set(rows),
        error: () => this.errorMessage.set('โหลดรายการไม่สำเร็จ ลองใหม่อีกครั้งได้'),
      });
  }

  protected countFor(status: StatusFilter): number {
    return status === 'All' ? this.documents().length : this.documents().filter((row) => row.status === status).length;
  }

  protected selectDocument(id: number, checked: boolean): void {
    const document = this.documents().find((row) => row.id === id);
    if (!document || document.status !== 'Pending') return;
    this.selectedIds.update((selected) => {
      const next = new Set(selected);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  protected selectAllVisible(checked: boolean): void {
    const next = new Set(this.selectedIds());
    for (const row of this.visibleDocuments()) {
      if (row.status === 'Pending') checked ? next.add(row.id) : next.delete(row.id);
    }
    this.selectedIds.set(next);
  }

  protected openDecision(status: ApprovalDecision): void {
    if (this.selectedIds().size === 0) return;
    this.reason.reset('');
    this.errorMessage.set(null);
    this.decision.set(status);
  }

  protected closeDecision(): void {
    if (this.saving()) return;
    this.decision.set(null);
    this.reason.reset('');
  }

  protected confirmDecision(): void {
    if (this.saving() || !this.decision() || this.reason.invalid || this.selectedIds().size === 0) {
      this.reason.markAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api
      .decide({
        ids: [...this.selectedIds()].sort((left, right) => left - right),
        status: this.decision()!,
        reason: this.reason.value.trim(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          const updatedById = new Map(updated.map((row) => [row.id, row]));
          this.documents.update((rows) => rows.map((row) => updatedById.get(row.id) ?? row));
          this.selectedIds.set(new Set());
          this.decision.set(null);
          this.reason.reset('');
        },
        error: (error: unknown) => {
          const status = (error as { status?: number } | null)?.status;
          this.errorMessage.set(
            status === 409
              ? 'มีรายการถูกดำเนินการไปแล้ว โหลดข้อมูลล่าสุดก่อนลองอีกครั้ง'
              : 'บันทึกผลการพิจารณาไม่สำเร็จ ลองอีกครั้งได้',
          );
        },
      });
  }

  protected statusLabel(status: ApprovalStatus): string {
    switch (status) {
      case 'Pending': return 'รออนุมัติ';
      case 'Approved': return 'อนุมัติแล้ว';
      case 'Rejected': return 'ไม่อนุมัติ';
    }
  }
}
