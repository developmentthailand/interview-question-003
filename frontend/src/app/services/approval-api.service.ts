import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type ApprovalDecision = Extract<ApprovalStatus, 'Approved' | 'Rejected'>;

export interface ApprovalDocument {
  id: number;
  documentNo: string;
  title: string;
  status: ApprovalStatus;
  decisionReason: string | null;
  submittedAtUtc: string;
  decidedAtUtc: string | null;
}

export interface ApprovalDecisionRequest {
  ids: number[];
  status: ApprovalDecision;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<ApprovalDocument[]> {
    return this.http.get<ApprovalDocument[]>('/api/approvals');
  }

  decide(request: ApprovalDecisionRequest): Observable<ApprovalDocument[]> {
    return this.http.post<ApprovalDocument[]>('/api/approvals/decision', request);
  }
}
