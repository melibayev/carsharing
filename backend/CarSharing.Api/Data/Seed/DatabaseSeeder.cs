using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Data.Seed;

public class DatabaseSeeder
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ILogger<DatabaseSeeder> _logger;
    private readonly Random _rng = new(42); // deterministic

    // Keep track of created entities for cross-referencing
    private readonly List<ApplicationUser> _users = new();
    private readonly List<Car> _cars = new();
    private readonly List<Booking> _bookings = new();

    public DatabaseSeeder(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger<DatabaseSeeder> logger)
    {
        _db = db;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        if (await _db.Users.AnyAsync())
        {
            _logger.LogInformation("Database already seeded. Skipping.");
            return;
        }

        _logger.LogInformation("Seeding database...");

        await SeedRolesAsync();
        await SeedFeaturesAsync();
        await SeedSpecialAccountsAsync();
        await SeedRegularUsersAsync();
        await SeedCarsAsync();
        await SeedBookingsAsync();
        await SeedReviewsAsync();
        await SeedConversationsAsync();
        await SeedNotificationsAsync();

        _logger.LogInformation("Database seeding completed. {UserCount} users, {CarCount} cars, {BookingCount} bookings.",
            _users.Count, _cars.Count, _bookings.Count);
    }

    private async Task SeedRolesAsync()
    {
        foreach (var role in new[] { "Admin", "User" })
        {
            if (!await _roleManager.RoleExistsAsync(role))
                await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = role, NormalizedName = role.ToUpperInvariant() });
        }
    }

    private static readonly (string Name, string Slug, string? Icon)[] FeatureData = new (string, string, string?)[]
    {
        ("Bluetooth", "bluetooth", "bluetooth"),
        ("Backup Camera", "backup-camera", "camera"),
        ("GPS Navigation", "gps-navigation", "navigation"),
        ("USB Charger", "usb-charger", "usb"),
        ("Heated Seats", "heated-seats", "thermometer"),
        ("Sunroof", "sunroof", "sun"),
        ("Apple CarPlay", "apple-carplay", "smartphone"),
        ("Android Auto", "android-auto", "smartphone"),
        ("Keyless Entry", "keyless-entry", "key"),
        ("All-Wheel Drive", "all-wheel-drive", "cog"),
        ("Child Seat", "child-seat", "baby"),
        ("Pet Friendly", "pet-friendly", "paw"),
        ("Toll Pass", "toll-pass", "credit-card"),
        ("Bike Rack", "bike-rack", "bicycle"),
        ("Ski Rack", "ski-rack", "mountain"),
        ("Roof Rack", "roof-rack", "box"),
    };

    private readonly List<Feature> _features = new();

    private async Task SeedFeaturesAsync()
    {
        foreach (var (name, slug, icon) in FeatureData)
        {
            var feature = new Feature { Name = name, Slug = slug, Icon = icon };
            _db.Features.Add(feature);
            _features.Add(feature);
        }
        await _db.SaveChangesAsync();
    }

    private async Task SeedSpecialAccountsAsync()
    {
        // Admin
        var admin = await CreateUserAsync("admin@CarSharing.dev", "Admin123!", "Admin", "CarSharing",
            "Platforma administratori", true, true);
        await _userManager.AddToRoleAsync(admin, "Admin");
        _users.Add(admin);

        // Host
        var host = await CreateUserAsync("host@CarSharing.dev", "Host1234!", "Sardor", "Karimov",
            "5 yildan ortiq avtomobil ijarasi tajribam bor. Superhost.", true, true);
        await _userManager.AddToRoleAsync(host, "User");
        host.HostTripCount = 45;
        host.AverageRatingAsHost = 4.8m;
        _users.Add(host);

        // Guest
        var guest = await CreateUserAsync("guest@CarSharing.dev", "Guest123!", "Aziza", "Rahimova",
            "Sayohat qilishni yaxshi ko'raman!", true, true);
        await _userManager.AddToRoleAsync(guest, "User");
        guest.GuestTripCount = 12;
        guest.AverageRatingAsGuest = 4.9m;
        _users.Add(guest);

        await _db.SaveChangesAsync();
    }

    private async Task SeedRegularUsersAsync()
    {
        var userData = new[]
        {
            ("dilshod.a@example.com", "Dilshod", "Abdullayev", "Toshkentlik dasturchi, dam olish kunlari sayohat qilaman"),
            ("malika.r@example.com", "Malika", "Rustamova", "Sarguzasht izlovchi, kabrioletlarni yaxshi ko'raman"),
            ("bobur.n@example.com", "Bobur", "Nazarov", "Biznes safarlarda sedan afzal"),
            ("nilufar.s@example.com", "Nilufar", "Sobirov", "Ekologik haydovchi, elektr mashinalarni yoqtiraman"),
            ("jasur.t@example.com", "Jasur", "Toshmatov", "Dam olish kuni SUV bilan tog'ga"),
            ("zulfiya.k@example.com", "Zulfiya", "Komilov", "Yangi shaharni o'rganmoqdaman"),
            ("rustam.m@example.com", "Rustam", "Mirzayev", "Nafaqadagi haydovchi, klassik mashinalar uchun"),
            ("shahlo.i@example.com", "Shahlo", "Ismoilov", "Talaba, arzon ijara izlayman"),
            ("otabek.y@example.com", "Otabek", "Yusupov", "Fotograf, yuk olib yurish kerak"),
            ("gulnora.a@example.com", "Gulnora", "Ahmedova", "Ko'chmas mulk agenti, doimo yo'lda"),
            ("ulugbek.h@example.com", "Ulugbek", "Hasanov", "Yuk tashish uchun mashina kerak"),
            ("feruza.b@example.com", "Feruza", "Baxtiyorova", "Musiqachi, gastrol sayohatlari"),
            ("anvar.j@example.com", "Anvar", "Jo'rayev", "O'qituvchi, yozgi sayohatlar"),
            ("madina.q@example.com", "Madina", "Qodirov", "Shifokor, ishonchli transport kerak"),
            ("sherzod.o@example.com", "Sherzod", "Ortiqov", "Startup asoschisi, dam olish kuni mashina kerak"),
            ("dilorom.u@example.com", "Dilorom", "Umarova", "To'y tashkilotchisi, chiroyli mashina kerak"),
            ("farhod.z@example.com", "Farhod", "Zaripov", "Tog' yuruvchi, 4WD kerak"),
            ("mohira.e@example.com", "Mohira", "Ergasheva", "Masofadan ishlovchi, vaqti-vaqti bilan shahar safarlari"),
            ("husan.g@example.com", "Husan", "G'aniyev", "Qurilish ishchisi, yuk mashinalari afzal"),
            ("iroda.l@example.com", "Iroda", "Latipova", "Travel bloger, doimo sharh yozaman"),
        };

        foreach (var (email, first, last, bio) in userData)
        {
            var user = await CreateUserAsync(email, "Password1!", first, last, bio, true, _rng.NextDouble() > 0.3);
            await _userManager.AddToRoleAsync(user, "User");
            user.HostTripCount = _rng.Next(0, 20);
            user.GuestTripCount = _rng.Next(0, 15);
            user.AverageRatingAsHost = user.HostTripCount > 0 ? Math.Round(3.5m + (decimal)_rng.NextDouble() * 1.5m, 1) : 0;
            user.AverageRatingAsGuest = user.GuestTripCount > 0 ? Math.Round(3.5m + (decimal)_rng.NextDouble() * 1.5m, 1) : 0;
            _users.Add(user);
        }

        await _db.SaveChangesAsync();
    }

    private async Task<ApplicationUser> CreateUserAsync(string email, string password,
        string first, string last, string bio, bool confirmedEmail, bool verifiedId)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = first,
            LastName = last,
            Bio = bio,
            EmailConfirmed = confirmedEmail,
            IsIdentityVerified = verifiedId,
            PhoneNumber = $"+998{_rng.Next(90, 99)}{_rng.Next(1000000, 9999999)}",
            DateOfBirth = new DateTimeOffset(1985 + _rng.Next(0, 20), _rng.Next(1, 12), _rng.Next(1, 28), 0, 0, 0, TimeSpan.Zero),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(30, 365)),
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to create user {Email}: {Errors}", email,
                string.Join(", ", result.Errors.Select(e => e.Description)));
            throw new Exception($"Failed to create user {email}");
        }

        return user;
    }

    // 8 Uzbek cities with coordinates
    private static readonly (string City, string Region, double Lat, double Lng)[] Cities = new[]
    {
        ("Tashkent", "TSH", 41.2995, 69.2401),
        ("Samarkand", "SAM", 39.6542, 66.9597),
        ("Bukhara", "BUX", 39.7747, 64.4286),
        ("Fergana", "FAR", 40.3894, 71.7833),
        ("Andijan", "AND", 40.7821, 72.3442),
        ("Namangan", "NAM", 40.9983, 71.6726),
        ("Urgench", "XOR", 41.5500, 60.6316),
        ("Nukus", "QOR", 42.4611, 59.6103),
    };

    // Uzbek car market: Chevrolet dominant, Korean popular, some Japanese luxury, Chinese EVs
    private static readonly (string Make, string Model, int Year, BodyType Body, Transmission Trans, FuelType Fuel, int Seats, int Doors, string Color, decimal Price, string Desc)[] CarData = new[]
    {
        ("Chevrolet", "Cobalt", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 350000m, "O'zbekistonning eng mashhur sedani, tejamkor va ishonchli"),
        ("Chevrolet", "Cobalt", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kumush", 400000m, "Yangi model, zamonaviy dizayn"),
        ("Chevrolet", "Nexia 3", 2022, BodyType.Sedan, Transmission.Manual, FuelType.Gasoline, 5, 4, "Qora", 250000m, "Arzon va ishonchli kundalik mashina"),
        ("Chevrolet", "Nexia 3", 2023, BodyType.Sedan, Transmission.Manual, FuelType.Gasoline, 5, 4, "Oq", 280000m, "Iqtisodiy yoqilg'i sarfi, shahar uchun ideal"),
        ("Chevrolet", "Lacetti", 2021, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kulrang", 300000m, "Keng salon, oilaviy sayohatlar uchun qulay"),
        ("Chevrolet", "Gentra", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kumush", 380000m, "Zamonaviy Lacetti, yuqori sifat"),
        ("Chevrolet", "Spark", 2023, BodyType.Hatchback, Transmission.Automatic, FuelType.Gasoline, 4, 4, "Sariq", 200000m, "Shahar mashinasi, park qilish oson"),
        ("Chevrolet", "Spark", 2022, BodyType.Hatchback, Transmission.Manual, FuelType.Gasoline, 4, 4, "Qizil", 180000m, "Eng arzon variant, talabalar uchun ideal"),
        ("Chevrolet", "Malibu", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Qora", 600000m, "Premium sedan, biznes uchrashuv uchun"),
        ("Chevrolet", "Malibu", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 700000m, "Yangi avlod, to'liq jihozlangan"),
        ("Chevrolet", "Tracker", 2024, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Moviy", 550000m, "Kompakt SUV, shahar va tog' uchun"),
        ("Chevrolet", "Captiva", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 7, 4, "Oq", 650000m, "7 o'rindiqli oilaviy SUV"),
        ("Chevrolet", "Equinox", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kulrang", 700000m, "Keng va qulay SUV, uzoq safar uchun"),
        ("Chevrolet", "Tahoe", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 7, 4, "Qora", 2000000m, "Premium katta SUV, VIP transport"),
        ("Chevrolet", "Damas", 2022, BodyType.Van, Transmission.Manual, FuelType.Gasoline, 7, 4, "Oq", 200000m, "Klassik Damas, ko'chirish va yuk uchun"),
        ("Chevrolet", "Labo", 2023, BodyType.Truck, Transmission.Manual, FuelType.Gasoline, 2, 2, "Oq", 220000m, "Yuk tashish uchun eng mashhur tanlov"),
        ("Kia", "K5", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kumush", 800000m, "Sportiv dizayn, zamonaviy texnologiyalar"),
        ("Kia", "K5", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Qora", 750000m, "Koreys sifati, premium his"),
        ("Kia", "Seltos", 2024, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 600000m, "Kompakt crossover, zamonaviy dizayn"),
        ("Kia", "Sportage", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kulrang", 850000m, "Oilaviy SUV, keng va qulay"),
        ("Hyundai", "Sonata", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 750000m, "Biznes-klass sedan, qulay salon"),
        ("Hyundai", "Sonata", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Qora", 850000m, "Yangi avlod, to'liq opsiya"),
        ("Hyundai", "Tucson", 2024, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Moviy", 900000m, "Zamonaviy SUV, panoramik tomo"),
        ("Hyundai", "Santa Fe", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 7, 4, "Kulrang", 1200000m, "Premium oilaviy SUV, 7 o'rindiq"),
        ("Toyota", "Camry", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 1000000m, "Ishonchlilik belgisi, biznes sedan"),
        ("Toyota", "Camry", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Hybrid, 5, 4, "Kumush", 1200000m, "Gibrid versiya, iqtisodiy"),
        ("Toyota", "Land Cruiser Prado", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Diesel, 7, 4, "Oq", 2500000m, "Afsonaviy SUV, har qanday yo'l uchun"),
        ("Toyota", "Hilux", 2023, BodyType.Truck, Transmission.Automatic, FuelType.Diesel, 5, 4, "Kulrang", 1500000m, "Ishonchli pikap, ish va dam olish"),
        ("BYD", "Chazor", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Electric, 5, 4, "Oq", 500000m, "Elektr sedan, arzon zaryadlash"),
        ("BYD", "Song Plus", 2024, BodyType.SUV, Transmission.Automatic, FuelType.PlugInHybrid, 5, 4, "Yashil", 700000m, "Gibrid SUV, 100km elektr masofasi"),
        ("Zeekr", "001", 2024, BodyType.Hatchback, Transmission.Automatic, FuelType.Electric, 5, 4, "Moviy", 1500000m, "Premium elektromobil, 500km masofasi"),
        ("Tesla", "Model Y", 2024, BodyType.SUV, Transmission.Automatic, FuelType.Electric, 5, 4, "Oq", 2000000m, "Dunyodagi eng mashhur elektr SUV"),
        ("Chevrolet", "Cobalt", 2021, BodyType.Sedan, Transmission.Manual, FuelType.Gasoline, 5, 4, "Oq", 280000m, "Iqtisodiy variant, gaz o'rnatilgan"),
        ("Chevrolet", "Malibu", 2022, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kumush", 550000m, "Oldingi avlod, yaxshi holat"),
        ("Kia", "Carnival", 2023, BodyType.Minivan, Transmission.Automatic, FuelType.Gasoline, 7, 4, "Oq", 1100000m, "Premium miniven, oilaviy sayohat"),
        ("Hyundai", "Accent", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Oq", 400000m, "Iqtisodiy sedan, shahar uchun"),
        ("Toyota", "Corolla", 2023, BodyType.Sedan, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Kumush", 700000m, "Dunyoning eng ko'p sotilgan mashinasi"),
        ("Chevrolet", "Tracker", 2023, BodyType.SUV, Transmission.Automatic, FuelType.Gasoline, 5, 4, "Qizil", 500000m, "Sportiv crossover, yosh avlod uchun"),
        ("BYD", "Han", 2024, BodyType.Sedan, Transmission.Automatic, FuelType.Electric, 5, 4, "Qora", 1000000m, "Hashamatli elektr sedan"),
        ("Chevrolet", "Gentra", 2022, BodyType.Sedan, Transmission.Manual, FuelType.Gasoline, 5, 4, "Oq", 320000m, "Ishonchli va iqtisodiy, mexanik uzatma"),
    };

    private async Task SeedCarsAsync()
    {
        var factory = new GeometryFactory(new PrecisionModel(), 4326);
        var hosts = _users.Where(u => u.Email != "guest@CarSharing.dev" && u.Email != "admin@CarSharing.dev").ToList();

        for (var i = 0; i < CarData.Length; i++)
        {
            var c = CarData[i];
            var city = Cities[i % Cities.Length];
            var owner = (i < 5) ? _users[1] : hosts[_rng.Next(hosts.Count)]; // first 5 belong to host@CarSharing.dev

            var lat = city.Lat + (_rng.NextDouble() - 0.5) * 0.1;
            var lng = city.Lng + (_rng.NextDouble() - 0.5) * 0.1;

            var car = new Car
            {
                OwnerId = owner.Id,
                Make = c.Make,
                Model = c.Model,
                Year = c.Year,
                BodyType = c.Body,
                Transmission = c.Trans,
                FuelType = c.Fuel,
                Seats = c.Seats,
                Doors = c.Doors,
                Color = c.Color,
                OdometerKm = _rng.Next(5000, 80000),
                DailyPriceUsd = c.Price,
                WeeklyDiscountPercent = 10,
                MonthlyDiscountPercent = 20,
                CleaningFeeUsd = _rng.Next(15, 40),
                SecurityDepositUsd = Math.Round(c.Price * 2),
                MinTripDays = 1,
                MaxTripDays = 30,
                AdvanceNoticeHours = 24,
                DailyMileageLimitKm = _rng.NextDouble() > 0.5 ? _rng.Next(200, 500) : null,
                AddressLine = $"{_rng.Next(100, 9999)} {StreetNames[_rng.Next(StreetNames.Length)]}",
                City = city.City,
                Region = city.Region,
                Country = "UZ",
                PostalCode = $"{_rng.Next(10000, 99999)}",
                Location = factory.CreatePoint(new Coordinate(lng, lat)),
                Description = c.Desc,
                Rules = "Chekish taqiqlangan. Yoqilg'ini xuddi shu darajada qaytaring. Har qanday shikastlanishni darhol xabar bering.",
                Status = CarStatus.Listed,
                IsInstantBook = _rng.NextDouble() > 0.4,
                AverageRating = Math.Round(3.5m + (decimal)_rng.NextDouble() * 1.5m, 1),
                TripCount = _rng.Next(1, 30),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(30, 300)),
            };

            // Add car photo from Unsplash
            var carPhotoUrls = new[]
            {
                "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
                "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
                "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&q=80",
                "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
                "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
                "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
                "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
                "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80",
            };
            car.Photos.Add(new CarPhoto
            {
                Url = carPhotoUrls[i % carPhotoUrls.Length],
                SortOrder = 0,
                IsCover = true,
            });

            // Assign 2-5 random features
            var featureCount = _rng.Next(2, 6);
            var shuffled = _features.OrderBy(_ => _rng.Next()).Take(featureCount).ToList();
            foreach (var f in shuffled)
            {
                car.CarFeatures.Add(new CarFeature { FeatureId = f.Id });
            }

            _db.Cars.Add(car);
            _cars.Add(car);
        }

        await _db.SaveChangesAsync();
    }

    private static readonly string[] StreetNames = { "Amir Temur ko'chasi", "Navoiy ko'chasi", "Mustaqillik shoh ko'chasi", "Bobur ko'chasi", "Beruniy ko'chasi", "Oybek ko'chasi", "Mirzo Ulug'bek ko'chasi", "Shota Rustaveli ko'chasi", "Alisher Navoiy ko'chasi", "Buyuk Turon ko'chasi" };

    private async Task SeedBookingsAsync()
    {
        var guests = _users.Where(u => u.Email != "admin@CarSharing.dev").ToList();
        var now = DateTimeOffset.UtcNow;

        // Create 80 completed bookings
        for (var i = 0; i < 80; i++)
        {
            var car = _cars[_rng.Next(_cars.Count)];
            var guest = guests.Where(g => g.Id != car.OwnerId).OrderBy(_ => _rng.Next()).First();

            var daysAgo = _rng.Next(10, 180);
            var tripDays = _rng.Next(1, 8);
            var startDate = now.AddDays(-daysAgo);
            var endDate = startDate.AddDays(tripDays);

            var dailyRate = car.DailyPriceUsd;
            var subtotal = dailyRate * tripDays;
            var cleaningFee = car.CleaningFeeUsd;
            var serviceFee = Math.Round(subtotal * 0.12m, 2);
            var taxes = Math.Round(subtotal * 0.08m, 2);
            var total = subtotal + cleaningFee + serviceFee + taxes;
            var hostPayout = Math.Round(subtotal * 0.85m + cleaningFee, 2);

            var booking = new Booking
            {
                CarId = car.Id,
                GuestId = guest.Id,
                StartUtc = startDate,
                EndUtc = endDate,
                Status = BookingStatus.Completed,
                DailyRateUsd = dailyRate,
                Days = tripDays,
                SubtotalUsd = subtotal,
                CleaningFeeUsd = cleaningFee,
                ServiceFeeUsd = serviceFee,
                TaxesUsd = taxes,
                SecurityDepositHoldUsd = car.SecurityDepositUsd,
                TotalChargedUsd = total,
                HostPayoutUsd = hostPayout,
                GuestMessage = BookingMessages[_rng.Next(BookingMessages.Length)],
                ConfirmedAt = startDate.AddHours(-48),
                CompletedAt = endDate.AddHours(1),
                CheckInOdometerKm = _rng.Next(10000, 50000),
                CheckOutOdometerKm = _rng.Next(10000, 50000) + tripDays * _rng.Next(50, 200),
                CreatedAt = startDate.AddDays(-3),
            };

            _db.Bookings.Add(booking);
            _bookings.Add(booking);
        }

        // Add 5 pending bookings for guest@CarSharing.dev
        var guestUser = _users.First(u => u.Email == "guest@CarSharing.dev");
        for (var i = 0; i < 5; i++)
        {
            var car = _cars.Where(c => c.OwnerId != guestUser.Id).OrderBy(_ => _rng.Next()).First();
            var futureStart = now.AddDays(_rng.Next(3, 20));
            var futureDays = _rng.Next(2, 7);
            var futureEnd = futureStart.AddDays(futureDays);

            var dailyRate = car.DailyPriceUsd;
            var subtotal = dailyRate * futureDays;
            var cleaningFee = car.CleaningFeeUsd;
            var serviceFee = Math.Round(subtotal * 0.12m, 2);
            var taxes = Math.Round(subtotal * 0.08m, 2);
            var total = subtotal + cleaningFee + serviceFee + taxes;
            var hostPayout = Math.Round(subtotal * 0.85m + cleaningFee, 2);

            var status = i switch
            {
                0 => BookingStatus.PendingApproval,
                1 => BookingStatus.Confirmed,
                2 => BookingStatus.Confirmed,
                _ => BookingStatus.PendingApproval,
            };

            var booking = new Booking
            {
                CarId = car.Id,
                GuestId = guestUser.Id,
                StartUtc = futureStart,
                EndUtc = futureEnd,
                Status = status,
                DailyRateUsd = dailyRate,
                Days = futureDays,
                SubtotalUsd = subtotal,
                CleaningFeeUsd = cleaningFee,
                ServiceFeeUsd = serviceFee,
                TaxesUsd = taxes,
                SecurityDepositHoldUsd = car.SecurityDepositUsd,
                TotalChargedUsd = total,
                HostPayoutUsd = hostPayout,
                GuestMessage = "Looking forward to the trip!",
                ConfirmedAt = status == BookingStatus.Confirmed ? now.AddDays(-1) : null,
                CreatedAt = now.AddDays(-2),
            };

            _db.Bookings.Add(booking);
            _bookings.Add(booking);
        }

        await _db.SaveChangesAsync();
    }

    private static readonly string[] BookingMessages = {
        "Sayohatni kutib qolganman!",
        "Dam olish kuni uchun mashina kerak. Zo'r bo'ladi!",
        "Mashinangizga ehtiyotkorona munosabatda bo'laman.",
        "Do'stlar bilan tog'ga sayohat, juda hayajonliyman!",
        "Ish safari uchun ishonchli transport kerak.",
        "Birinchi marta ijaraga olayapman, qiziq!",
        "Turmush to'yi uchun kutilmagan sovg'a!",
        "Oilaviy dam olish, bolalar juda xursand!",
    };

    private async Task SeedReviewsAsync()
    {
        var completedBookings = _bookings.Where(b => b.Status == BookingStatus.Completed).ToList();

        foreach (var booking in completedBookings)
        {
            var car = _cars.First(c => c.Id == booking.CarId);
            var host = _users.First(u => u.Id == car.OwnerId);
            var guest = _users.First(u => u.Id == booking.GuestId);

            // Guest reviews host & car (~80% leave reviews)
            if (_rng.NextDouble() < 0.8)
            {
                var rating = _rng.Next(3, 6);
                _db.Reviews.Add(new Review
                {
                    BookingId = booking.Id,
                    AuthorId = guest.Id,
                    SubjectId = host.Id,
                    AuthorRole = ReviewAuthorRole.Guest,
                    CarId = car.Id,
                    Rating = rating,
                    CleanlinessRating = Math.Min(5, rating + _rng.Next(-1, 2)),
                    CommunicationRating = Math.Min(5, rating + _rng.Next(-1, 2)),
                    AccuracyRating = Math.Min(5, rating + _rng.Next(-1, 2)),
                    Comment = GuestReviewComments[_rng.Next(GuestReviewComments.Length)],
                    IsPublished = true,
                    CreatedAt = booking.CompletedAt!.Value.AddDays(_rng.Next(1, 5)),
                });
            }

            // Host reviews guest (~70% leave reviews)
            if (_rng.NextDouble() < 0.7)
            {
                var rating = _rng.Next(3, 6);
                _db.Reviews.Add(new Review
                {
                    BookingId = booking.Id,
                    AuthorId = host.Id,
                    SubjectId = guest.Id,
                    AuthorRole = ReviewAuthorRole.Host,
                    Rating = rating,
                    CommunicationRating = Math.Min(5, rating + _rng.Next(-1, 2)),
                    Comment = HostReviewComments[_rng.Next(HostReviewComments.Length)],
                    IsPublished = true,
                    CreatedAt = booking.CompletedAt!.Value.AddDays(_rng.Next(1, 5)),
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    private static readonly string[] GuestReviewComments = {
        "Ajoyib mashina, ta'rifga to'liq mos keldi! Egasi juda samimiy edi.",
        "Umumiy tajriba zo'r. Mashina toza va yaxshi holatda edi.",
        "Haydashdan juda zavqlandim. Albatta yana ijaraga olaman.",
        "Mashina sayohatimiz uchun juda qulay bo'ldi. Olish va topshirish oson.",
        "Zoʼr transport, uzoq safar uchun juda qulay.",
        "Mashina yaxshi yurdi, egasi juda yordamberuvchi edi.",
        "Pulga arziydi. Mashina kam yurgan va yaxshi holda.",
        "Hammasi silliq o'tdi. Zo'r mashina. Tavsiya qilaman!",
        "Mashina e'londagidek edi. Aloqa a'lo darajada.",
        "Bu mashina bilan dam olishimiz ajoyib o'tdi!",
    };

    private static readonly string[] HostReviewComments = {
        "Zo'r mehmon! Mashinani ideal holatda qaytardi.",
        "Juda hurmatli ijarachi. Yana berib turaman.",
        "A'lo aloqa va o'z vaqtida qaytardi.",
        "Mashina toza va to'liq bak bilan qaytdi. 5 yulduz!",
        "Juda samimiy va mas'uliyatli. Tavsiya qilaman.",
        "Hech qanday muammo yo'q edi. O'z mashinasidek ehtiyot qildi.",
        "Vaqtli va odobli. Namunali mehmon!",
        "Albatta yana ijaraga beraman. A'lo mehmon.",
    };

    private async Task SeedConversationsAsync()
    {
        // Create conversations for recent bookings
        var recentBookings = _bookings
            .Where(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Confirmed)
            .OrderByDescending(b => b.CreatedAt)
            .Take(20)
            .ToList();

        foreach (var booking in recentBookings)
        {
            var car = _cars.First(c => c.Id == booking.CarId);
            var host = _users.First(u => u.Id == car.OwnerId);
            var guest = _users.First(u => u.Id == booking.GuestId);

            var conversation = new Conversation
            {
                BookingId = booking.Id,
                CreatedAt = booking.CreatedAt.AddHours(1),
            };

            // Add 2-4 messages
            var msgCount = _rng.Next(2, 5);
            var msgTime = conversation.CreatedAt;

            for (var m = 0; m < msgCount; m++)
            {
                msgTime = msgTime.AddMinutes(_rng.Next(5, 120));
                var isGuestMsg = m % 2 == 0;
                conversation.Messages.Add(new Message
                {
                    SenderId = isGuestMsg ? guest.Id : host.Id,
                    Body = isGuestMsg
                        ? ConversationGuestMessages[_rng.Next(ConversationGuestMessages.Length)]
                        : ConversationHostMessages[_rng.Next(ConversationHostMessages.Length)],
                    SentAt = msgTime,
                    ReadAt = msgTime.AddMinutes(_rng.Next(5, 60)),
                    CreatedAt = msgTime,
                });
            }

            _db.Conversations.Add(conversation);
        }

        await _db.SaveChangesAsync();
    }

    private static readonly string[] ConversationGuestMessages = {
        "Salom! Mashina shu sanalarda bo'shmi?",
        "Mashinani qayerdan olaman, aniq manzil bering?",
        "Bronni yana bir kunga uzaytirsa bo'ladimi?",
        "Tasdiqlganingiz uchun rahmat! Kutib qolganman.",
        "Mashina bilan zaryadlash kabeli beriladi?",
        "Mashinda uy hayvoni olib yursa bo'ladimi?",
        "Zo'r, ertalab soat 10 da olaman.",
    };

    private static readonly string[] ConversationHostMessages = {
        "Ha, bo'sh! Hozir bronni tasdiqlayman.",
        "Mening hovlidam olasiz, tasdiqdan keyin aniq manzil yuboraman.",
        "Albatta, yana bir kun mumkin. Bronni o'zgartiraman.",
        "Marhamat! Mashina yangi yuvilgan holda tayyor bo'ladi.",
        "Ha, zaryadlash kabeli bagajnikda.",
        "Kichik itlar bo'ladi, faqat o'rindig'ni yopib oling.",
        "Zo'r, kutib turaman!",
    };

    private async Task SeedNotificationsAsync()
    {
        foreach (var user in _users.Take(10))
        {
            var types = Enum.GetValues<NotificationType>();
            var count = _rng.Next(3, 8);
            for (var i = 0; i < count; i++)
            {
                var type = types[_rng.Next(types.Length)];
                _db.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Type = type,
                    Title = GetNotificationTitle(type),
                    Body = GetNotificationBody(type),
                    IsRead = _rng.NextDouble() > 0.4,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(0, 30)).AddHours(-_rng.Next(0, 24)),
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    private static string GetNotificationTitle(NotificationType type) => type switch
    {
        NotificationType.BookingRequested => "New Booking Request",
        NotificationType.BookingConfirmed => "Booking Confirmed",
        NotificationType.BookingRejected => "Booking Declined",
        NotificationType.BookingCancelled => "Booking Cancelled",
        NotificationType.BookingCheckIn => "Trip Started",
        NotificationType.BookingCheckOut => "Trip Completed",
        NotificationType.BookingCompleted => "Booking Finalized",
        NotificationType.ReviewReceived => "New Review",
        NotificationType.NewMessage => "New Message",
        NotificationType.PayoutProcessed => "Payout Processed",
        NotificationType.ListingApproved => "Listing Approved",
        NotificationType.ListingRejected => "Listing Needs Changes",
        _ => "Notification",
    };

    private static string GetNotificationBody(NotificationType type) => type switch
    {
        NotificationType.BookingRequested => "You have a new booking request. Review and respond within 24 hours.",
        NotificationType.BookingConfirmed => "Great news! Your booking has been confirmed by the host.",
        NotificationType.BookingRejected => "Unfortunately, the host declined your booking request.",
        NotificationType.BookingCancelled => "A booking has been cancelled.",
        NotificationType.BookingCheckIn => "Your trip has begun. Enjoy the ride!",
        NotificationType.BookingCheckOut => "Your trip is complete. Don't forget to leave a review!",
        NotificationType.BookingCompleted => "Your booking has been finalized and payment processed.",
        NotificationType.ReviewReceived => "Someone left you a review. Check it out!",
        NotificationType.NewMessage => "You have a new message in your conversation.",
        NotificationType.PayoutProcessed => "Your payout has been processed and is on its way.",
        NotificationType.ListingApproved => "Your car listing has been approved and is now live!",
        NotificationType.ListingRejected => "Your car listing needs some changes before it can go live.",
        _ => "You have a new notification.",
    };
}
