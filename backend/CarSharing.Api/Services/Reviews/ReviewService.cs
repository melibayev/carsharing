using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Reviews;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(AppDbContext db, IMapper mapper, ILogger<ReviewService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ReviewDto> CreateAsync(CreateReviewRequest request, Guid authorId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car)
            .Include(b => b.Reviews)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Completed)
            throw new InvalidOperationException("Reviews can only be left for completed bookings.");

        if (booking.CompletedAt.HasValue && (DateTimeOffset.UtcNow - booking.CompletedAt.Value).TotalDays > 14)
            throw new InvalidOperationException("Review window has expired (14 days).");

        var isGuest = booking.GuestId == authorId;
        var isHost = booking.Car.OwnerId == authorId;

        if (!isGuest && !isHost)
            throw new UnauthorizedAccessException("You are not a party to this booking.");

        var authorRole = isGuest ? ReviewAuthorRole.Guest : ReviewAuthorRole.Host;

        if (booking.Reviews.Any(r => r.AuthorId == authorId))
            throw new InvalidOperationException("You have already reviewed this booking.");

        var subjectId = isGuest ? booking.Car.OwnerId : booking.GuestId;

        var review = new Review
        {
            BookingId = request.BookingId,
            AuthorId = authorId,
            SubjectId = subjectId,
            AuthorRole = authorRole,
            Rating = request.Rating,
            CleanlinessRating = request.CleanlinessRating,
            CommunicationRating = request.CommunicationRating,
            AccuracyRating = request.AccuracyRating,
            Comment = request.Comment,
            CarId = isGuest ? booking.CarId : null,
            IsPublished = false
        };

        _db.Reviews.Add(review);

        // Check if both sides have now reviewed → publish both
        var otherReview = booking.Reviews.FirstOrDefault(r => r.AuthorId != authorId);
        if (otherReview != null)
        {
            review.IsPublished = true;
            otherReview.IsPublished = true;
        }

        await _db.SaveChangesAsync();

        // Update ratings
        await UpdateRatingsAsync(subjectId, booking.CarId, isGuest);

        var savedReview = await _db.Reviews
            .Include(r => r.Author)
            .FirstAsync(r => r.Id == review.Id);

        return _mapper.Map<ReviewDto>(savedReview);
    }

    public async Task<List<ReviewDto>> GetByCarAsync(Guid carId)
    {
        var reviews = await _db.Reviews
            .Include(r => r.Author)
            .Where(r => r.CarId == carId && r.IsPublished)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ReviewDto>>(reviews);
    }

    public async Task<List<ReviewDto>> GetByUserAsync(Guid userId)
    {
        var reviews = await _db.Reviews
            .Include(r => r.Author)
            .Where(r => r.SubjectId == userId && r.IsPublished)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ReviewDto>>(reviews);
    }

    private async Task UpdateRatingsAsync(Guid subjectId, Guid carId, bool authorIsGuest)
    {
        // Update user rating
        var user = await _db.Users.FindAsync(subjectId);
        if (user != null)
        {
            if (authorIsGuest)
            {
                // Guest reviewed the host
                var hostReviews = await _db.Reviews
                    .Where(r => r.SubjectId == subjectId && r.AuthorRole == ReviewAuthorRole.Guest && r.IsPublished)
                    .ToListAsync();
                user.AverageRatingAsHost = hostReviews.Count > 0
                    ? Math.Round((decimal)hostReviews.Average(r => r.Rating), 2) : 0;
            }
            else
            {
                // Host reviewed the guest
                var guestReviews = await _db.Reviews
                    .Where(r => r.SubjectId == subjectId && r.AuthorRole == ReviewAuthorRole.Host && r.IsPublished)
                    .ToListAsync();
                user.AverageRatingAsGuest = guestReviews.Count > 0
                    ? Math.Round((decimal)guestReviews.Average(r => r.Rating), 2) : 0;
            }
        }

        // Update car rating
        if (authorIsGuest)
        {
            var car = await _db.Cars.FindAsync(carId);
            if (car != null)
            {
                var carReviews = await _db.Reviews
                    .Where(r => r.CarId == carId && r.IsPublished)
                    .ToListAsync();
                car.AverageRating = carReviews.Count > 0
                    ? Math.Round((decimal)carReviews.Average(r => r.Rating), 2) : 0;
            }
        }

        await _db.SaveChangesAsync();
    }
}
