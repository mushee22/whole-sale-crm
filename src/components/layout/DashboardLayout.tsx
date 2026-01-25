import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, User, X, Database, Package, ShoppingCart, Plus, Truck } from "lucide-react";
import { CreateTransactionModal } from "../../features/finance/components/CreateTransactionModal";
import { TransferPettyCashModal } from "../../features/finance/components/TransferPettyCashModal";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

interface SidebarItem {
    label: string;
    icon?: any;
    to?: string;
    permission?: string; // Key for permission checking (e.g., 'users' -> checks 'users.view')
    items?: { label: string; to: string; permission?: string }[];
    allowedRoles?: string[];
}

const sidebarItems: SidebarItem[] = [
    {
        label: "Management",
        icon: User,
        items: [
            { label: "Users", to: "/users", permission: "users" },
            { label: "Delivery Boys", to: "/delivery-boys", permission: "delivery_boys" },
            { label: "Customers", to: "/customers", permission: "customers" },
            { label: "Roles", to: "/roles", permission: "roles" },
        ]
    },
    {
        label: "My Orders",
        icon: Truck,
        to: "/my-orders",
    },
    {
        label: "Inventory",
        icon: Package,
        items: [
            { label: "Products", to: "/products", permission: "products" },
            { label: "Colors", to: "/master-data/colors", permission: "colors" },
            { label: "Sizes", to: "/master-data/sizes", permission: "sizes" },
            { label: "Locations", to: "/master-data/locations", permission: "locations" },
        ]
    },
    {
        label: "Sales",
        icon: ShoppingCart,
        items: [
            { label: "Create Quote", to: "/sales/create-quote", permission: "sales_pre_orders" },
            { label: "New Order", to: "/orders/create", permission: "sales_new" },
            { label: "Confirmed Orders", to: "/sales/confirmed-orders", permission: "sales_confirmed" },
            { label: "Dispatched Orders", to: "/sales/dispatched-orders", permission: "sales_dispatched" },
            { label: "Out For Delivery", to: "/sales/out-for-delivery", permission: "sales_out_for_delivery" },
            { label: "Completed Orders", to: "/sales/completed-orders", permission: "sales_completed" },
            { label: "Cancelled Orders", to: "/sales/cancelled-orders", permission: "sales_cancelled" },
            { label: "Orders", to: "/orders", permission: "orders" },
        ]
    },
    {
        label: "Finance",
        icon: Database,
        items: [
            { label: "Petty Cash", to: "/petty-cash-accounts", permission: "petty_cash" },
            { label: "Petty Cash Transactions", to: "/petty-cash-transactions", permission: "petty_cash_transactions" },
            { label: "Customer Transactions", to: "/customer-transactions", permission: "customer_transactions" },
            { label: "Accounts", to: "/accounts", permission: "accounts" },
        ]
    }
];

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Filter items based on role/permissions
    const filteredItems = sidebarItems.map(item => {
        // Validation: Check checking role name (string or object)
        // Ensure user.role is not null before checking if it is an object
        const roleName = (user?.role && typeof user.role === 'object') ? (user.role as any).name : user?.role;

        // Check for specific role restriction
        if (item.allowedRoles) {
            const normalizedRole = roleName?.toLowerCase();
            if (!item.allowedRoles.includes(normalizedRole)) {
                return null;
            }
            return item;
        }

        // Check for Admin (case insensitive)
        const isAdmin = roleName?.toLowerCase() === 'admin';

        if (isAdmin) return item;

        // If not admin, check permissions
        const userPermissions = (typeof user?.role === 'object' ? (user.role as any).permissions : []) || [];

        // Filter sub-items
        if (item.items) {
            const filteredSubItems = item.items.filter(subItem => {
                // If it has a specific permission key, check for .view
                if (subItem.permission) {
                    return userPermissions.includes(`${subItem.permission}.view`);
                }
                // If no permission key (like Dashboard/Settings if un-keyed), allow by default
                return true;
            });

            return { ...item, items: filteredSubItems };
        }

        // If it's a top level item with no sub-items
        if (item.permission) {
            if (!userPermissions.includes(`${item.permission}.view`)) {
                return null; // Filter out
            }
        }

        return item;
    }).filter((item): item is SidebarItem => {
        // Remove nulls
        if (!item) return false;
        // Remove items that are empty after filtering sub-items
        if (item.items && item.items.length === 0) return false;
        return true;
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0B1120] text-slate-300">
            {/* Logo Section */}
            <div className="h-24 flex items-center px-6 shrink-0">
                <div className="flex items-center gap-3 w-full p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/10 backdrop-blur-sm">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full" />
                        <img src="/logo.png" alt="Logo" className="relative h-8 w-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white tracking-tight leading-none">F-Trade</span>
                        <span className="text-[10px] font-medium text-blue-400 uppercase tracking-widest mt-1">Enterprise</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto scrollbar-none">
                <div className="space-y-2">
                    {filteredItems.map((item, index) => (
                        <div key={index} className="space-y-2">
                            {item.items ? (
                                <div className="space-y-2 pt-4 first:pt-0">
                                    <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        {item.label}
                                    </h3>
                                    <nav className="space-y-1">
                                        {item.items.map((subItem) => (
                                            <NavLink
                                                key={subItem.to}
                                                to={subItem.to}
                                                className={({ isActive }) =>
                                                    cn(
                                                        "group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden",
                                                        isActive
                                                            ? "text-white bg-blue-600"
                                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                                    )
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={cn(
                                                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white/50 rounded-r-full transition-all duration-300",
                                                            isActive && "h-1/2"
                                                        )} />
                                                        <span className="relative z-10 truncate">{subItem.label}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </nav>
                                </div>
                            ) : (
                                <NavLink
                                    to={item.to!}
                                    className={({ isActive }) =>
                                        cn(
                                            "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                                            isActive
                                                ? "text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] bg-gradient-to-r from-blue-600 to-indigo-600"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {item.icon && (
                                                <item.icon
                                                    className={cn(
                                                        "h-5 w-5 transition-all duration-300",
                                                        isActive ? "text-white scale-110" : "text-slate-500 group-hover:text-white group-hover:scale-110"
                                                    )}
                                                />
                                            )}
                                            <span className="font-medium tracking-wide">{item.label}</span>
                                            {isActive && (
                                                <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* User Info at Bottom */}
            <div className="p-4 shrink-0">
                <NavLink to="/profile" className="block group relative overflow-hidden rounded-2xl bg-[#0F1629] p-4 transition-all duration-300 hover:bg-[#1E293B] border border-slate-800/50 hover:border-slate-700 cursor-pointer">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                            <div className="h-full w-full rounded-full bg-[#0B1120] flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-400 truncate font-medium">
                                {typeof user?.role === 'object' ? (user.role as any).name : user?.role || "Staff"}
                            </p>
                        </div>
                    </div>
                </NavLink>
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-slate-600 font-medium">v1.2.0 • F-Trade Inc.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F1F5F9] dark:bg-[#020617] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-[280px] bg-[#0B1120] border-r border-[#1E293B] shadow-2xl relative z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 w-[280px] bg-[#0B1120] z-50 lg:hidden shadow-2xl border-r border-[#1E293B]">
                        <div className="absolute top-4 right-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-slate-400 hover:text-white hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shrink-0 z-10 sticky top-0">
                    <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden -ml-2 text-slate-600 hover:text-slate-900"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {filteredItems.flatMap(item => item.items || []).find(item =>
                                    item.to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(item.to || '')
                                )?.label || 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {user?.petty_cash_account && (
                                <>
                                    <CreateTransactionModal
                                        collectedBy={user?.id}
                                        trigger={
                                            <Button variant="outline" size="sm" className="gap-2 bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:text-white shadow-sm">
                                                <Plus className="h-4 w-4" />
                                                <span className="hidden sm:inline">Add Transaction</span>
                                            </Button>
                                        }
                                    />
                                    <TransferPettyCashModal
                                        fromAccountId={(user.petty_cash_account as any).id}
                                        currentBalance={(user.petty_cash_account as any).current_balance || "0"}
                                    />
                                </>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/profile')}
                                className="gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Profile</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
