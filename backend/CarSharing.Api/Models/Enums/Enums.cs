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
    PlugInHybrid,
    CNG
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

public enum MessageType
{
    Text = 0,
    Image = 1,
    BookingCard = 2,
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
    General,
    // Host-specific
    HostOnboardingStepCompleted,
    ListingSubmitted,
    ListingMoreInfoNeeded,
    NewBookingRequest,
    BookingUpcoming24h,
    GuestCheckedIn,
    GuestCheckedOut,
    HostPayoutFailed,
    InsuranceExpiring,
    TechnicalInspectionExpiring,
    // Payment-specific
    PaymentSucceeded,
    PaymentFailed,
    BalanceCredited,
    BalanceDebited,
    RefundIssued,
    CardAdded
}

// === Payment Enums ===

public enum PaymentMethodType
{
    VisaMasterCard,
    UzcardCard,
    HumoCard,
    Payme,
    Click,
    BankAccount
}

public enum PaymentMethodBrand
{
    Visa,
    Mastercard,
    Uzcard,
    Humo,
    Unknown
}

public enum PaymentStatus
{
    Pending,
    Authorized,
    Captured,
    Failed,
    Refunded,
    PartiallyRefunded
}

public enum PaymentMethod
{
    AccountBalance,
    Card
}

public enum LedgerDirection
{
    Credit,
    Debit
}

public enum LedgerEntryType
{
    TopUp,
    BookingHold,
    BookingHoldRelease,
    BookingCapture,
    RefundCredit,
    PayoutDebit,
    AdjustmentCredit,
    AdjustmentDebit,
    HostEarning
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

public enum ProfileCompletionStatus
{
    Step1Done,
    EmailVerified,   // email confirmed, wizard not yet continued
    Step2Done,
    Step3Done,
    Step4Done,
    Complete,
    Rejected
}

public enum IdentityDocumentType
{
    None,
    Passport,
    NationalId
}

public enum HostOnboardingStatus
{
    NotStarted,
    IdentityConfirmed,
    PayoutAdded,
    AgreementSigned,
    Complete
}

public enum PayoutMethodType
{
    UzcardCard,
    HumoCard,
    VisaMasterCard,
    BankAccountUZS,
    BankAccountUSD
}

public enum VehicleTier
{
    Economy,
    Standard,
    Premium,
    Luxury
}

public enum OwnershipRelation
{
    RegisteredOwner,
    LeasedFinanced,
    CompanyVehicle
}

public enum CarDraftStep
{
    VehicleIdentity,
    OwnershipDocs,
    Photos,
    LocationAvailability,
    PricingRules,
    ReviewSubmit
}
