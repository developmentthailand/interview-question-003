namespace Example.Com.InterviewQuestion003.Contracts;

public sealed record ApprovalDocumentResponse(
    int Id,
    string DocumentNo,
    string Title,
    string Status,
    string? DecisionReason,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? DecidedAtUtc);
