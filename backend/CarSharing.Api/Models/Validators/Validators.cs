using CarSharing.Api.Models.Dtos;
using FluentValidation;

namespace CarSharing.Api.Models.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DateOfBirth).NotEmpty()
            .LessThan(DateTimeOffset.UtcNow.AddYears(-21))
            .WithMessage("You must be at least 21 years old to register.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(128);
    }
}

public class CreateCarRequestValidator : AbstractValidator<CreateCarRequest>
{
    public CreateCarRequestValidator()
    {
        RuleFor(x => x.Make).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Model).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Year).InclusiveBetween(1990, DateTime.UtcNow.Year + 2);
        RuleFor(x => x.Vin).MaximumLength(17).Matches("^[A-HJ-NPR-Z0-9]{17}$")
            .When(x => !string.IsNullOrEmpty(x.Vin))
            .WithMessage("VIN must be exactly 17 alphanumeric characters (excluding I, O, Q).");
        RuleFor(x => x.Seats).InclusiveBetween(1, 15);
        RuleFor(x => x.Doors).InclusiveBetween(1, 6);
        RuleFor(x => x.DailyPriceUsd).GreaterThan(0).LessThanOrEqualTo(9999);
        RuleFor(x => x.WeeklyDiscountPercent).InclusiveBetween(0, 30);
        RuleFor(x => x.MonthlyDiscountPercent).InclusiveBetween(0, 50);
        RuleFor(x => x.CleaningFeeUsd).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SecurityDepositUsd).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MinTripDays).InclusiveBetween(1, 365);
        RuleFor(x => x.MaxTripDays).InclusiveBetween(1, 365);
        RuleFor(x => x.City).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Rules).MaximumLength(1000);
    }
}

public class QuoteRequestValidator : AbstractValidator<QuoteRequest>
{
    public QuoteRequestValidator()
    {
        RuleFor(x => x.CarId).NotEmpty();
        RuleFor(x => x.StartUtc).NotEmpty().GreaterThan(DateTimeOffset.UtcNow.AddHours(-1));
        RuleFor(x => x.EndUtc).NotEmpty().GreaterThan(x => x.StartUtc);
    }
}

public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(x => x.CarId).NotEmpty();
        RuleFor(x => x.StartUtc).NotEmpty();
        RuleFor(x => x.EndUtc).NotEmpty().GreaterThan(x => x.StartUtc);
        RuleFor(x => x.GuestMessage).MaximumLength(1000);
    }
}

public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.CleanlinessRating).InclusiveBetween(1, 5).When(x => x.CleanlinessRating.HasValue);
        RuleFor(x => x.CommunicationRating).InclusiveBetween(1, 5).When(x => x.CommunicationRating.HasValue);
        RuleFor(x => x.AccuracyRating).InclusiveBetween(1, 5).When(x => x.AccuracyRating.HasValue);
        RuleFor(x => x.Comment).NotEmpty().MinimumLength(10).MaximumLength(1000);
    }
}

public class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
{
    public SendMessageRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100).When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(100).When(x => x.LastName != null);
        RuleFor(x => x.Bio).MaximumLength(500).When(x => x.Bio != null);
    }
}

public class BlockDatesRequestValidator : AbstractValidator<BlockDatesRequest>
{
    public BlockDatesRequestValidator()
    {
        RuleFor(x => x.StartUtc).NotEmpty();
        RuleFor(x => x.EndUtc).NotEmpty().GreaterThan(x => x.StartUtc);
    }
}
