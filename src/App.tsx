import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ProductList from "./features/products/ProductList";
import OrderList from "./features/orders/OrderList";
import CreateOrderPage from "./features/orders/CreateOrderPage";
import OrderDetailsPage from "./features/orders/OrderDetailsPage";
import CustomerList from "./features/customers/CustomerList";
import CustomerDetailsPage from "./features/customers/CustomerDetailsPage";
import LoyaltyList from "./features/loyalties/LoyaltyList";
import RewardList from "./features/rewards/RewardList";
import CreateClaimPage from "./features/claims/CreateClaimPage";
import ClaimsListPage from "./features/claims/ClaimsListPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { Toaster } from "sonner";
import SettingsPage from "./features/settings/SettingsPage";
import PublicCustomerPage from "./pages/PublicCustomerPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/c/:uniqueId",
    element: <PublicCustomerPage />, // Public access, no layout or auth required
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <DashboardPage />,
      },
      {
        path: "products",
        element: <ProductList />,
      },
      {
        path: "orders",
        element: <OrderList />,
      },
      {
        path: "orders/create",
        element: <CreateOrderPage />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailsPage />,
      },
      {
        path: "orders/edit/:id",
        element: <CreateOrderPage />,
      },
      {
        path: "customers",
        element: <CustomerList />,
      },
      {
        path: "customers/:id",
        element: <CustomerDetailsPage />,
      },
      {
        path: "loyalties",
        element: <LoyaltyList />,
      },
      {
        path: "rewards",
        element: <RewardList />,
      },
      {
        path: "claims",
        element: <ClaimsListPage />,
      },
      {
        path: "claims/new",
        element: <CreateClaimPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
