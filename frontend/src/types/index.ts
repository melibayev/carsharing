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
  dateOfBirth: string | null;
  hostOnboardingStatus: HostOnboardingStatus;
  emailConfirmed: boolean;
}

export interface UserPublicDto {
  id: string;
  firstName: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  averageRatingAsHost: number;
  hostTripCount: number;
  createdAt: string;
  isAdmin?: boolean;
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
  latitude: number | null;
  longitude: number | null;
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
  bookingId: string | null;  // null for direct/support conversations
  carTitle: string | null;   // null for direct conversations
  carCity: string;
  seats: number;
  fuelType: string;
  coverPhotoUrl: string | null;
  otherParty: UserPublicDto | null;
  lastMessage: MessageDto | null;
  unreadCount: number;
}

export interface BookingPreviewDto {
  bookingId: string;
  carTitle: string;
  carPhotoUrl: string | null;
  city: string;
  seats: number;
  fuelType: string;
  startUtc: string;
  endUtc: string;
  totalUsd: number;
  status: string;
  days: number;
}

export interface MessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string | null;
  type: 'Text' | 'Image' | 'BookingCard';
  body: string | null;
  attachmentUrl: string | null;
  bookingPreview: BookingPreviewDto | null;
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
  phoneNumber: string | null;
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
  coverPhotoUrl: string | null;
  vinMismatchFlagged: boolean;
}

export interface AdminCarDetailDto {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  licensePlate: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  techPassportFrontUrl: string | null;
  techPassportBackUrl: string | null;
  insurancePolicyUrl: string | null;
  insuranceExpiry: string | null;
  technicalInspectionUrl: string | null;
  technicalInspectionExpiry: string | null;
  authorizationLetterUrl: string | null;
  gpsTrackerPhotoUrl: string | null;
  vinMismatchFlagged: boolean;
  ownershipRelation: string;
  photoUrls: string[];
  createdAt: string;
}

export interface AdminBookingDto {
  id: string;
  carTitle: string;
  coverPhotoUrl: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  hostName: string;
  hostEmail: string;
  status: BookingStatus;
  totalChargedUsd: number;
  startUtc: string;
  endUtc: string;
  createdAt: string;
  guestMessage: string | null;
  confirmedAt: string | null;
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
  EmailVerified = 'EmailVerified',
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
  middleName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  homeAddressLine?: string;
  homeCity?: string;
  homeRegionId?: string;
  homePostalCode?: string;
  gender?: string;
  licenseIssuedCountry?: string;
  licenseIssuedRegionId?: string;
  driverLicenseExpiry?: string;
  driverLicensePhotoUrl?: string;
  driverLicenseBackUrl?: string;
  driverLicenseSelfieUrl?: string;
  identityDocumentType?: string;
  identityDocumentFrontUrl?: string;
  identityDocumentBackUrl?: string;
  identitySelfieUrl?: string;
  step4Skipped: boolean;
  cardLast4?: string;
  cardBrand?: string;
  cardholderName?: string;
}

export interface OnboardingStep2Request {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender?: string;
  phoneNumber: string;
  homeAddressLine: string;
  homeCity: string;
  homeRegionId: string;
  homePostalCode?: string;
  homeLat?: number;
  homeLng?: number;
}

export interface OnboardingStep3Request {
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  driverLicensePhotoUrl: string;
  driverLicenseBackUrl: string;
  driverLicenseSelfieUrl: string;
  licenseIssuedCountry?: string;
  licenseIssuedRegionId?: string;
}

export interface OnboardingStep4Request {
  skipped: boolean;
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
}

export interface OnboardingStep5Request {
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
  billingAddressJson?: string;
}

export interface DocumentUploadResponse {
  url: string;
}

export interface EmailAvailableResponse {
  available: boolean;
}

// === Host Phase Types ===

export type HostOnboardingStatus =
  | 'NotStarted'
  | 'IdentityConfirmed'
  | 'PayoutAdded'
  | 'AgreementSigned'
  | 'Complete';

export type PayoutMethodType =
  | 'UzcardCard'
  | 'HumoCard'
  | 'VisaMasterCard'
  | 'BankAccountUZS'
  | 'BankAccountUSD';

export type VehicleTier = 'Economy' | 'Standard' | 'Premium' | 'Luxury';

export type CarDraftStep =
  | 'VehicleIdentity'
  | 'OwnershipDocs'
  | 'Photos'
  | 'LocationAvailability'
  | 'PricingRules'
  | 'ReviewSubmit';

export interface EligibilityDto {
  canList: boolean;
  missing: string[];
}

export interface PayoutMethodDto {
  id: string;
  type: PayoutMethodType;
  brand: string;
  last4: string;
  holderName: string;
  bankName?: string;
  isDefault: boolean;
  addedAt: string;
}

export interface AttachPayoutMethodRequest {
  type: PayoutMethodType;
  brand: string;
  last4: string;
  holderName: string;
  bankName?: string;
  tokenizedDetails: string;
}

export interface SignAgreementRequest {
  version: string;
}

export interface CarDraftDto {
  id: string;
  currentStep: CarDraftStep;
  plateNumber?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  color?: string;
  odometerKm?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  doors?: number;
  bodyType?: string;
  vehicleTier?: string;
  ownershipRelation?: string;
  insurancePolicyUrl?: string;
  insuranceExpiry?: string;
  technicalInspectionUrl?: string;
  technicalInspectionExpiry?: string;
  gpsTrackerInstalled: boolean;
  photosJson?: string;
  addressLine?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  privacyRadiusMeters: number;
  canDeliverToAirports: boolean;
  deliveryLocationsJson?: string;
  selfCheckInAvailable: boolean;
  selfCheckInMethod?: string;
  advanceNoticeHours: number;
  minTripDays: number;
  maxTripDays: number;
  blockedDatesJson?: string;
  dailyPriceUzs?: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  cleaningFeeUzs: number;
  securityDepositUzs: number;
  dailyKmLimit: number;
  extraKmFeeUzs: number;
  rules?: string;
  customRules?: string;
  isInstantBook: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PatchDraftRequest = Partial<Omit<CarDraftDto, 'id' | 'createdAt' | 'updatedAt'>>;

export interface SubmitDraftResponse {
  carId: string;
  status: string;
  estimatedReviewMinutes: number;
}

export interface VinAvailableResponse {
  available: boolean;
}

export interface HostDashboardDto {
  revenueThisMonth: number;
  lastMonthRevenue: number;
  upcomingTrips: number;
  occupancy: number;
  averageRating: number;
}

export interface HostCarListDto {
  id: string;
  make: string;
  model: string;
  year: number;
  status: CarStatus;
  vehicleTier?: VehicleTier;
  dailyPriceUsd: number;
  averageRating: number;
  tripCount: number;
  coverPhotoUrl?: string;
}

// === Payment System ===

export interface AccountBalanceDto {
  availableUzs: number;
  lockedUzs: number;
  totalUzs: number;
  updatedAt: string;
}

export interface LedgerEntryDto {
  id: string;
  direction: 'Credit' | 'Debit';
  type: string;
  amountUzs: number;
  balanceAfterUzs: number;
  description: string;
  relatedBookingId: string | null;
  createdAt: string;
}

export interface TopUpIntentRequest {
  amountUzs: number;
  paymentMethodId?: string;
}

export interface TopUpIntentResponse {
  intentId: string;
  amountUzs: number;
  phoneHint: string;
}

export interface ConfirmTopUpRequest {
  intentId: string;
  code: string;
}

export interface UserPaymentMethodDto {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  phoneVerifiedAt: string | null;
}

export interface AddCardIntentRequest {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  cardholderName: string;
}

export interface AddCardIntentResponse {
  paymentMethodId: string;
  maskedCard: string;
  phoneHint: string;
}

export interface ConfirmCardRequest {
  paymentMethodId: string;
  code: string;
}

export interface ResendCardSmsRequest {
  paymentMethodId: string;
}

export interface PriceBreakdownDto {
  dailyRateUzs: number;
  days: number;
  subtotalUzs: number;
  cleaningFeeUzs: number;
  serviceFeeUzs: number;
  taxesUzs: number;
  totalUzs: number;
}

export interface CheckoutDto {
  booking: BookingDto;
  priceBreakdown: PriceBreakdownDto;
  balance: AccountBalanceDto;
  paymentMethods: UserPaymentMethodDto[];
  recommendedMethodId: string | null;
  lockExpiresAt: string;
}

export interface PayBookingRequest {
  method: 'AccountBalance' | 'Card';
  paymentMethodId?: string;
}

export interface PayBookingResponse {
  paymentId: string;
  status: string;
  bookingStatus: string;
}

export interface ReceiptDto {
  id: string;
  receiptNumber: string;
  bookingId: string;
  paymentId: string;
  totalUzs: number;
  generatedAt: string;
  emailedAt: string | null;
  pdfUrl: string | null;
}

