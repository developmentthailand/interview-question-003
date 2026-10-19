using System.Net;
using System.Net.Http.Json;
using Example.Com.InterviewQuestion003.Contracts;

namespace Example.Com.InterviewQuestion003.Tests;

public sealed class ApprovalApiTests
{
    [Fact]
    public async Task List_returns_mock_documents_across_all_three_statuses()
    {
        using var factory = new ApprovalApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/approvals");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Content.ReadFromJsonAsync<List<ApprovalDocumentResponse>>();
        Assert.NotNull(rows);
        Assert.NotEmpty(rows);
        Assert.Contains(rows, static row => row.Status == "Pending");
        Assert.Contains(rows, static row => row.Status == "Approved");
        Assert.Contains(rows, static row => row.Status == "Rejected");
    }

    [Fact]
    public async Task Decision_updates_only_pending_documents_and_records_a_reason()
    {
        using var factory = new ApprovalApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/approvals/decision", new
        {
            ids = new[] { 1 },
            status = "Approved",
            reason = "Verified supporting documents"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Content.ReadFromJsonAsync<List<ApprovalDocumentResponse>>();
        Assert.NotNull(rows);
        Assert.Single(rows);
        Assert.Equal("Approved", rows[0].Status);
        Assert.Equal("Verified supporting documents", rows[0].DecisionReason);
        Assert.NotNull(rows[0].DecidedAtUtc);
    }

    [Fact]
    public async Task Decision_rejects_blank_reasons_and_non_pending_documents()
    {
        using var factory = new ApprovalApiFactory();
        using var client = factory.CreateClient();

        using var blankReason = await client.PostAsJsonAsync("/api/approvals/decision", new
        {
            ids = new[] { 1 }, status = "Rejected", reason = "   "
        });
        using var alreadyApproved = await client.PostAsJsonAsync("/api/approvals/decision", new
        {
            ids = new[] { 2 }, status = "Approved", reason = "Try to approve again"
        });

        Assert.Equal(HttpStatusCode.BadRequest, blankReason.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, alreadyApproved.StatusCode);
    }
}
