using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Geocoding;
using CarSharing.Api.Services.Uploads;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Cars;

public class CarService : ICarService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IPhotoStorage _photoStorage;
    private readonly IGeocodingService _geocodingService;
    private readonly IConfiguration _config;
    private readonly ILogger<CarService> _logger;

    public CarService(
        AppDbContext db, IMapper mapper, IPhotoStorage photoStorage,
        IGeocodingService geocodingService, IConfiguration config,
        ILogger<CarService> logger)
    {
        _db = db;
        _mapper = mapper;
        _photoStorage = photoStorage;
        _geocodingService = geocodingService;
        _config = config;
        _logger = logger;
    }

    public async Task<CarDetailDto> GetByIdAsync(Guid carId, Guid? callerId = null)
    {
        var car = await _db.Cars
            .Include(c => c.Owner)
            .Include(c => c.Photos.OrderBy(p => p.SortOrder))
            .Include(c => c.CarFeatures).ThenInclude(cf => cf.Feature)
            .Include(c => c.Reviews.Where(r => r.IsPublished)).ThenInclude(r => r.Author)
            .Include(c => c.BlockedDates)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == carId)
            ?? throw new KeyNotFoundException("Car not found.");

        return _mapper.Map<CarDetailDto>(car);
    }

    public async Task<CarDetailDto> CreateAsync(CreateCarRequest request, Guid ownerId)
    {
        var car = new Car
        {
            OwnerId = ownerId,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            Trim = request.Trim,
            Vin = request.Vin,
            LicensePlate = request.LicensePlate,
            LicensePlateRegion = request.LicensePlateRegion,
            BodyType = request.BodyType,
            Transmission = request.Transmission,
            FuelType = request.FuelType,
            Seats = request.Seats,
            Doors = request.Doors,
            Color = request.Color,
            OdometerKm = request.OdometerKm,
            DailyPriceUsd = request.DailyPriceUsd,
            WeeklyDiscountPercent = request.WeeklyDiscountPercent,
            MonthlyDiscountPercent = request.MonthlyDiscountPercent,
            CleaningFeeUsd = request.CleaningFeeUsd,
            SecurityDepositUsd = request.SecurityDepositUsd,
            MinTripDays = request.MinTripDays,
            MaxTripDays = request.MaxTripDays,
            AdvanceNoticeHours = request.AdvanceNoticeHours,
            DailyMileageLimitKm = request.DailyMileageLimitKm,
            ExtraKmFeeUsd = request.ExtraKmFeeUsd,
            AddressLine = request.AddressLine,
            City = request.City,
            Region = request.Region,
            Country = request.Country,
            PostalCode = request.PostalCode,
            Description = request.Description,
            Rules = request.Rules,
            IsInstantBook = request.IsInstantBook,
            Status = CarStatus.Draft
        };

        // Geocode
        try
        {
            var location = await _geocodingService.GeocodeAsync(
                request.AddressLine, request.City, request.Region, request.Country, request.PostalCode);
            if (location != null)
            {
                car.Location = location;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Geocoding failed for car in {City}", request.City);
        }

        // Features
        if (request.Features?.Count > 0)
        {
            var features = await _db.Features
                .Where(f => request.Features.Contains(f.Name) || request.Features.Contains(f.Slug))
                .ToListAsync();

            foreach (var feature in features)
            {
                car.CarFeatures.Add(new CarFeature { FeatureId = feature.Id });
            }
        }

        _db.Cars.Add(car);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Car {CarId} created by {OwnerId}", car.Id, ownerId);

        return await GetByIdAsync(car.Id);
    }

    public async Task<CarDetailDto> UpdateAsync(Guid carId, UpdateCarRequest request, Guid ownerId)
    {
        var car = await _db.Cars
            .Include(c => c.CarFeatures)
            .FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        if (request.Make != null) car.Make = request.Make;
        if (request.Model != null) car.Model = request.Model;
        if (request.Year.HasValue) car.Year = request.Year.Value;
        if (request.Trim != null) car.Trim = request.Trim;
        if (request.Vin != null) car.Vin = request.Vin;
        if (request.LicensePlate != null) car.LicensePlate = request.LicensePlate;
        if (request.LicensePlateRegion != null) car.LicensePlateRegion = request.LicensePlateRegion;
        if (request.BodyType.HasValue) car.BodyType = request.BodyType.Value;
        if (request.Transmission.HasValue) car.Transmission = request.Transmission.Value;
        if (request.FuelType.HasValue) car.FuelType = request.FuelType.Value;
        if (request.Seats.HasValue) car.Seats = request.Seats.Value;
        if (request.Doors.HasValue) car.Doors = request.Doors.Value;
        if (request.Color != null) car.Color = request.Color;
        if (request.OdometerKm.HasValue) car.OdometerKm = request.OdometerKm.Value;
        if (request.DailyPriceUsd.HasValue) car.DailyPriceUsd = request.DailyPriceUsd.Value;
        if (request.WeeklyDiscountPercent.HasValue) car.WeeklyDiscountPercent = request.WeeklyDiscountPercent.Value;
        if (request.MonthlyDiscountPercent.HasValue) car.MonthlyDiscountPercent = request.MonthlyDiscountPercent.Value;
        if (request.CleaningFeeUsd.HasValue) car.CleaningFeeUsd = request.CleaningFeeUsd.Value;
        if (request.SecurityDepositUsd.HasValue) car.SecurityDepositUsd = request.SecurityDepositUsd.Value;
        if (request.MinTripDays.HasValue) car.MinTripDays = request.MinTripDays.Value;
        if (request.MaxTripDays.HasValue) car.MaxTripDays = request.MaxTripDays.Value;
        if (request.AdvanceNoticeHours.HasValue) car.AdvanceNoticeHours = request.AdvanceNoticeHours.Value;
        if (request.DailyMileageLimitKm.HasValue) car.DailyMileageLimitKm = request.DailyMileageLimitKm.Value;
        if (request.ExtraKmFeeUsd.HasValue) car.ExtraKmFeeUsd = request.ExtraKmFeeUsd.Value;
        if (request.AddressLine != null) car.AddressLine = request.AddressLine;
        if (request.City != null) car.City = request.City;
        if (request.Region != null) car.Region = request.Region;
        if (request.Country != null) car.Country = request.Country;
        if (request.PostalCode != null) car.PostalCode = request.PostalCode;
        if (request.Description != null) car.Description = request.Description;
        if (request.Rules != null) car.Rules = request.Rules;
        if (request.IsInstantBook.HasValue) car.IsInstantBook = request.IsInstantBook.Value;

        // Re-geocode if address changed
        if (request.City != null || request.AddressLine != null)
        {
            try
            {
                var location = await _geocodingService.GeocodeAsync(
                    car.AddressLine, car.City, car.Region, car.Country, car.PostalCode);
                if (location != null) car.Location = location;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Geocoding failed during update for car {CarId}", carId);
            }
        }

        // Update features
        if (request.Features != null)
        {
            car.CarFeatures.Clear();
            var features = await _db.Features
                .Where(f => request.Features.Contains(f.Name) || request.Features.Contains(f.Slug))
                .ToListAsync();
            foreach (var feature in features)
            {
                car.CarFeatures.Add(new CarFeature { CarId = car.Id, FeatureId = feature.Id });
            }
        }

        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id);
    }

    public async Task DeleteAsync(Guid carId, Guid ownerId)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        car.Status = CarStatus.Removed;
        await _db.SaveChangesAsync();
    }

    public async Task<CarDetailDto> PublishAsync(Guid carId, Guid ownerId)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        var autoApprove = _config.GetValue<bool>("App:AutoApproveCarsInDev");
        car.Status = autoApprove ? CarStatus.Listed : CarStatus.PendingApproval;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id);
    }

    public async Task<CarDetailDto> SnoozeAsync(Guid carId, Guid ownerId)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        car.Status = CarStatus.Snoozed;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id);
    }

    public async Task<CarDetailDto> UnsnoozeAsync(Guid carId, Guid ownerId)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        car.Status = CarStatus.Listed;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(car.Id);
    }

    public async Task<List<CarListDto>> GetByOwnerAsync(Guid ownerId)
    {
        var cars = await _db.Cars
            .Include(c => c.Photos.OrderBy(p => p.SortOrder))
            .Where(c => c.OwnerId == ownerId && c.Status != CarStatus.Removed)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<CarListDto>>(cars);
    }

    public async Task<CarPhotoDto> AddPhotoAsync(Guid carId, Guid ownerId, Stream fileStream, string fileName, string contentType)
    {
        var car = await _db.Cars.Include(c => c.Photos)
            .FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        if (car.Photos.Count >= 15)
            throw new InvalidOperationException("Maximum 15 photos per car.");

        var uploadResult = await _photoStorage.UploadAsync(fileStream, fileName, $"cars/{carId}");

        var photo = new CarPhoto
        {
            CarId = carId,
            Url = uploadResult.Url,
            PublicId = uploadResult.PublicId,
            SortOrder = car.Photos.Count,
            IsCover = car.Photos.Count == 0
        };

        _db.CarPhotos.Add(photo);
        await _db.SaveChangesAsync();

        return _mapper.Map<CarPhotoDto>(photo);
    }

    public async Task DeletePhotoAsync(Guid carId, Guid photoId, Guid ownerId)
    {
        var photo = await _db.CarPhotos
            .FirstOrDefaultAsync(p => p.Id == photoId && p.CarId == carId && p.Car.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Photo not found.");

        if (photo.PublicId != null)
        {
            await _photoStorage.DeleteAsync(photo.PublicId);
        }

        _db.CarPhotos.Remove(photo);
        await _db.SaveChangesAsync();
    }

    public async Task<Guid> BlockDatesAsync(Guid carId, Guid ownerId, BlockDatesRequest request)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == carId && c.OwnerId == ownerId)
            ?? throw new KeyNotFoundException("Car not found.");

        var block = new Availability
        {
            CarId = carId,
            StartUtc = request.StartUtc,
            EndUtc = request.EndUtc,
            Reason = AvailabilityReason.HostBlock
        };

        _db.Availabilities.Add(block);
        await _db.SaveChangesAsync();

        return block.Id;
    }

    public async Task DeleteBlockAsync(Guid carId, Guid blockId, Guid ownerId)
    {
        var block = await _db.Availabilities
            .FirstOrDefaultAsync(a => a.Id == blockId && a.CarId == carId && a.Car.OwnerId == ownerId
                && a.Reason == AvailabilityReason.HostBlock)
            ?? throw new KeyNotFoundException("Block not found.");

        _db.Availabilities.Remove(block);
        await _db.SaveChangesAsync();
    }
}
