using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Notifications;
using CarSharing.Api.Services.Payments;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CarSharing.Api.Services.Bookings;

public class BookingService : IBookingService
{
    private readonly AppDbContext _db;
    private readonly IPricingService _pricingService;
    private readonly IAvailabilityService _availabilityService;
    private readonly IPaymentService _paymentService;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        AppDbContext db,
        IPricingService pricingService,
        IAvailabilityService availabilityService,
        IPaymentService paymentService,
        INotificationService notificationService,
        IMapper mapper,
        ILogger<BookingService> logger)
    {
        _db = db;
        _pricingService = pricingService;
        _availabilityService = availabilityService;
        _paymentService = paymentService;
        _notificationService = notificationService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<QuoteResponse> GetQuoteAsync(QuoteRequest request)
    {
        var car = await _db.Cars.FindAsync(request.CarId)
            ?? throw new KeyNotFoundException("Car not found.");

        return _pricingService.CalculateQuote(car, request.StartUtc, request.EndUtc);
    }

    public async Task<BookingDto> CreateAsync(CreateBookingRequest request, Guid guestId)
    {
        var car = await _db.Cars.Include(c => c.Photos).Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == request.CarId)
            ?? throw new KeyNotFoundException("Car not found.");

        var isAvailable = await _availabilityService.IsAvailableAsync(request.CarId, request.StartUtc, request.EndUtc, guestId);
        if (!isAvailable)
        {
            throw new InvalidOperationException("This car is not available for the selected dates.");
        }

        var quote = _pricingService.CalculateQuote(car, request.StartUtc, request.EndUtc);

        // Fake payment authorization
        var paymentId = await _paymentService.AuthorizeAsync(guestId, quote.TotalChargedUsd);

        var booking = new Booking
        {
            CarId = request.CarId,
            GuestId = guestId,
            StartUtc = request.StartUtc,
            EndUtc = request.EndUtc,
            Status = car.IsInstantBook ? BookingStatus.Confirmed : BookingStatus.PendingApproval,
            DailyRateUsd = quote.DailyRateUsd,
            Days = quote.Days,
            SubtotalUsd = quote.SubtotalUsd,
            CleaningFeeUsd = quote.CleaningFeeUsd,
            ServiceFeeUsd = quote.ServiceFeeUsd,
            TaxesUsd = quote.TaxesUsd,
            SecurityDepositHoldUsd = quote.SecurityDepositHoldUsd,
            TotalChargedUsd = quote.TotalChargedUsd,
            HostPayoutUsd = quote.HostPayoutUsd,
            GuestMessage = request.GuestMessage,
            PaymentIntentId = paymentId,
            ConfirmedAt = car.IsInstantBook ? DateTimeOffset.UtcNow : null
        };

        _db.Bookings.Add(booking);

        // Create availability block
        var availBlock = new Availability
        {
            CarId = request.CarId,
            StartUtc = request.StartUtc,
            EndUtc = request.EndUtc,
            Reason = AvailabilityReason.Booking,
            BookingId = booking.Id
        };
        _db.Availabilities.Add(availBlock);

        // Create conversation
        var conversation = new Conversation { BookingId = booking.Id };
        _db.Conversations.Add(conversation);

        await _db.SaveChangesAsync();

        // Look up System user for BookingCard message
        var systemUserId = new Guid("00000000-0000-0000-0000-000000000001");

        // Auto-send booking card as first message (system message)
        _db.Messages.Add(new Message
        {
            ConversationId = conversation.Id,
            SenderId = systemUserId,
            Type = MessageType.BookingCard,
            BookingId = booking.Id,
            SentAt = DateTimeOffset.UtcNow
        });

        // Guest's optional intro message
        if (!string.IsNullOrWhiteSpace(request.GuestMessage))
        {
            _db.Messages.Add(new Message
            {
                ConversationId = conversation.Id,
                SenderId = guestId,
                Body = request.GuestMessage,
                SentAt = DateTimeOffset.UtcNow.AddMilliseconds(50)
            });
        }
        await _db.SaveChangesAsync();

        // Notify host
        await _notificationService.CreateAsync(car.OwnerId, NotificationType.BookingRequested,
            "New Booking Request",
            $"You have a new booking request for your {car.Year} {car.Make} {car.Model}.",
            $"/host/bookings");

        _logger.LogInformation("Booking {BookingId} created for car {CarId} by guest {GuestId}", booking.Id, request.CarId, guestId);

        return await GetByIdAsync(booking.Id, guestId);
    }

    public async Task<BookingDto> GetByIdAsync(Guid bookingId, Guid callerId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car).ThenInclude(c => c.Photos)
            .Include(b => b.Car).ThenInclude(c => c.Owner)
            .Include(b => b.Guest)
            .Include(b => b.Reviews)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.GuestId != callerId && booking.Car.OwnerId != callerId)
        {
            throw new UnauthorizedAccessException("You do not have access to this booking.");
        }

        var dto = _mapper.Map<BookingDto>(booking);

        // Check if the caller can leave a review
        dto.CanReview = booking.Status == BookingStatus.Completed
            && booking.CompletedAt.HasValue
            && (DateTimeOffset.UtcNow - booking.CompletedAt.Value).TotalDays <= 14
            && !booking.Reviews.Any(r => r.AuthorId == callerId);

        return dto;
    }

    public async Task<PagedResult<BookingDto>> GetMyBookingsAsync(Guid userId, string? role, string? status, int page, int pageSize)
    {
        var query = _db.Bookings
            .Include(b => b.Car).ThenInclude(c => c.Photos)
            .Include(b => b.Car).ThenInclude(c => c.Owner)
            .Include(b => b.Guest)
            .Include(b => b.Reviews)
            .AsSplitQuery()
            .AsQueryable();

        if (role?.ToLower() == "host")
        {
            query = query.Where(b => b.Car.OwnerId == userId);
        }
        else
        {
            query = query.Where(b => b.GuestId == userId);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(b => b.Status == parsedStatus);
        }

        var totalCount = await query.CountAsync();

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = bookings.Select(b =>
        {
            var dto = _mapper.Map<BookingDto>(b);
            dto.CanReview = b.Status == BookingStatus.Completed
                && b.CompletedAt.HasValue
                && (DateTimeOffset.UtcNow - b.CompletedAt.Value).TotalDays <= 14
                && !b.Reviews.Any(r => r.AuthorId == userId);
            return dto;
        }).ToList();

        return new PagedResult<BookingDto>(items, totalCount, page, pageSize);
    }

    public async Task<BookingDto> ApproveAsync(Guid bookingId, Guid hostId)
    {
        var booking = await GetBookingForHostAsync(bookingId, hostId);

        if (booking.Status != BookingStatus.PendingApproval)
            throw new InvalidOperationException("Only pending bookings can be approved.");

        booking.Status = BookingStatus.Confirmed;
        booking.ConfirmedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(booking.GuestId, NotificationType.BookingConfirmed,
            "Booking Confirmed!",
            $"Your booking for {booking.Car.Year} {booking.Car.Make} {booking.Car.Model} has been confirmed.",
            $"/trips/{booking.Id}");

        return await GetByIdAsync(bookingId, hostId);
    }

    public async Task<BookingDto> RejectAsync(Guid bookingId, Guid hostId, string reason)
    {
        var booking = await GetBookingForHostAsync(bookingId, hostId);

        if (booking.Status != BookingStatus.PendingApproval)
            throw new InvalidOperationException("Only pending bookings can be rejected.");

        booking.Status = BookingStatus.Rejected;
        booking.HostResponseMessage = reason;

        // Release availability
        await ReleaseAvailabilityBlockAsync(booking.Id);

        // Refund
        if (booking.PaymentIntentId != null)
        {
            await _paymentService.RefundAsync(booking.PaymentIntentId, booking.TotalChargedUsd);
        }

        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(booking.GuestId, NotificationType.BookingRejected,
            "Booking Declined",
            $"Your booking request was declined. Reason: {reason}",
            $"/trips/{booking.Id}");

        return await GetByIdAsync(bookingId, hostId);
    }

    public async Task<BookingDto> CancelAsync(Guid bookingId, Guid callerId, string reason)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.GuestId != callerId && booking.Car.OwnerId != callerId)
            throw new UnauthorizedAccessException("Not authorized.");

        if (booking.Status != BookingStatus.PendingApproval &&
            booking.Status != BookingStatus.Confirmed &&
            booking.Status != BookingStatus.InProgress)
            throw new InvalidOperationException("This booking cannot be cancelled.");

        var isHost = booking.Car.OwnerId == callerId;
        booking.Status = isHost ? BookingStatus.CancelledByHost : BookingStatus.CancelledByGuest;
        booking.CancelledAt = DateTimeOffset.UtcNow;
        booking.CancellationReason = reason;

        // Release availability
        await ReleaseAvailabilityBlockAsync(booking.Id);

        // Calculate refund
        if (booking.PaymentIntentId != null)
        {
            var refundAmount = CalculateRefundAmount(booking, isHost);
            if (refundAmount > 0)
            {
                await _paymentService.RefundAsync(booking.PaymentIntentId, refundAmount);
            }
        }

        // Track host cancellation
        if (isHost)
        {
            var host = await _db.Users.FindAsync(callerId);
            if (host != null)
            {
                host.CancellationCount++;
            }
        }

        await _db.SaveChangesAsync();

        var notifyUserId = isHost ? booking.GuestId : booking.Car.OwnerId;
        await _notificationService.CreateAsync(notifyUserId, NotificationType.BookingCancelled,
            "Booking Cancelled",
            $"A booking has been cancelled. Reason: {reason}",
            $"/trips/{booking.Id}");

        return await GetByIdAsync(bookingId, callerId);
    }

    public async Task<BookingDto> CheckInAsync(Guid bookingId, Guid callerId, CheckInRequest request)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Car.OwnerId != callerId)
            throw new UnauthorizedAccessException("Only the host can check in.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed bookings can be checked in.");

        booking.Status = BookingStatus.InProgress;
        booking.CheckInOdometerKm = request.OdometerKm;
        if (request.PhotoUrls?.Count > 0)
        {
            booking.CheckInPhotos = JsonSerializer.Serialize(request.PhotoUrls);
        }

        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(booking.GuestId, NotificationType.BookingCheckIn,
            "Trip Started",
            "Your trip has started! Drive safe.",
            $"/trips/{booking.Id}");

        return await GetByIdAsync(bookingId, callerId);
    }

    public async Task<BookingDto> CheckOutAsync(Guid bookingId, Guid callerId, CheckOutRequest request)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car).ThenInclude(c => c.Owner)
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Car.OwnerId != callerId)
            throw new UnauthorizedAccessException("Only the host can check out.");

        if (booking.Status != BookingStatus.InProgress)
            throw new InvalidOperationException("Only in-progress bookings can be checked out.");

        booking.Status = BookingStatus.Completed;
        booking.CompletedAt = DateTimeOffset.UtcNow;
        booking.CheckOutOdometerKm = request.OdometerKm;
        if (request.PhotoUrls?.Count > 0)
        {
            booking.CheckOutPhotos = JsonSerializer.Serialize(request.PhotoUrls);
        }

        // Capture payment
        if (booking.PaymentIntentId != null)
        {
            await _paymentService.CaptureAsync(booking.PaymentIntentId, booking.TotalChargedUsd);
        }

        // Update trip counts
        var guest = await _db.Users.FindAsync(booking.GuestId);
        if (guest != null) guest.GuestTripCount++;

        var host = booking.Car.Owner;
        host.HostTripCount++;

        var car = booking.Car;
        car.TripCount++;

        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(booking.GuestId, NotificationType.BookingCompleted,
            "Trip Complete",
            "Your trip is complete! Don't forget to leave a review.",
            $"/trips/{booking.Id}");

        await _notificationService.CreateAsync(booking.Car.OwnerId, NotificationType.BookingCompleted,
            "Trip Complete",
            "A trip has been completed. Don't forget to leave a review.",
            $"/host/bookings");

        return await GetByIdAsync(bookingId, callerId);
    }

    public async Task<BookingDto> DisputeAsync(Guid bookingId, Guid callerId, string reason)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.GuestId != callerId && booking.Car.OwnerId != callerId)
            throw new UnauthorizedAccessException("Not authorized.");

        booking.Status = BookingStatus.Disputed;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(bookingId, callerId);
    }

    private async Task<Booking> GetBookingForHostAsync(Guid bookingId, Guid hostId)
    {
        return await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.Car.OwnerId == hostId)
            ?? throw new KeyNotFoundException("Booking not found.");
    }

    private async Task ReleaseAvailabilityBlockAsync(Guid bookingId)
    {
        var block = await _db.Availabilities
            .FirstOrDefaultAsync(a => a.BookingId == bookingId);
        if (block != null)
        {
            _db.Availabilities.Remove(block);
        }
    }

    private static decimal CalculateRefundAmount(Booking booking, bool isHost)
    {
        if (isHost) return booking.TotalChargedUsd; // Host cancels → 100% refund

        var daysUntilStart = (booking.StartUtc - DateTimeOffset.UtcNow).TotalDays;
        if (daysUntilStart > 7) return booking.TotalChargedUsd;
        if (daysUntilStart >= 1) return Math.Round(booking.TotalChargedUsd * 0.5m, 2);
        return 0m;
    }
}
