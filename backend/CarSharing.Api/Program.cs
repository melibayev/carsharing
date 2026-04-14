using CarSharing.Api.Data.Seed;
using CarSharing.Api.Extensions;
using CarSharing.Api.Hubs;
using Hangfire;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/CarSharing-.log", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration)
            .WriteTo.Console()
            .WriteTo.File("logs/CarSharing-.log", rollingInterval: RollingInterval.Day));

    // DI registrations via extension methods
    builder.Services.AddDatabase(builder.Configuration);
    builder.Services.AddIdentityServices();
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddSwaggerDocumentation();
    builder.Services.AddApplicationServices(builder.Configuration);
    builder.Services.AddHangfireServices(builder.Configuration);
    builder.Services.AddRateLimitingPolicies();
    builder.Services.AddCorsPolicy(builder.Configuration);

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });

    builder.Services.AddSignalR();
    builder.Services.AddScoped<DatabaseSeeder>();

    var app = builder.Build();

    // Startup banner
    Log.Information("╔══════════════════════════════════════╗");
    Log.Information("║        CarSharing API  v1.0          ║");
    Log.Information("║  Peer-to-peer car rental marketplace ║");
    Log.Information("╚══════════════════════════════════════╝");

    // Middleware pipeline
    app.UseCustomMiddleware();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "CarSharing API v1"));
    }

    app.UseStaticFiles();
    app.UseCors("Default");
    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
    });

    app.MapControllers();
    app.MapHub<ChatHub>("/hubs/chat");
    app.MapHub<AdminHub>("/hubs/admin");
    app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTimeOffset.UtcNow }));

    // Startup tasks
    await app.RunMigrationsAsync();
    await app.RunSeederAsync();
    app.ConfigureHangfireJobs();

    Log.Information("CarSharing API is ready. Listening on {Urls}", string.Join(", ", app.Urls));
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
