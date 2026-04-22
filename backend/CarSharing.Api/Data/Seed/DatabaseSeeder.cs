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
        await SeedSystemUserAsync();
        await SeedSpecialAccountsAsync();
        await SeedRegularUsersAsync();
        await SeedCarsAsync();
        await SeedBookingsAsync();
        await SeedReviewsAsync();
        await SeedConversationsAsync();
        await SeedNotificationsAsync();
        await SeedKycVerificationsAsync();
        await SeedDisputesAsync();
        await SeedOnboardingUsersAsync();
        await SeedHostUsersAsync();

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

    private static readonly Guid SystemUserId = new Guid("00000000-0000-0000-0000-000000000001");

    private async Task SeedSystemUserAsync()
    {
        if (await _db.Users.AnyAsync(u => u.Id == SystemUserId)) return;

        var systemUser = new ApplicationUser
        {
            Id = SystemUserId,
            UserName = "system@carsharing.internal",
            NormalizedUserName = "SYSTEM@CARSHARING.INTERNAL",
            Email = "system@carsharing.internal",
            NormalizedEmail = "SYSTEM@CARSHARING.INTERNAL",
            EmailConfirmed = true,
            FirstName = "CarSharing",
            LastName = "System",
            IsSystemUser = true,
            IsPhoneVerified = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            PasswordHash = "SYSTEM_ACCOUNT_NO_LOGIN",
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
        };

        _db.Users.Add(systemUser);
        await _db.SaveChangesAsync();
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
        // Select bookings that involve the seeded guest/host accounts specifically
        var guestUser = _users.First(u => u.Email == "guest@CarSharing.dev");
        var hostUser  = _users.First(u => u.Email == "host@CarSharing.dev");

        // Take last 25 bookings total — prioritize the seeded accounts
        var guestBookings = _bookings
            .Where(b => b.GuestId == guestUser.Id)
            .OrderByDescending(b => b.CreatedAt)
            .Take(8)
            .ToList();

        var hostBookings = _bookings
            .Where(b => _cars.Any(c => c.Id == b.CarId && c.OwnerId == hostUser.Id))
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .ToList();

        var otherBookings = _bookings
            .Except(guestBookings)
            .Except(hostBookings)
            .OrderByDescending(b => b.CreatedAt)
            .Take(12)
            .ToList();

        var allBookings = guestBookings
            .Concat(hostBookings)
            .Concat(otherBookings)
            .DistinctBy(b => b.Id)
            .ToList();

        var msgTime = DateTimeOffset.UtcNow.AddDays(-30);
        var cardIdx = 0; // track how many have booking cards (we want ≥ 3)

        foreach (var (booking, idx) in allBookings.Select((b, i) => (b, i)))
        {
            var car = _cars.First(c => c.Id == booking.CarId);
            var host = _users.First(u => u.Id == car.OwnerId);
            var guest = _users.First(u => u.Id == booking.GuestId);

            var conversationTime = booking.CreatedAt.AddMinutes(5);
            var conversation = new Conversation
            {
                BookingId = booking.Id,
                CreatedAt = conversationTime,
            };

            var includeBookingCard = cardIdx < 5; // first 5 conversations get a booking card
            var emptyConversation  = idx == allBookings.Count - 1; // last one stays empty

            if (!emptyConversation)
            {
                var t = conversationTime;

                // 1. BookingCard system message
                if (includeBookingCard)
                {
                    conversation.Messages.Add(new Message
                    {
                        SenderId  = SystemUserId,
                        Type      = MessageType.BookingCard,
                        BookingId = booking.Id,
                        SentAt    = t,
                        ReadAt    = t.AddMinutes(10),
                        CreatedAt = t,
                    });
                    t = t.AddMinutes(5);
                    cardIdx++;
                }

                // 2. Text messages back-and-forth
                var msgCount = _rng.Next(2, 6);
                for (var m = 0; m < msgCount; m++)
                {
                    t = t.AddMinutes(_rng.Next(5, 180));
                    var isGuestMsg = m % 2 == 0;
                    var isRead = t < DateTimeOffset.UtcNow.AddDays(-1) || _rng.NextDouble() > 0.35;
                    conversation.Messages.Add(new Message
                    {
                        SenderId  = isGuestMsg ? guest.Id : host.Id,
                        Body      = isGuestMsg
                            ? ConversationGuestMessages[_rng.Next(ConversationGuestMessages.Length)]
                            : ConversationHostMessages[_rng.Next(ConversationHostMessages.Length)],
                        SentAt    = t,
                        ReadAt    = isRead ? t.AddMinutes(_rng.Next(5, 90)) : null,
                        CreatedAt = t,
                    });
                }
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

    private async Task SeedKycVerificationsAsync()
    {
        var regularUsers = _users.Where(u =>
            u.Email != "admin@CarSharing.dev").ToList();

        // Some users have approved KYC
        foreach (var user in regularUsers.Take(10))
        {
            _db.KycVerifications.Add(new KycVerification
            {
                UserId = user.Id,
                DocumentType = _rng.NextDouble() > 0.5 ? KycDocumentType.Passport : KycDocumentType.DriverLicense,
                DocumentFrontUrl = "https://placehold.co/600x400/png?text=ID+Front",
                DocumentBackUrl = "https://placehold.co/600x400/png?text=ID+Back",
                SelfieUrl = "https://placehold.co/400x400/png?text=Selfie",
                DocumentNumber = $"AA{_rng.Next(1000000, 9999999)}",
                DocumentExpiry = DateTimeOffset.UtcNow.AddYears(_rng.Next(1, 5)),
                Status = KycStatus.Approved,
                ReviewedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(10, 90)),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(30, 120)),
            });
        }

        // Some pending
        foreach (var user in regularUsers.Skip(10).Take(5))
        {
            _db.KycVerifications.Add(new KycVerification
            {
                UserId = user.Id,
                DocumentType = KycDocumentType.NationalId,
                DocumentFrontUrl = "https://placehold.co/600x400/png?text=NatID+Front",
                DocumentBackUrl = "https://placehold.co/600x400/png?text=NatID+Back",
                SelfieUrl = "https://placehold.co/400x400/png?text=Selfie",
                DocumentNumber = $"AB{_rng.Next(1000000, 9999999)}",
                DocumentExpiry = DateTimeOffset.UtcNow.AddYears(3),
                Status = KycStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(1, 10)),
            });
        }

        // One rejected
        if (regularUsers.Count > 15)
        {
            _db.KycVerifications.Add(new KycVerification
            {
                UserId = regularUsers[15].Id,
                DocumentType = KycDocumentType.Passport,
                DocumentFrontUrl = "https://placehold.co/600x400/png?text=Blurry+Photo",
                Status = KycStatus.Rejected,
                RejectionReason = "Document photo is blurry and unreadable. Please resubmit with a clear photo.",
                ReviewedAt = DateTimeOffset.UtcNow.AddDays(-5),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15),
            });
        }

        await _db.SaveChangesAsync();
    }

    private async Task SeedDisputesAsync()
    {
        var completedBookings = _bookings.Where(b => b.Status == BookingStatus.Completed).ToList();
        if (completedBookings.Count < 5) return;

        var disputeData = new[]
        {
            (DisputeCategory.VehicleDamage, "Found a scratch on the rear bumper that was not there before the trip. Photos attached."),
            (DisputeCategory.CleanlinessIssue, "The car was returned with significant mud and dirt inside. Requires professional cleaning."),
            (DisputeCategory.LateFee, "Guest returned the vehicle 6 hours late without prior notification."),
            (DisputeCategory.WrongVehicle, "The vehicle provided was a different color than advertised in the listing."),
            (DisputeCategory.SafetyIssue, "Check engine light was on during the trip. Felt unsafe driving."),
        };

        for (var i = 0; i < Math.Min(5, completedBookings.Count); i++)
        {
            var booking = completedBookings[i];
            var car = _cars.First(c => c.Id == booking.CarId);
            var (category, description) = disputeData[i];

            var dispute = new Dispute
            {
                BookingId = booking.Id,
                FiledById = i % 2 == 0 ? car.OwnerId : booking.GuestId,
                Category = category,
                Description = description,
                Status = i < 2 ? DisputeStatus.Open : i < 4 ? DisputeStatus.InReview : DisputeStatus.Resolved,
                Resolution = i == 4 ? "Partial refund issued. Maintenance inspection required for the vehicle." : null,
                RefundAmount = i == 4 ? 50000m : null,
                ResolvedAt = i == 4 ? DateTimeOffset.UtcNow.AddDays(-2) : null,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-_rng.Next(1, 20)),
            };

            _db.Disputes.Add(dispute);
        }

        await _db.SaveChangesAsync();
    }

    private async Task SeedOnboardingUsersAsync()
    {
        // 2x Step1Done - just registered via the wizard
        var s1a = await CreateUserAsync("onboard.step1a@example.com", "Password1!", "Alex", "Morgan", "Just signed up", true, false);
        await _userManager.AddToRoleAsync(s1a, "User");
        s1a.OnboardingStatus = ProfileCompletionStatus.Step1Done;

        var s1b = await CreateUserAsync("onboard.step1b@example.com", "Password1!", "Taylor", "Smith", "New user", true, false);
        await _userManager.AddToRoleAsync(s1b, "User");
        s1b.OnboardingStatus = ProfileCompletionStatus.Step1Done;

        // 2x Step2Done - filled personal details
        var s2a = await CreateUserAsync("onboard.step2a@example.com", "Password1!", "Jordan", "Lee", "Filled my details", true, false);
        await _userManager.AddToRoleAsync(s2a, "User");
        s2a.OnboardingStatus = ProfileCompletionStatus.Step2Done;
        s2a.MiddleName = "Michael";
        s2a.HomeAddressLine = "123 Main Street";
        s2a.HomeCity = "Tashkent";
        s2a.HomeRegionId = "TSH";
        s2a.HomePostalCode = "100000";
        s2a.HomeLat = 41.2995m;
        s2a.HomeLng = 69.2401m;

        var s2b = await CreateUserAsync("onboard.step2b@example.com", "Password1!", "Casey", "Brown", "Working on profile", true, false);
        await _userManager.AddToRoleAsync(s2b, "User");
        s2b.OnboardingStatus = ProfileCompletionStatus.Step2Done;
        s2b.HomeAddressLine = "456 Oak Avenue";
        s2b.HomeCity = "Samarkand";
        s2b.HomeRegionId = "SAM";
        s2b.HomePostalCode = "140100";
        s2b.HomeLat = 39.6542m;
        s2b.HomeLng = 66.9597m;

        // 3x Step3Done - uploaded license (DocumentsSubmitted)
        var s3a = await CreateUserAsync("onboard.step3a@example.com", "Password1!", "Riley", "Davis", "License uploaded", true, false);
        await _userManager.AddToRoleAsync(s3a, "User");
        s3a.OnboardingStatus = ProfileCompletionStatus.Step3Done;
        s3a.DriverLicenseNumber = "DL-001234";
        s3a.DriverLicenseExpiry = DateTimeOffset.UtcNow.AddYears(3);
        s3a.DriverLicensePhotoUrl = "https://placehold.co/600x400/png?text=License+Front";
        s3a.DriverLicenseBackUrl = "https://placehold.co/600x400/png?text=License+Back";
        s3a.DriverLicenseSelfieUrl = "https://placehold.co/400x400/png?text=License+Selfie";
        s3a.LicenseIssuedCountry = "UZ";
        s3a.LicenseIssuedRegionId = "TSH";

        var s3b = await CreateUserAsync("onboard.step3b@example.com", "Password1!", "Morgan", "Wilson", "License done", true, false);
        await _userManager.AddToRoleAsync(s3b, "User");
        s3b.OnboardingStatus = ProfileCompletionStatus.Step3Done;
        s3b.DriverLicenseNumber = "DL-005678";
        s3b.DriverLicenseExpiry = DateTimeOffset.UtcNow.AddYears(2);
        s3b.DriverLicensePhotoUrl = "https://placehold.co/600x400/png?text=License+Front";
        s3b.DriverLicenseBackUrl = "https://placehold.co/600x400/png?text=License+Back";
        s3b.DriverLicenseSelfieUrl = "https://placehold.co/400x400/png?text=License+Selfie";
        s3b.LicenseIssuedCountry = "UZ";
        s3b.LicenseIssuedRegionId = "SAM";

        var s3c = await CreateUserAsync("onboard.step3c@example.com", "Password1!", "Quinn", "Johnson", "License ready", true, false);
        await _userManager.AddToRoleAsync(s3c, "User");
        s3c.OnboardingStatus = ProfileCompletionStatus.Step3Done;
        s3c.DriverLicenseNumber = "DL-009012";
        s3c.DriverLicenseExpiry = DateTimeOffset.UtcNow.AddYears(4);
        s3c.DriverLicensePhotoUrl = "https://placehold.co/600x400/png?text=License+Front";
        s3c.DriverLicenseBackUrl = "https://placehold.co/600x400/png?text=License+Back";
        s3c.DriverLicenseSelfieUrl = "https://placehold.co/400x400/png?text=License+Selfie";
        s3c.LicenseIssuedCountry = "UZ";
        s3c.LicenseIssuedRegionId = "BUX";

        // 2x Step4Done - one with passport, one with national ID
        var s4a = await CreateUserAsync("onboard.step4a@example.com", "Password1!", "Avery", "Taylor", "ID verified", true, false);
        await _userManager.AddToRoleAsync(s4a, "User");
        s4a.OnboardingStatus = ProfileCompletionStatus.Step4Done;
        s4a.IdentityDocumentType = IdentityDocumentType.Passport;
        s4a.IdentityDocumentNumber = "AA1234567";
        s4a.IdentityDocumentFrontUrl = "https://placehold.co/600x400/png?text=Passport+Front";
        s4a.IdentitySelfieUrl = "https://placehold.co/400x400/png?text=Selfie";

        var s4b = await CreateUserAsync("onboard.step4b@example.com", "Password1!", "Dakota", "Anderson", "Almost done", true, false);
        await _userManager.AddToRoleAsync(s4b, "User");
        s4b.OnboardingStatus = ProfileCompletionStatus.Step4Done;
        s4b.IdentityDocumentType = IdentityDocumentType.NationalId;
        s4b.IdentityDocumentNumber = "AB7654321";
        s4b.IdentityDocumentFrontUrl = "https://placehold.co/600x400/png?text=NatID+Front";
        s4b.IdentityDocumentBackUrl = "https://placehold.co/600x400/png?text=NatID+Back";
        s4b.IdentitySelfieUrl = "https://placehold.co/400x400/png?text=Selfie";

        // 1x Complete - fully onboarded
        var comp = await CreateUserAsync("onboard.complete@example.com", "Password1!", "Sam", "Martinez", "Fully onboarded", true, true);
        await _userManager.AddToRoleAsync(comp, "User");
        comp.OnboardingStatus = ProfileCompletionStatus.Complete;
        comp.CardLast4 = "4242";
        comp.CardBrand = "Visa";
        comp.CardholderName = "SAM MARTINEZ";
        comp.PaymentMethodId = "seti_fake_seed_complete";

        // 1x Rejected - license was blurry
        var rej = await CreateUserAsync("onboard.rejected@example.com", "Password1!", "Jamie", "Clark", "Rejected submission", true, false);
        await _userManager.AddToRoleAsync(rej, "User");
        rej.OnboardingStatus = ProfileCompletionStatus.Rejected;
        rej.DriverLicensePhotoUrl = "https://placehold.co/600x400/png?text=Blurry+License";

        await _db.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} onboarding users at various stages.", 11);

        // Seed email-verification-specific users
        await SeedEmailVerificationUsersAsync();
    }

    private async Task SeedEmailVerificationUsersAsync()
    {
        // User with a live, unconsumed verification code
        var unverified = await CreateUserAsync(
            "unverified@carsharing.dev", "Password1!", "Unverified", "User",
            "Just registered, email not yet verified", false, false);
        await _userManager.AddToRoleAsync(unverified, "User");
        unverified.OnboardingStatus = ProfileCompletionStatus.Step1Done;
        unverified.EmailConfirmed = false;

        var knownCode = "123456";
        var codeHashBytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(knownCode));
        var codeHash = Convert.ToHexString(codeHashBytes).ToLowerInvariant();

        _db.EmailVerificationCodes.Add(new EmailVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = unverified.Id,
            CodeHash = codeHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
            CreatedAt = DateTimeOffset.UtcNow,
            AttemptCount = 0
        });

        // User with a consumed (exhausted) verification code
        var consumed = await CreateUserAsync(
            "consumed-code@carsharing.dev", "Password1!", "Consumed", "Code",
            "Exhausted all verify attempts", false, false);
        await _userManager.AddToRoleAsync(consumed, "User");
        consumed.OnboardingStatus = ProfileCompletionStatus.Step1Done;
        consumed.EmailConfirmed = false;

        _db.EmailVerificationCodes.Add(new EmailVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = consumed.Id,
            CodeHash = codeHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-2),
            ConsumedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            AttemptCount = 5
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Seeded email verification test users.");
    }

    private async Task SeedHostUsersAsync()
    {
        // ── helpers ─────────────────────────────────────────────────────────
        var faker = new Random(77);

        async Task<ApplicationUser> MakeHostUser(string email, string pass, string first, string last, HostOnboardingStatus status, bool kycApproved)
        {
            var u = await CreateUserAsync(email, pass, first, last, string.Empty, true, kycApproved);
            await _userManager.AddToRoleAsync(u, "User");
            u.HostOnboardingStatus = status;
            if (kycApproved)
            {
                u.IsIdentityVerified = true;
                u.IdentityDocumentType = IdentityDocumentType.Passport;
                u.IdentityDocumentNumber = $"AA{faker.Next(1000000, 9999999)}";
                u.IdentityDocumentFrontUrl = "https://placehold.co/600x400/png?text=Passport";
                u.IdentitySelfieUrl = "https://placehold.co/400x400/png?text=Selfie";
            }
            return u;
        }

        // 1. IdentityConfirmed – started host onboarding, identity confirmed only
        var hIdent = await MakeHostUser("host.identity@example.com", "Password1!", "Nodir", "Yusupov", HostOnboardingStatus.IdentityConfirmed, true);

        // 2. PayoutAdded – payout added, agreement not signed
        var hPayout = await MakeHostUser("host.payout@example.com", "Password1!", "Murod", "Eshmatov", HostOnboardingStatus.PayoutAdded, true);
        var pm1 = new PayoutMethod
        {
            UserId = hPayout.Id,
            Type = PayoutMethodType.UzcardCard,
            Brand = "Uzcard",
            Last4 = "8877",
            HolderName = "MUROD ESHMATOV",
            IsDefault = true,
            ProviderReference = "pm_fake_payout_seed_1",
        };
        _db.PayoutMethods.Add(pm1);
        hPayout.HostPayoutMethodId = pm1.Id;

        // 3. Complete but no cars – fully onboarded host, no listings yet
        var hComplete = await MakeHostUser("host.complete@example.com", "Password1!", "Dilnoza", "Karimova", HostOnboardingStatus.Complete, true);
        hComplete.HostAgreementSignedAt = DateTimeOffset.UtcNow.AddDays(-3);
        hComplete.HostAgreementVersion = "1.0";
        var pm2 = new PayoutMethod
        {
            UserId = hComplete.Id,
            Type = PayoutMethodType.HumoCard,
            Brand = "Humo",
            Last4 = "4321",
            HolderName = "DILNOZA KARIMOVA",
            IsDefault = true,
            ProviderReference = "pm_fake_payout_seed_2",
        };
        _db.PayoutMethods.Add(pm2);
        hComplete.HostPayoutMethodId = pm2.Id;

        // 4-7. Four full hosts with 1-3 listed cars each
        var fullHosts = new[]
        {
            ("host.full1@example.com", "Akbar", "Toshmatov"),
            ("host.full2@example.com", "Zulfiya", "Nazarova"),
            ("host.full3@example.com", "Bobur", "Holiqov"),
            ("host.full4@example.com", "Sarvinoz", "Mirzaeva"),
        };

        string[] makes = { "Cobalt", "Nexia", "Malibu", "Lacetti", "Damas" };
        string[] models = { "1.5", "2", "LT", "SX", "Van" };
        string[] colors = { "White", "Black", "Silver", "Blue", "Red" };
        string[] cities = { "Tashkent", "Samarkand", "Bukhara", "Namangan" };
        double[] lats = { 41.2995, 39.6547, 39.7747, 40.9983 };
        double[] lngs = { 69.2401, 66.9758, 64.4286, 71.6726 };

        var hostCarIdx = 0;
        foreach (var (email, first, last) in fullHosts)
        {
            var h = await MakeHostUser(email, "Password1!", first, last, HostOnboardingStatus.Complete, true);
            h.HostAgreementSignedAt = DateTimeOffset.UtcNow.AddDays(-faker.Next(5, 30));
            h.HostAgreementVersion = "1.0";
            var pmH = new PayoutMethod
            {
                UserId = h.Id,
                Type = PayoutMethodType.VisaMasterCard,
                Brand = "Visa",
                Last4 = faker.Next(1000, 9999).ToString(),
                HolderName = $"{first.ToUpperInvariant()} {last.ToUpperInvariant()}",
                IsDefault = true,
                ProviderReference = $"pm_fake_seed_{Guid.NewGuid():N}",
            };
            _db.PayoutMethods.Add(pmH);
            h.HostPayoutMethodId = pmH.Id;

            var carCount = faker.Next(1, 4);
            for (var c = 0; c < carCount; c++)
            {
                var cityIdx = hostCarIdx % cities.Length;
                var car = new Car
                {
                    OwnerId = h.Id,
                    Make = makes[hostCarIdx % makes.Length],
                    Model = models[hostCarIdx % models.Length],
                    Year = faker.Next(2017, 2025),
                    Color = colors[hostCarIdx % colors.Length],
                    BodyType = BodyType.Sedan,
                    Transmission = Transmission.Manual,
                    FuelType = FuelType.Gasoline,
                    Seats = faker.Next(4, 6),
                    Doors = 4,
                    DailyPriceUsd = faker.Next(15, 60),
                    City = cities[cityIdx],
                    Country = "UZ",
                    Location = new Point(lngs[cityIdx] + (faker.NextDouble() - 0.5) * 0.1,
                                         lats[cityIdx] + (faker.NextDouble() - 0.5) * 0.1) { SRID = 4326 },
                    Status = CarStatus.Listed,
                    VehicleTier = VehicleTier.Economy,
                    OwnershipRelation = OwnershipRelation.RegisteredOwner,
                    PrivacyRadiusMeters = 300,
                    InsuranceExpiry = DateTimeOffset.UtcNow.AddYears(1),
                    TechnicalInspectionExpiry = DateTimeOffset.UtcNow.AddMonths(8),
                };
                _db.Cars.Add(car);
                _cars.Add(car);
                hostCarIdx++;
            }
        }

        // 3 drafts at various wizard steps
        var draftHost = hComplete;
        _db.CarDrafts.Add(new CarDraft
        {
            UserId = draftHost.Id,
            CurrentStep = CarDraftStep.VehicleIdentity,
            Make = "Cobalt",
            Model = "1.5",
            Year = 2021,
            Vin = "KNAGM4A77F5339901",
            PlateNumber = "01A777AA",
        });

        var draftHost2 = hIdent;
        _db.CarDrafts.Add(new CarDraft
        {
            UserId = draftHost2.Id,
            CurrentStep = CarDraftStep.Photos,
            Make = "Lacetti",
            Model = "SX",
            Year = 2019,
            Vin = "KLATF08Y1VB363636",
            PlateNumber = "30A123BB",
            InsurancePolicyUrl = "https://placehold.co/600x800/png?text=Insurance",
            InsuranceExpiry = DateTimeOffset.UtcNow.AddYears(1),
            TechPassportFrontUrl = "https://placehold.co/600x800/png?text=TechPassport+Front",
            TechPassportBackUrl = "https://placehold.co/600x800/png?text=TechPassport+Back",
        });

        _db.CarDrafts.Add(new CarDraft
        {
            UserId = hPayout.Id,
            CurrentStep = CarDraftStep.PricingRules,
            Make = "Nexia",
            Model = "2",
            Year = 2020,
            Vin = "WAUZZZ8K9BA123001",
            PlateNumber = "10B456CC",
            PhotosJson = "[\"https://placehold.co/800x600/png?text=Car+1\",\"https://placehold.co/800x600/png?text=Car+2\"]",
            City = "Tashkent",
            Lat = 41.2995m,
            Lng = 69.2401m,
        });

        // 5 PendingApproval cars (various scenarios)
        var pendingHost = hComplete;
        var pendingCars = new[]
        {
            new Car { OwnerId = pendingHost.Id, Make = "Lexus", Model = "RX 350", Year = 2022, Status = CarStatus.PendingApproval, VehicleTier = VehicleTier.Luxury, GpsTrackerInstalled = true, RequiresManualReview = true, City = "Tashkent", Country = "UZ", Vin = "2T2ZZMCA1NC000001", DailyPriceUsd = 120, Seats = 5, Doors = 4, Transmission = Transmission.Automatic, FuelType = FuelType.Gasoline, BodyType = BodyType.SUV, OwnershipRelation = OwnershipRelation.RegisteredOwner, InsuranceExpiry = DateTimeOffset.UtcNow.AddYears(1), Location = new Point(69.24, 41.30) { SRID = 4326 } },
            new Car { OwnerId = hIdent.Id, Make = "Toyota", Model = "Camry", Year = 2021, Status = CarStatus.PendingApproval, VehicleTier = VehicleTier.Premium, VinMismatchFlagged = true, RequiresManualReview = true, City = "Samarkand", Country = "UZ", Vin = "4T1BF1FK2CU123456", DailyPriceUsd = 60, Seats = 5, Doors = 4, Transmission = Transmission.Automatic, FuelType = FuelType.Gasoline, BodyType = BodyType.Sedan, OwnershipRelation = OwnershipRelation.RegisteredOwner, InsuranceExpiry = DateTimeOffset.UtcNow.AddDays(20), Location = new Point(66.97, 39.65) { SRID = 4326 } },
            new Car { OwnerId = hPayout.Id, Make = "Chevrolet", Model = "Malibu", Year = 2022, Status = CarStatus.PendingApproval, VehicleTier = VehicleTier.Standard, RequiresManualReview = false, City = "Bukhara", Country = "UZ", Vin = "1G1ZD5ST2JF123789", DailyPriceUsd = 45, Seats = 5, Doors = 4, Transmission = Transmission.Automatic, FuelType = FuelType.Gasoline, BodyType = BodyType.Sedan, OwnershipRelation = OwnershipRelation.RegisteredOwner, InsuranceExpiry = DateTimeOffset.UtcNow.AddYears(1), Location = new Point(64.43, 39.77) { SRID = 4326 } },
            new Car { OwnerId = pendingHost.Id, Make = "Kia", Model = "K5", Year = 2023, Status = CarStatus.PendingApproval, VehicleTier = VehicleTier.Standard, RequiresManualReview = true, City = "Tashkent", Country = "UZ", Vin = "5XXGT4L3XJG123000", DailyPriceUsd = 55, Seats = 5, Doors = 4, Transmission = Transmission.Automatic, FuelType = FuelType.Gasoline, BodyType = BodyType.Sedan, OwnershipRelation = OwnershipRelation.RegisteredOwner, InsuranceExpiry = DateTimeOffset.UtcNow.AddYears(2), Location = new Point(69.25, 41.31) { SRID = 4326 } },
            new Car { OwnerId = hIdent.Id, Make = "Hyundai", Model = "Sonata", Year = 2020, Status = CarStatus.PendingApproval, VehicleTier = VehicleTier.Economy, RequiresManualReview = false, City = "Namangan", Country = "UZ", Vin = "5NPE24AF1GH123999", DailyPriceUsd = 35, Seats = 5, Doors = 4, Transmission = Transmission.Automatic, FuelType = FuelType.Gasoline, BodyType = BodyType.Sedan, OwnershipRelation = OwnershipRelation.RegisteredOwner, InsuranceExpiry = DateTimeOffset.UtcNow.AddMonths(6), Location = new Point(71.67, 40.99) { SRID = 4326 } },
        };

        foreach (var pc in pendingCars)
        {
            _db.Cars.Add(pc);
            _cars.Add(pc);
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Seeded host-phase test users and listings.");
    }
}
