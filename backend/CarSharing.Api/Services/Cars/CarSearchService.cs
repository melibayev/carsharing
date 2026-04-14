using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Services.Cars;

public class CarSearchService : ICarSearchService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CarSearchService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResult<CarListDto>> SearchAsync(CarSearchRequest request, Guid? callerId = null)
    {
        var query = _db.Cars
            .Include(c => c.Photos.OrderBy(p => p.SortOrder))
            .Include(c => c.CarFeatures).ThenInclude(cf => cf.Feature)
            .Where(c => c.Status == CarStatus.Listed)
            .AsQueryable();

        // Exclude caller's own cars
        if (callerId.HasValue)
        {
            query = query.Where(c => c.OwnerId != callerId.Value);
        }

        // City filter
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            query = query.Where(c => c.City.ToLower().Contains(request.City.ToLower()));
        }

        // Price filter
        if (request.MinPrice.HasValue)
        {
            query = query.Where(c => c.DailyPriceUsd >= request.MinPrice.Value);
        }
        if (request.MaxPrice.HasValue)
        {
            query = query.Where(c => c.DailyPriceUsd <= request.MaxPrice.Value);
        }

        // Body type
        if (request.BodyType.HasValue)
        {
            query = query.Where(c => c.BodyType == request.BodyType.Value);
        }

        // Make
        if (!string.IsNullOrWhiteSpace(request.Make))
        {
            query = query.Where(c => c.Make.ToLower() == request.Make.ToLower());
        }

        // Transmission
        if (request.Transmission.HasValue)
        {
            query = query.Where(c => c.Transmission == request.Transmission.Value);
        }

        // Fuel type
        if (request.FuelType.HasValue)
        {
            query = query.Where(c => c.FuelType == request.FuelType.Value);
        }

        // Seats
        if (request.Seats.HasValue)
        {
            query = query.Where(c => c.Seats >= request.Seats.Value);
        }

        // Instant book
        if (request.InstantBook.HasValue && request.InstantBook.Value)
        {
            query = query.Where(c => c.IsInstantBook);
        }

        // Features
        if (!string.IsNullOrWhiteSpace(request.Features))
        {
            var featureList = request.Features.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var featureName in featureList)
            {
                var f = featureName;
                query = query.Where(c => c.CarFeatures.Any(cf =>
                    cf.Feature.Name.ToLower() == f.ToLower() || cf.Feature.Slug.ToLower() == f.ToLower()));
            }
        }

        // Date availability filter
        if (request.StartDate.HasValue && request.EndDate.HasValue)
        {
            var start = request.StartDate.Value;
            var end = request.EndDate.Value;

            // Exclude cars that have overlapping bookings in active states
            query = query.Where(c => !c.Bookings.Any(b =>
                (b.Status == BookingStatus.PendingApproval ||
                 b.Status == BookingStatus.Confirmed ||
                 b.Status == BookingStatus.InProgress) &&
                b.StartUtc < end && b.EndUtc > start));

            // Exclude cars that have overlapping blocked dates
            query = query.Where(c => !c.BlockedDates.Any(a =>
                a.StartUtc < end && a.EndUtc > start));
        }

        // Geo filtering
        Point? searchPoint = null;
        if (request.Lat.HasValue && request.Lng.HasValue)
        {
            var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(4326);
            searchPoint = geometryFactory.CreatePoint(new Coordinate(request.Lng.Value, request.Lat.Value));
            var radiusMeters = (request.RadiusKm ?? 50) * 1000;

            query = query.Where(c => c.Location != null && c.Location.IsWithinDistance(searchPoint, radiusMeters));
        }

        // Total count before paging
        var totalCount = await query.CountAsync();

        // Sorting
        query = request.Sort switch
        {
            "price" => query.OrderBy(c => c.DailyPriceUsd),
            "-price" => query.OrderByDescending(c => c.DailyPriceUsd),
            "rating" => query.OrderBy(c => c.AverageRating),
            "-rating" => query.OrderByDescending(c => c.AverageRating),
            "distance" when searchPoint != null => query.OrderBy(c => c.Location!.Distance(searchPoint)),
            _ => query.OrderByDescending(c => c.TripCount).ThenByDescending(c => c.AverageRating)
        };

        // Paging
        var cars = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .AsSplitQuery()
            .ToListAsync();

        var items = cars.Select(car =>
        {
            var dto = _mapper.Map<CarListDto>(car);
            if (searchPoint != null && car.Location != null)
            {
                var distanceMeters = car.Location.Distance(searchPoint);
                dto.DistanceKm = Math.Round(distanceMeters / 1000.0, 1);
            }
            return dto;
        }).ToList();

        return new PagedResult<CarListDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<List<CarListDto>> GetFeaturedAsync(int count = 8)
    {
        var cars = await _db.Cars
            .Include(c => c.Photos.OrderBy(p => p.SortOrder))
            .Where(c => c.Status == CarStatus.Listed)
            .OrderByDescending(c => c.AverageRating)
            .ThenByDescending(c => c.TripCount)
            .Take(count)
            .ToListAsync();

        return _mapper.Map<List<CarListDto>>(cars);
    }
}
