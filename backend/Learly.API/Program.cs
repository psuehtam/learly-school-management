using Microsoft.EntityFrameworkCore;
using Learly.Application;
using Learly.Infrastructure;
using Learly.Infrastructure.Data;
using Learly.API.Configuration;

var builder = WebApplication.CreateBuilder(args);

if (string.Equals(builder.Environment.EnvironmentName, "Testing", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<LearlyDbContext>(options =>
        options.UseInMemoryDatabase("learly-tests"));
}
else
{
    builder.Services.AddLearlyDatabase(builder.Configuration);
}

builder.Services.AddLearlyRepositories();
builder.Services.AddLearlyApplication();

builder.AddApiSecurity();
builder.AddApiInfrastructure();

var app = builder.Build();
app.UseApiPipeline();
app.Run();

public partial class Program { }
