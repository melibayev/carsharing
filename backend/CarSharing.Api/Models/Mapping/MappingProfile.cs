using AutoMapper;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;

namespace CarSharing.Api.Models.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        DisableConstructorMapping();
        CreateMap<ApplicationUser, UserDto>();

        CreateMap<ApplicationUser, UserPublicDto>();

        CreateMap<CarPhoto, CarPhotoDto>();

        CreateMap<Car, CarListDto>()
            .ForMember(d => d.CoverPhotoUrl, o => o.MapFrom(s =>
                s.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()
                ?? s.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault()))
            .ForMember(d => d.PhotoUrls, o => o.MapFrom(s =>
                s.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).ToList()))
            .ForMember(d => d.DistanceKm, o => o.Ignore());

        CreateMap<Car, CarDetailDto>()
            .ForMember(d => d.Latitude, o => o.MapFrom(s => s.Location != null ? s.Location.Y : (double?)null))
            .ForMember(d => d.Longitude, o => o.MapFrom(s => s.Location != null ? s.Location.X : (double?)null))
            .ForMember(d => d.Features, o => o.MapFrom(s => s.CarFeatures.Select(cf => cf.Feature.Name).ToList()))
            .ForMember(d => d.Host, o => o.MapFrom(s => s.Owner))
            .ForMember(d => d.Reviews, o => o.MapFrom(s => s.Reviews.Where(r => r.IsPublished).OrderByDescending(r => r.CreatedAt).ToList()))
            .ForMember(d => d.BlockedDates, o => o.MapFrom(s => s.BlockedDates));

        CreateMap<Availability, AvailabilityBlockDto>()
            .ForMember(d => d.Reason, o => o.MapFrom(s => s.Reason.ToString()));

        CreateMap<Booking, BookingDto>()
            .ForMember(d => d.CarTitle, o => o.MapFrom(s => $"{s.Car.Year} {s.Car.Make} {s.Car.Model}"))
            .ForMember(d => d.CoverPhotoUrl, o => o.MapFrom(s =>
                s.Car.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()
                ?? s.Car.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault()))
            .ForMember(d => d.Guest, o => o.MapFrom(s => s.Guest))
            .ForMember(d => d.Host, o => o.MapFrom(s => s.Car.Owner))
            .ForMember(d => d.CanReview, o => o.Ignore());

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.AuthorName, o => o.MapFrom(s => $"{s.Author.FirstName} {s.Author.LastName}"))
            .ForMember(d => d.AuthorPhotoUrl, o => o.MapFrom(s => s.Author.ProfilePhotoUrl));

        CreateMap<Conversation, ConversationDto>()
            .ForMember(d => d.CarTitle, o => o.MapFrom(s => $"{s.Booking.Car.Year} {s.Booking.Car.Make} {s.Booking.Car.Model}"))
            .ForMember(d => d.CoverPhotoUrl, o => o.MapFrom(s =>
                s.Booking.Car.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()))
            .ForMember(d => d.OtherParty, o => o.Ignore())
            .ForMember(d => d.LastMessage, o => o.Ignore())
            .ForMember(d => d.UnreadCount, o => o.Ignore());

        CreateMap<Message, MessageDto>()
            .ForMember(d => d.SenderName, o => o.MapFrom(s => s.Sender != null
                ? $"{s.Sender.FirstName} {s.Sender.LastName}".Trim()
                : "System"))
            .ForMember(d => d.SenderPhotoUrl, o => o.MapFrom(s => s.Sender != null ? s.Sender.ProfilePhotoUrl : null))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.BookingPreview, o => o.Ignore());

        CreateMap<Notification, NotificationDto>();
    }
}
