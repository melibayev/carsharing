// === Enums ===
export enum BodyType {
  Sedan = 'Sedan',
  SUV = 'SUV',
  Hatchback = 'Hatchback',
  Coupe = 'Coupe',
  Convertible = 'Convertible',
  Truck = 'Truck',
  Van = 'Van',
  Minivan = 'Minivan',
  Wagon = 'Wagon',
  SportsCar = 'SportsCar',
}

export enum Transmission {
  Automatic = 'Automatic',
  Manual = 'Manual',
}

export enum FuelType {
  Gasoline = 'Gasoline',
  Diesel = 'Diesel',
  Hybrid = 'Hybrid',
  Electric = 'Electric',
  PlugInHybrid = 'PlugInHybrid',
}

export enum CarStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Listed = 'Listed',
  Snoozed = 'Snoozed',
  Removed = 'Removed',
}

export enum BookingStatus {
  PendingApproval = 'PendingApproval',
  Confirmed = 'Confirmed',
  Rejected = 'Rejected',
  CancelledByGuest = 'CancelledByGuest',
  CancelledByHost = 'CancelledByHost',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Disputed = 'Disputed',
}

export enum ReviewAuthorRole {
  Guest = 'Guest',
  Host = 'Host',
}

export enum NotificationType {
  BookingRequested = 'BookingRequested',
  BookingConfirmed = 'BookingConfirmed',
  BookingRejected = 'BookingRejected',
  BookingCancelled = 'BookingCancelled',
  BookingCheckIn = 'BookingCheckIn',
  BookingCheckOut = 'BookingCheckOut',
  BookingCompleted = 'BookingCompleted',
  ReviewReceived = 'ReviewReceived',
  NewMessage = 'NewMessage',
  PayoutProcessed = 'PayoutProcessed',
  ListingApproved = 'ListingApproved',
  ListingRejected = 'ListingRejected',
  General = 'General',
}

// === Auth ===
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

// === User ===
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  averageRatingAsHost: number;
  averageRatingAsGuest: number;
  hostTripCount: number;
  guestTripCount: number;
  createdAt: string;
}

export interface UserPublicDto {
  id: string;
  firstName: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  averageRatingAsHost: number;
  hostTripCount: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
}

// === Car ===
export interface CarListDto {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  dailyPriceUsd: number;
  averageRating: number;
  tripCount: number;
  isInstantBook: boolean;
  bodyType: BodyType;
  transmission: Transmission;
  fuelType: FuelType;
  seats: number;
  coverPhotoUrl: string | null;
  photoUrls: string[];
  distanceKm: number | null;
}

export interface CarDetailDto {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  bodyType: BodyType;
  transmission: Transmission;
  fuelType: FuelType;
  seats: number;
  doors: number;
  color: string | null;
  odometerKm: number | null;
  dailyPriceUsd: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  cleaningFeeUsd: number;
  securityDepositUsd: number;
  minTripDays: number;
  maxTripDays: number;
  advanceNoticeHours: number;
  dailyMileageLimitKm: number | null;
  extraKmFeeUsd: number | null;
  addressLine: string | null;
  city: string;
  region: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  rules: string | null;
  status: CarStatus;
  isInstantBook: boolean;
  averageRating: number;
  tripCount: number;
  photos: CarPhotoDto[];
  features: string[];
  host: UserPublicDto | null;
  reviews: ReviewDto[];
  blockedDates: AvailabilityBlockDto[];
}

export interface CarPhotoDto {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface AvailabilityBlockDto {
  id: string;
  startUtc: string;
  endUtc: string;
  reason: string;
}

export interface CreateCarRequest {
  make: string;
  model: string;
  year: number;
  trim?: string;
  vin?: string;
  licensePlate?: string;
  licensePlateRegion?: string;
  bodyType: BodyType;
  transmission: Transmission;
  fuelType: FuelType;
  seats: number;
  doors: number;
  color?: string;
  odometerKm?: number;
  dailyPriceUsd: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  cleaningFeeUsd: number;
  securityDepositUsd: number;
  minTripDays: number;
  maxTripDays: number;
  advanceNoticeHours: number;
  dailyMileageLimitKm?: number;
  extraKmFeeUsd?: number;
  addressLine?: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  description?: string;
  rules?: string;
  isInstantBook: boolean;
  features?: string[];
}

export interface CarSearchParams {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  bodyType?: BodyType;
  make?: string;
  transmission?: Transmission;
  fuelType?: FuelType;
  seats?: number;
  features?: string;
  instantBook?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// === Booking ===
export interface QuoteRequest {
  carId: string;
  startUtc: string;
  endUtc: string;
}

export interface QuoteResponse {
  days: number;
  dailyRateUsd: number;
  subtotalUsd: number;
  discountAmount: number | null;
  discountType: string | null;
  cleaningFeeUsd: number;
  serviceFeeUsd: number;
  taxesUsd: number;
  securityDepositHoldUsd: number;
  totalChargedUsd: number;
  hostPayoutUsd: number;
}

export interface CreateBookingRequest {
  carId: string;
  startUtc: string;
  endUtc: string;
  guestMessage?: string;
}

export interface BookingDto {
  id: string;
  carId: string;
  guestId: string;
  carTitle: string;
  coverPhotoUrl: string | null;
  startUtc: string;
  endUtc: string;
  status: BookingStatus;
  dailyRateUsd: number;
  days: number;
  subtotalUsd: number;
  cleaningFeeUsd: number;
  serviceFeeUsd: number;
  taxesUsd: number;
  securityDepositHoldUsd: number;
  totalChargedUsd: number;
  hostPayoutUsd: number;
  guestMessage: string | null;
  hostResponseMessage: string | null;
  checkInOdometerKm: number | null;
  checkOutOdometerKm: number | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  guest: UserPublicDto | null;
  host: UserPublicDto | null;
  canReview: boolean;
}

// === Review ===
export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  cleanlinessRating?: number;
  communicationRating?: number;
  accuracyRating?: number;
  comment: string;
}

export interface ReviewDto {
  id: string;
  bookingId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  authorRole: ReviewAuthorRole;
  rating: number;
  cleanlinessRating: number | null;
  communicationRating: number | null;
  accuracyRating: number | null;
  comment: string;
  createdAt: string;
}

// === Message ===
export interface ConversationDto {
  id: string;
  bookingId: string;
  carTitle: string;
  coverPhotoUrl: string | null;
  otherParty: UserPublicDto | null;
  lastMessage: MessageDto | null;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string | null;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface SendMessageRequest {
  body: string;
}

// === Notification ===
export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

// === Admin ===
export interface AdminMetricsDto {
  totalUsers: number;
  totalCars: number;
  totalBookings: number;
  pendingApprovals: number;
  activeDisputes: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentActivity: RecentActivityDto[];
}

export interface RecentActivityDto {
  type: string;
  description: string;
  timestamp: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isIdentityVerified: boolean;
  hostTripCount: number;
  guestTripCount: number;
  createdAt: string;
  isBanned: boolean;
}

// === Common ===
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// === Earnings ===
export interface EarningsDto {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  totalTrips: number;
  monthlyBreakdown: MonthlyEarningDto[];
  byCarBreakdown: CarEarningDto[];
}

export interface MonthlyEarningDto {
  year: number;
  month: number;
  amount: number;
  trips: number;
}

export interface CarEarningDto {
  carId: string;
  carTitle: string;
  totalEarnings: number;
  tripCount: number;
}

// === KYC ===
export enum KycStatus {
  Pending = 'Pending',
  InReview = 'InReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum KycDocumentType {
  Passport = 'Passport',
  DriverLicense = 'DriverLicense',
  NationalId = 'NationalId',
}

export interface KycVerificationDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: KycStatus;
  documentType: KycDocumentType;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  documentNumber: string | null;
  documentExpiry: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
}

// === Dispute ===
export enum DisputeStatus {
  Open = 'Open',
  InReview = 'InReview',
  Resolved = 'Resolved',
  Escalated = 'Escalated',
  Closed = 'Closed',
}

export enum DisputeCategory {
  VehicleDamage = 'VehicleDamage',
  CleanlinessIssue = 'CleanlinessIssue',
  LateFee = 'LateFee',
  WrongVehicle = 'WrongVehicle',
  CancellationDispute = 'CancellationDispute',
  SafetyIssue = 'SafetyIssue',
  Other = 'Other',
}

export interface DisputeDto {
  id: string;
  bookingId: string;
  bookingTitle: string;
  filedById: string;
  filedByName: string;
  status: DisputeStatus;
  category: DisputeCategory;
  description: string;
  evidenceUrls: string[];
  resolution: string | null;
  refundAmount: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

// === Audit ===
export interface AuditLogDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  createdAt: string;
}

// === Admin Extended ===
export interface AdminCarDto {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  dailyPriceUsd: number;
  status: CarStatus;
  ownerName: string;
  ownerEmail: string;
  averageRating: number;
  tripCount: number;
  createdAt: string;
}

export interface AdminBookingDto {
  id: string;
  carTitle: string;
  guestName: string;
  hostName: string;
  status: BookingStatus;
  totalChargedUsd: number;
  startUtc: string;
  endUtc: string;
  createdAt: string;
}

export interface AdminFinanceDto {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  totalPayouts: number;
  completedBookings: number;
  averageBookingValue: number;
  monthlyBreakdown: MonthlyRevenueDto[];
}

export interface MonthlyRevenueDto {
  year: number;
  month: number;
  revenue: number;
  payouts: number;
  bookings: number;
}

// === Onboarding ===
export enum ProfileCompletionStatus {
  Step1Done = 'Step1Done',
  Step2Done = 'Step2Done',
  Step3Done = 'Step3Done',
  Step4Done = 'Step4Done',
  Complete = 'Complete',
  Rejected = 'Rejected',
}

export interface OnboardingStatusDto {
  status: ProfileCompletionStatus | null;
  currentStep: number;
  isComplete: boolean;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OnboardingStep2Request {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phoneNumber: string;
  addressLine1: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
}

export interface OnboardingStep3Request {
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  driverLicensePhotoUrl: string;
}

export interface OnboardingStep4Request {
  nationalIdNumber: string;
  nationalIdFrontUrl: string;
  nationalIdBackUrl?: string;
  selfieUrl: string;
}

export interface OnboardingStep5Request {
  paymentMethodLast4: string;
  paymentMethodBrand: string;
}

export interface DocumentUploadResponse {
  url: string;
}

export interface EmailAvailableResponse {
  available: boolean;
}
