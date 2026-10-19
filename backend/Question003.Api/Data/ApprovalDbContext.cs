using Example.Com.InterviewQuestion003.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion003.Data;

public sealed class ApprovalDbContext(DbContextOptions<ApprovalDbContext> options) : DbContext(options)
{
    public DbSet<ApprovalDocument> Documents => Set<ApprovalDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var document = modelBuilder.Entity<ApprovalDocument>();
        document.ToTable("ApprovalDocuments");
        document.HasKey(static item => item.Id);
        document.HasIndex(static item => item.DocumentNo).IsUnique();
        document.Property(static item => item.DocumentNo).HasMaxLength(30).IsRequired();
        document.Property(static item => item.Title).HasMaxLength(160).IsRequired();
        document.Property(static item => item.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
        document.Property(static item => item.DecisionReason).HasMaxLength(500);
    }
}
