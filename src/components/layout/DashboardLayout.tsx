import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, User, X, Database, Package, ShoppingCart, Plus, Truck } from "lucide-react";
import { CreateTransactionModal } from "../../features/finance/components/CreateTransactionModal";
import { TransferPettyCashModal } from "../../features/finance/components/TransferPettyCashModal";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

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
            { label: "New Order", to: "/orders/create", permission: "sales_new_order" },
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
    const [isNavigating, setIsNavigating] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>("Management");
    const sidebarScrollRef = useRef<HTMLDivElement>(null);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsNavigating(false);
    }, [location.pathname]);

    // Memoize filtered items to prevent recalculation during navigation
    const filteredItems = useMemo(() => {
        return sidebarItems.map(item => {
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
                    // If it has a specific permission key, check for any permission starting with key.
                    if (subItem.permission) {
                        return userPermissions.some((p: string) => p.startsWith(`${subItem.permission}.`));
                    }
                    // If no permission key (like Dashboard/Settings if un-keyed), allow by default
                    return true;
                });

                return { ...item, items: filteredSubItems };
            }

            // If it's a top level item with no sub-items
            if (item.permission) {
                if (!userPermissions.some((p: string) => p.startsWith(`${item.permission}.`))) {
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
    }, [user]);

    // Handle navigation with guards to prevent stuck states
    const handleNavigation = useCallback((path: string, e?: React.MouseEvent) => {
        // Prevent navigation if already navigating
        if (isNavigating) {
            e?.preventDefault();
            return;
        }

        // Don't navigate if already on this path
        if (location.pathname === path) {
            e?.preventDefault();
            return;
        }

        // Scroll the clicked element into view to keep it visible
        if (e?.currentTarget) {
            const element = e.currentTarget as HTMLElement;
            // Use smooth scroll with block center to keep item visible
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Close mobile menu immediately before navigation
        setIsMobileMenuOpen(false);
        setIsNavigating(true);

        // Use navigate for reliable routing
        navigate(path);
    }, [isNavigating, location.pathname, navigate]);

    const toggleSection = (label: string) => {
        setExpandedSection(prev => prev === label ? null : label);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white text-slate-700">
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">F-Trade</span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">Enterprise</span>
                    </div>
                </div>
            </div>

            {/* MENU Label */}
            <div className="px-6 pt-6 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MENU</span>
            </div>

            <div ref={sidebarScrollRef} className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {filteredItems.map((item, index) => (
                    <div key={index} className="space-y-0.5">
                        {item.items ? (
                            <div className="space-y-0.5">
                                {/* Section Header (collapsible) */}
                                <button
                                    onClick={() => toggleSection(item.label)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-900 font-semibold text-sm hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    {item.icon && <item.icon className="h-5 w-5 text-slate-600" />}
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <svg
                                        className={cn(
                                            "h-4 w-4 text-slate-400 transition-transform duration-200",
                                            expandedSection === item.label ? "rotate-180" : ""
                                        )}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {/* Sub-items with smooth transition */}
                                <div
                                    className={cn(
                                        "grid transition-all duration-300 ease-in-out",
                                        expandedSection === item.label
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                    )}
                                >
                                    <div className="overflow-hidden">
                                        <nav className="space-y-0.5 pl-3 py-1">
                                            {item.items.map((subItem) => (
                                                <NavLink
                                                    key={subItem.to}
                                                    to={subItem.to}
                                                    onClick={(e) => handleNavigation(subItem.to, e)}
                                                    className={({ isActive }) =>
                                                        cn(
                                                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                                            isActive
                                                                ? "bg-blue-50 text-blue-600"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                                            isNavigating && "pointer-events-none opacity-50"
                                                        )
                                                    }
                                                >
                                                    {subItem.label}
                                                </NavLink>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <NavLink
                                to={item.to!}
                                onClick={(e) => handleNavigation(item.to!, e)}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                                        isNavigating && "pointer-events-none opacity-50"
                                    )
                                }
                            >
                                {item.icon && <item.icon className="h-5 w-5" />}
                                <span>{item.label}</span>
                            </NavLink>
                        )}
                    </div>
                ))}
            </div>

            {/* User Info at Bottom */}
            <div className="p-4 shrink-0 border-t border-slate-100">
                <NavLink to="/profile" className="block group rounded-xl bg-slate-50 p-3 transition-all duration-200 hover:bg-slate-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate">
                                {typeof user?.role === 'object' ? (user.role as any).name : user?.role || "Staff"}
                            </p>
                        </div>
                    </div>
                </NavLink>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F1F5F9] dark:bg-[#020617] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-[280px] bg-white border-r border-slate-200 shadow-sm relative z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl border-r border-slate-200">
                        <div className="absolute top-4 right-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                    <div className="h-full px-3 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden -ml-2 text-slate-600 hover:text-slate-900"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[140px] sm:max-w-none">
                                {filteredItems.flatMap(item => item.items || []).find(item =>
                                    item.to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(item.to || '')
                                )?.label || 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3">
                            {user?.petty_cash_account && (
                                <>
                                    <CreateTransactionModal
                                        collectedBy={user?.id}
                                        trigger={
                                            <Button variant="outline" size="sm" className="h-9 w-9 sm:w-auto px-0 sm:px-4 gap-2 bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:text-white shadow-sm">
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
                                className="h-9 w-9 sm:w-auto px-0 sm:px-3 gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Profile</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="h-9 w-9 sm:w-auto px-0 sm:px-3 gap-2 text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors font-medium"
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
