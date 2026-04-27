using Learly.Application;
using Learly.Infrastructure;
using Learly.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddLearlyDatabase(builder.Configuration);
builder.Services.AddLearlyRepositories();
builder.Services.AddLearlyApplication();

builder.Services.AddHostedService<EscolasListagemHostedService>();

var host = builder.Build();
await host.RunAsync();
