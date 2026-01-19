import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
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
import UsersListPage from "./features/users/UsersListPage";
import DeliveryBoysListPage from "./features/users/DeliveryBoysListPage";
import StaffDetailsPage from "./features/users/StaffDetailsPage";
import { ProductsPage } from "./features/master-data/pages/ProductsPage";
import { ProductVariantsPage } from "./features/master-data/pages/ProductVariantsPage";
import ColorsPage from "./features/master-data/pages/ColorsPage";
import SizesPage from "./features/master-data/pages/SizesPage";
import LocationsPage from "./features/master-data/pages/LocationsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SalesOrderPage } from "./features/sales/pages/SalesOrderPage";
import { PreOrderListPage } from "./features/sales/pages/PreOrderListPage";
import { CreateOrderFromPreOrderPage } from "./features/sales/pages/CreateOrderFromPreOrderPage";
import { PreOrderDetailsPage } from "./features/sales/pages/PreOrderDetailsPage";
import ConfirmedOrdersPage from "./features/orders/ConfirmedOrdersPage";
import DispatchedOrdersPage from "./features/orders/DispatchedOrdersPage";
import DispatchCheckPage from "./features/orders/DispatchCheckPage";
import OutForDeliveryOrdersPage from "./features/orders/OutForDeliveryOrdersPage";
import DeliveryCheckPage from "./features/orders/DeliveryCheckPage";
import CompletedOrdersPage from "./features/orders/CompletedOrdersPage";
import CancelledOrdersPage from "./features/orders/CancelledOrdersPage";
import RolesListPage from "./features/roles/pages/RolesListPage";
import CreateRolePage from "./features/roles/components/CreateRolePage";
import EditRolePage from "./features/roles/components/EditRolePage";
import { PettyCashPage } from "./features/finance/pages/PettyCashPage";
import { PettyCashDetailsPage } from "./features/finance/pages/PettyCashDetailsPage";
import { CustomerTransactionsPage } from "./features/finance/pages/CustomerTransactionsPage";
import InvoicesListPage from "./features/accounts/pages/InvoicesListPage";
import { InvoiceDetailsPage } from "./features/accounts/pages/InvoiceDetailsPage";
import MyOrdersPage from "./features/orders/pages/MyOrdersPage";

const queryClient = new QueryClient();

const StaffRestricted = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>; // Or return null/spinner

  if (user?.role === 'staff') {
    return <Navigate to="/customers" replace />;
  }
  return <>{children}</>;
};

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
        element: (
          <StaffRestricted>
            <DashboardPage />
          </StaffRestricted>
        ),
      },
      // {
      //   path: "products",
      //   element: (
      //     <StaffRestricted>
      //       <ProductList />
      //     </StaffRestricted>
      //   ),
      // },
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
        path: "staff",
        element: (
          <StaffRestricted>
            <UsersListPage />
          </StaffRestricted>
        ),
      },
      {
        path: "users",
        element: (
          <StaffRestricted>
            <UsersListPage />
          </StaffRestricted>
        ),
      },
      {
        path: "delivery-boys",
        element: (
          <StaffRestricted>
            <DeliveryBoysListPage />
          </StaffRestricted>
        ),
      },
      {
        path: "staff/:id",
        element: (
          <StaffRestricted>
            <StaffDetailsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "users/:id",
        element: (
          <StaffRestricted>
            <StaffDetailsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "settings",
        element: (
          <StaffRestricted>
            <SettingsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "roles",
        element: (
          <StaffRestricted>
            <RolesListPage />
          </StaffRestricted>
        ),
      },
      {
        path: "roles/create",
        element: (
          <StaffRestricted>
            <CreateRolePage />
          </StaffRestricted>
        ),
      },
      {
        path: "roles/:id",
        element: (
          <StaffRestricted>
            <EditRolePage />
          </StaffRestricted>
        ),
      },
      {
        path: "products",
        element: (
          <StaffRestricted>
            <ProductsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "products/:id/variants",
        element: (
          <StaffRestricted>
            <ProductVariantsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "petty-cash-accounts",
        element: (
          <StaffRestricted>
            <PettyCashPage />
          </StaffRestricted>
        ),
      },
      {
        path: "petty-cash-accounts/:id",
        element: (
          <StaffRestricted>
            <PettyCashDetailsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "customer-transactions",
        element: (
          <StaffRestricted>
            <CustomerTransactionsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "accounts",
        element: (
          <StaffRestricted>
            <InvoicesListPage />
          </StaffRestricted>
        ),
      },
      {
        path: "accounts/:id",
        element: (
          <StaffRestricted>
            <InvoiceDetailsPage />
          </StaffRestricted>
        ),
      },
      {
        path: "sales/new",
        element: <SalesOrderPage />,
      },

      {
        path: "sales/pre-orders",
        element: <PreOrderListPage />,
      },
      {
        path: "sales/pre-orders/:id",
        element: <PreOrderDetailsPage />,
      },
      {
        path: "sales/pre-orders/:id/create",
        element: <CreateOrderFromPreOrderPage />,
      },
      {
        path: "sales/confirmed-orders",
        element: <ConfirmedOrdersPage />,
      },
      {
        path: "sales/dispatched-orders",
        element: <DispatchedOrdersPage />,
      },
      {
        path: "sales/dispatched-orders/:id/check",
        element: <DispatchCheckPage />,
      },
      {
        path: "sales/out-for-delivery",
        element: <OutForDeliveryOrdersPage />,
      },

      {
        path: "sales/out-for-delivery/:id/check",
        element: <DeliveryCheckPage />,
      },
      {
        path: "my-orders",
        element: <MyOrdersPage />,
      },

      {
        path: "sales/completed-orders",
        element: <CompletedOrdersPage />,
      },
      {
        path: "sales/cancelled-orders",
        element: <CancelledOrdersPage />,
      },

      {
        path: "master-data",
        children: [
          {
            path: "colors",
            element: (
              <StaffRestricted>
                <ColorsPage />
              </StaffRestricted>
            ),
          },
          {
            path: "sizes",
            element: (
              <StaffRestricted>
                <SizesPage />
              </StaffRestricted>
            ),
          },
          {
            path: "locations",
            element: (
              <StaffRestricted>
                <LocationsPage />
              </StaffRestricted>
            ),
          },
        ]
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
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
