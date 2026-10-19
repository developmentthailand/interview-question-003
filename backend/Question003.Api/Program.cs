using Example.Com.InterviewQuestion003.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddDbContext<ApprovalDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Approvals") ?? "Data Source=approvals.db"));
builder.Services.AddOpenApi();

var app = builder.Build();
await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApprovalDbContext>();
    await database.Database.EnsureCreatedAsync();
    await ApprovalDataSeeder.SeedAsync(database);
}

if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
