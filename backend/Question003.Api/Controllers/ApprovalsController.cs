using System.Data;
using Example.Com.InterviewQuestion003.Contracts;
using Example.Com.InterviewQuestion003.Data;
using Example.Com.InterviewQuestion003.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion003.Controllers;

[ApiController]
[Route("api/approvals")]
public sealed class ApprovalsController(ApprovalDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApprovalDocumentResponse>>> List(CancellationToken cancellationToken)
    {
        var documents = await database.Documents.AsNoTracking()
            .OrderBy(static document => document.Id)
            .Select(static document => ToResponse(document))
            .ToListAsync(cancellationToken);
        return Ok(documents);
    }

    [HttpPost("decision")]
    public async Task<ActionResult<IReadOnlyList<ApprovalDocumentResponse>>> Decide(
        ApprovalDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToArray();
        if (ids.Length == 0 || ids.Length > 100 || ids.Length != request.Ids.Length)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Select one or more documents." });
        }

        if (!Enum.TryParse<ApprovalStatus>(request.Status, ignoreCase: true, out var status) ||
            status is not (ApprovalStatus.Approved or ApprovalStatus.Rejected))
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Choose an approval or rejection decision." });
        }

        var reason = request.Reason.Trim();
        if (reason.Length is 0 or > 500)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Enter a reason of 1 to 500 characters." });
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var documents = await database.Documents.Where(document => ids.Contains(document.Id)).ToListAsync(cancellationToken);
        if (documents.Count != ids.Length || documents.Any(static document => document.Status != ApprovalStatus.Pending))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict(new ProblemDetails { Status = 409, Title = "One or more documents are no longer pending." });
        }

        var decidedAt = DateTimeOffset.UtcNow;
        foreach (var document in documents)
        {
            document.Status = status;
            document.DecisionReason = reason;
            document.DecidedAtUtc = decidedAt;
        }

        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(documents.OrderBy(static document => document.Id).Select(ToResponse).ToArray());
    }

    private static ApprovalDocumentResponse ToResponse(ApprovalDocument document) => new(
        document.Id,
        document.DocumentNo,
        document.Title,
        document.Status.ToString(),
        document.DecisionReason,
        document.SubmittedAtUtc,
        document.DecidedAtUtc);
}
