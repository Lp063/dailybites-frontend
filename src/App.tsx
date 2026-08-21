import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Restaurants } from './pages/Restaurants';
import { RestaurantDetail } from './pages/RestaurantDetail';
import UsersPage from './pages/admin/Users';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layout/AppLayout';
import RestaurantLayout from './layout/RestaurantLayout';

function RestaurantPortalLanding() {
  return (
    <div>
      <h2>Welcome to the DailyBites Partner Portal</h2>
      <p>Your restaurant profile, schedule, bags, and orders will appear here.</p>
    </div>
  );
}

function CustomerPortalLanding() {
  return (
    <div>
      <h2>Welcome to DailyBites</h2>
      <p>The customer portal is coming soon.</p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['RESTAURANT']} />}>
        <Route element={<RestaurantLayout />}>
          <Route path="/restaurant" element={<RestaurantPortalLanding />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route path="/customer" element={<CustomerPortalLanding />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}