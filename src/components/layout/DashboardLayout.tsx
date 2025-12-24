import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Users, ShoppingCart, Gift, Menu, LogOut, User, X, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Package, label: "Products", to: "/products" },
    { icon: Users, label: "Customers", to: "/customers" },
    { icon: ShoppingCart, label: "Orders", to: "/orders" },
    { icon: Gift, label: "Points", to: "/loyalties" },
    { icon: Gift, label: "Rewards", to: "/rewards" },
    { icon: ShoppingCart, label: "Claims", to: "/claims" },
    { icon: User, label: "Staff", to: "/staff" },
    { icon: Settings, label: "Settings", to: "/settings" },
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

    // Filter items based on role
    const filteredItems = sidebarItems.filter(item => {
        if (user?.role === 'staff') {
            return !['Dashboard', 'Products', 'Staff', 'Settings'].includes(item.label);
        }
        return true;
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="h-20 flex items-center px-8 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">C</span>
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">CRM</span>
                </div>
            </div>

            <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto">
                <div>
                    <h3 className="mb-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Main Menu
                    </h3>
                    <nav className="space-y-1.5">
                        {filteredItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    cn(
                                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 transition-transform duration-200",
                                                isActive ? "scale-110" : "group-hover:scale-105"
                                            )}
                                        />
                                        <span>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* User Info at Bottom */}
            <div className="p-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 shadow-2xl">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 z-50 lg:hidden shadow-2xl">
                        <div className="absolute top-4 right-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shrink-0 z-10">
                    <div className="h-full px-4 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <h1 className="text-lg font-semibold text-slate-900">
                                {filteredItems.find(item =>
                                    item.to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(item.to)
                                )?.label || 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-slate-600 hover:text-slate-900"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
