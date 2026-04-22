using System.Text;
using System.Threading.RateLimiting;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Mapping;
using Npgsql;
using CarSharing.Api.Services.Auth;
using CarSharing.Api.Services.Background;
using CarSharing.Api.Services.Bookings;
using CarSharing.Api.Services.Cars;
using CarSharing.Api.Services.Email;
using CarSharing.Api.Services.Geocoding;
using CarSharing.Api.Services.Messaging;
using CarSharing.Api.Services.Notifications;
using CarSharing.Api.Services.Payments;
using CarSharing.Api.Services.Reviews;
using CarSharing.Api.Services.Uploads;
using CarSharing.Api.Services.Audit;
using CarSharing.Api.Services.Disputes;
using CarSharing.Api.Services.Verification;
using StackExchange.Redis;
using CarSharing.Api.Services.Host;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace CarSharing.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection")!;
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        dataSourceBuilder.UseNetTopologySuite();
        var dataSource = dataSourceBuilder.Build();

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(
                dataSource,
                npgsql =>
                {
                    npgsql.UseNetTopologySuite();
                    npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                });
        });

        return services;
    }

    public static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var secret = config["JWT:Secret"]
            ?? throw new InvalidOperationException("JWT:Secret is not configured.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = config["JWT:Issuer"],
                ValidAudience = config["JWT:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ClockSkew = TimeSpan.Zero
            };

            // Allow SignalR to receive token from query string
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "CarSharing API",
                Version = "v1",
                Description = "Peer-to-peer car rental marketplace API"
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter 'Bearer {token}'"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
    {
        // Auth
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IEmailVerificationService, EmailVerificationService>();

        // Redis (used for rate limiting in EmailVerificationService)
        var redisConn = config.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(redisConn));

        // Cars
        services.AddScoped<ICarService, CarService>();
        services.AddScoped<ICarSearchService, CarSearchService>();

        // Bookings
        services.AddScoped<IPricingService, PricingService>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IBookingService, BookingService>();

        // Reviews
        services.AddScoped<IReviewService, ReviewService>();

        // Messaging
        services.AddScoped<IMessageService, MessageService>();

        // Notifications
        services.AddScoped<INotificationService, NotificationService>();

        // Email
        services.AddScoped<IEmailService, SmtpEmailService>();

        // Payments — Replace with StripePaymentService when going live.
        services.AddScoped<IPaymentService, FakePaymentService>();

        // Verification / KYC
        services.AddScoped<IKycService, KycService>();

        // Audit
        services.AddScoped<IAuditService, AuditService>();

        // Disputes
        services.AddScoped<IDisputeService, DisputeService>();

        // Geocoding
        services.AddHttpClient<IGeocodingService, NominatimGeocodingService>();

        // Photo storage
        var cloudName = config["Cloudinary:CloudName"];
        if (!string.IsNullOrWhiteSpace(cloudName))
        {
            services.AddScoped<IPhotoStorage, CloudinaryPhotoStorage>();
        }
        else
        {
            services.AddScoped<IPhotoStorage, LocalDiskPhotoStorage>();
        }

        // Background jobs
        services.AddScoped<BookingExpiryJob>();
        services.AddScoped<PayoutJob>();
        services.AddScoped<ReviewReminderJob>();
        services.AddScoped<HostOnboardingReminderJob>();

        // Host services
        services.AddScoped<IHostEligibilityService, HostEligibilityService>();
        services.AddScoped<IListingReviewService, ListingReviewService>();

        // AutoMapper
        services.AddAutoMapper(typeof(MappingProfile));

        // FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<Program>();

        return services;
    }

    public static IServiceCollection AddHangfireServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddHangfire(configuration =>
        {
            configuration
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(options =>
                {
                    options.UseNpgsqlConnection(config.GetConnectionString("DefaultConnection")!);
                });
        });

        services.AddHangfireServer();

        return services;
    }

    public static IServiceCollection AddRateLimitingPolicies(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;

            options.AddFixedWindowLimiter("auth", limiter =>
            {
                limiter.PermitLimit = 5;
                limiter.Window = TimeSpan.FromMinutes(1);
            });

            options.AddFixedWindowLimiter("search", limiter =>
            {
                limiter.PermitLimit = 60;
                limiter.Window = TimeSpan.FromMinutes(1);
            });

            options.AddFixedWindowLimiter("default", limiter =>
            {
                limiter.PermitLimit = 120;
                limiter.Window = TimeSpan.FromMinutes(1);
            });
        });

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration config)
    {
        var origins = config["App:CorsOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries)
            ?? new[] { "http://localhost:3000" };

        services.AddCors(options =>
        {
            options.AddPolicy("Default", builder =>
            {
                builder
                    .WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
