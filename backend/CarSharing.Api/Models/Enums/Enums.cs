namespace CarSharing.Api.Models.Enums;

public enum BodyType
{
    Sedan,
    SUV,
    Hatchback,
    Coupe,
    Convertible,
    Truck,
    Van,
    Minivan,
    Wagon,
    SportsCar
}

public enum Transmission
{
    Automatic,
    Manual
}

public enum FuelType
{
    Gasoline,
    Diesel,
    Hybrid,
    Electric,
    PlugInHybrid
}

public enum CarStatus
{
    Draft,
    PendingApproval,
    Listed,
    Snoozed,
    Removed
}

public enum BookingStatus
{
    PendingApproval,
    Confirmed,
    Rejected,
    CancelledByGuest,
    CancelledByHost,
    InProgress,
    Completed,
    Disputed
}

public enum AvailabilityReason
{
    HostBlock,
    Booking,
    Maintenance
}

public enum ReviewAuthorRole
{
    Guest,
    Host
}

public enum NotificationType
{
    BookingRequested,
    BookingConfirmed,
    BookingRejected,
    BookingCancelled,
    BookingCheckIn,
    BookingCheckOut,
    BookingCompleted,
    ReviewReceived,
    NewMessage,
    PayoutProcessed,
    ListingApproved,
    ListingRejected,
    General
}

public enum PayoutStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

public enum KycStatus
{
    Pending,
    InReview,
    Approved,
    Rejected,
    Expired
}

public enum KycDocumentType
{
    Passport,
    DriverLicense,
    NationalId
}

public enum DisputeStatus
{
    Open,
    InReview,
    Resolved,
    Escalated,
    Closed
}

public enum DisputeCategory
{
    VehicleDamage,
    CleanlinessIssue,
    LateFee,
    WrongVehicle,
    CancellationDispute,
    SafetyIssue,
    Other
}
