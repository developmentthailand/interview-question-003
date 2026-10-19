namespace Example.Com.InterviewQuestion003.Entities;

public enum ApprovalStatus
{
    Pending,
    Approved,
    Rejected
}

public sealed class ApprovalDocument
{
    public int Id { get; set; }
    public required string DocumentNo { get; set; }
    public required string Title { get; set; }
    public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
    public string? DecisionReason { get; set; }
    public DateTimeOffset SubmittedAtUtc { get; set; }
    public DateTimeOffset? DecidedAtUtc { get; set; }
}
