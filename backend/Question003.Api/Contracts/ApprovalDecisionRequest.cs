namespace Example.Com.InterviewQuestion003.Contracts;

public sealed class ApprovalDecisionRequest
{
    public int[] Ids { get; init; } = [];
    public string Status { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}
