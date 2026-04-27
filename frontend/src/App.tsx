import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/components/layout/root-layout';
import AuthGuard from '@/components/layout/auth-guard';
import { Loader2 } from 'lucide-react';

const Home = lazy(() => import('@/pages/home'));
const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const Search = lazy(() => import('@/pages/search'));
const CarDetail = lazy(() => import('@/pages/car-detail'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const BookingDetail = lazy(() => import('@/pages/booking-detail'));
const Messages = lazy(() => import('@/pages/messages'));
const Notifications = lazy(() => import('@/pages/notifications'));
const Profile = lazy(() => import('@/pages/profile'));
const KycWizard = lazy(() => import('@/pages/kyc'));
const Onboarding = lazy(() => import('@/pages/onboarding'));
const VerifyEmail = lazy(() => import('@/pages/onboarding/verify-email'));
const SetupChoice = lazy(() => import('@/pages/onboarding/setup-choice'));

const MyBookings = lazy(() => import('@/pages/my-bookings'));
const BecomeAHost = lazy(() => import('@/pages/host/become-a-host'));
const HostShell = lazy(() => import('@/components/host/HostShell'));
const HostDashboard = lazy(() => import('@/pages/host/index'));
const HostCars = lazy(() => import('@/pages/host/cars/index'));
const HostCarNew = lazy(() => import('@/pages/host/cars/new'));
const HostBookings = lazy(() => import('@/pages/host/bookings'));
const HostEarnings = lazy(() => import('@/pages/host/earnings'));

const AdminShell = lazy(() => import('@/components/admin/AdminShell'));
const AdminDashboard = lazy(() => import('@/pages/admin/index'));
const AdminUsers = lazy(() => import('@/pages/admin/users'));
const AdminCars = lazy(() => import('@/pages/admin/cars'));
const AdminBookings = lazy(() => import('@/pages/admin/bookings'));
const AdminVerifications = lazy(() => import('@/pages/admin/verifications'));
const AdminDisputes = lazy(() => import('@/pages/admin/disputes'));
const AdminFinance = lazy(() => import('@/pages/admin/finance'));
const AdminAudit = lazy(() => import('@/pages/admin/audit'));

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Standalone pages (no navbar/footer) */}
        <Route path="register" element={<Register />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="onboarding/verify-email" element={<VerifyEmail />} />
        <Route path="onboarding/setup-choice" element={<SetupChoice />} />

        <Route element={<RootLayout />}>
          {/* Public */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="search" element={<Search />} />
          <Route path="cars/:id" element={<CarDetail />} />

          {/* Auth required */}
          <Route element={<AuthGuard />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="host/become-a-host" element={<BecomeAHost />} />
            <Route path="host" element={<HostShell />}>
              <Route index element={<HostDashboard />} />
              <Route path="cars" element={<HostCars />} />
              <Route path="cars/new" element={<HostCarNew />} />
              <Route path="bookings" element={<HostBookings />} />
              <Route path="bookings/:id" element={<BookingDetail />} />
              <Route path="earnings" element={<HostEarnings />} />
            </Route>
            <Route path="kyc" element={<KycWizard />} />
          </Route>

          {/* Admin */}
          <Route element={<AuthGuard requireAdmin />}>
            <Route path="admin" element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="cars" element={<AdminCars />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
