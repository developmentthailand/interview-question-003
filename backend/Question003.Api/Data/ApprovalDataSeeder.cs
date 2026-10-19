using Example.Com.InterviewQuestion003.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion003.Data;

public static class ApprovalDataSeeder
{
    public static async Task SeedAsync(ApprovalDbContext database, CancellationToken cancellationToken = default)
    {
        if (await database.Documents.AnyAsync(cancellationToken)) return;

        var submittedAt = DateTimeOffset.UtcNow;
        database.Documents.AddRange(
            new ApprovalDocument { DocumentNo = "APR-2026-001", Title = "Office equipment purchase", Status = ApprovalStatus.Pending, SubmittedAtUtc = submittedAt.AddDays(-1) },
            new ApprovalDocument { DocumentNo = "APR-2026-002", Title = "Quarterly travel expense", Status = ApprovalStatus.Approved, DecisionReason = "Receipt and budget verified", SubmittedAtUtc = submittedAt.AddDays(-3), DecidedAtUtc = submittedAt.AddDays(-2) },
            new ApprovalDocument { DocumentNo = "APR-2026-003", Title = "Workshop registration", Status = ApprovalStatus.Rejected, DecisionReason = "Outside the current training plan", SubmittedAtUtc = submittedAt.AddDays(-5), DecidedAtUtc = submittedAt.AddDays(-4) },
            new ApprovalDocument { DocumentNo = "APR-2026-004", Title = "Software renewal", Status = ApprovalStatus.Pending, SubmittedAtUtc = submittedAt.AddHours(-6) },
            new ApprovalDocument { DocumentNo = "APR-2026-005", Title = "Client site transport", Status = ApprovalStatus.Pending, SubmittedAtUtc = submittedAt.AddHours(-3) },
            new ApprovalDocument { DocumentNo = "APR-2026-006", Title = "Team lunch reimbursement", Status = ApprovalStatus.Approved, DecisionReason = "Within policy", SubmittedAtUtc = submittedAt.AddDays(-7), DecidedAtUtc = submittedAt.AddDays(-6) });
        await database.SaveChangesAsync(cancellationToken);
    }
}
