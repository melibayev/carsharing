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
const Admin = lazy(() => import('@/pages/admin'));
const HostNewCar = lazy(() => import('@/pages/host-new-car'));

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
        <Route element={<RootLayout />}>
          {/* Public */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
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
            <Route path="host/cars/new" element={<HostNewCar />} />
          </Route>

          {/* Admin */}
          <Route element={<AuthGuard requireAdmin />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
