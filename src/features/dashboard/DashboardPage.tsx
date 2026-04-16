import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLocations } from "../master-data/api/locations";
import { getProducts } from "../products/api/products";
import { getDashboardSummary } from "./api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ShoppingCart, IndianRupee, Package, Users } from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermission();

    useEffect(() => {
        if (!hasPermission("dashboard", "view")) {
            navigate("/my-orders");
        }
    }, [hasPermission, navigate]);

    const [dateFrom, setDateFrom] = useState<string>("");
    const [selectedLocationId, setSelectedLocationId] = useState<string>("");
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${now.getFullYear()}-${month}`;
    });

    const [dateTo, setDateTo] = useState<string>(() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const day = lastDay.getDate().toString().padStart(2, '0');
        const month = (lastDay.getMonth() + 1).toString().padStart(2, '0');
        return `${lastDay.getFullYear()}-${month}-${day}`;
    });

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSelectedMonth(value);
        if (value) {
            const [year, month] = value.split('-');
            const firstDay = `${value}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            setDateFrom(firstDay);
            setDateTo(lastDay);
        } else {
            setDateFrom("");
            setDateTo("");
        }
    };

    // Fetch filters data
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => getLocations(),
    });

    const { data: products } = useQuery({
        queryKey: ['products', 'list'],
        queryFn: () => getProducts({ per_page: 100 }),
    });

    // Fetch dashboard summary
    const { data: summary, isLoading } = useQuery({
        queryKey: ['dashboard', 'summary', dateFrom, dateTo, selectedLocationId, selectedProductId],
        queryFn: () => getDashboardSummary({
            date_from: dateFrom,
            date_to: dateTo,
            location_id: selectedLocationId,
            product_id: selectedProductId,
        }),
    });

    if (!hasPermission("dashboard", "view")) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gray-900">Dashboard Summary</h1>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="sm:col-span-1">
                            <label className="text-sm font-medium mb-1 block">Month</label>
                            <input
                                type="month"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="text-sm font-medium mb-1 block">From Date</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setSelectedMonth(""); // Clear month if manual date selected
                                }}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="text-sm font-medium mb-1 block">To Date</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setSelectedMonth(""); // Clear month if manual date selected
                                }}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="text-sm font-medium mb-1 block">Location</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={selectedLocationId}
                                onChange={(e) => setSelectedLocationId(e.target.value)}
                            >
                                <option value="">All Locations</option>
                                {locations?.map((loc: any) => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                            <label className="text-sm font-medium mb-1 block">Product</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                            >
                                <option value="">All Products</option>
                                {products?.data?.map((prod: any) => (
                                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Display */}
            {isLoading ? (
                <div className="text-center p-8">Loading summary...</div>
            ) : summary ? (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg sm:text-2xl font-bold">{summary.total_orders}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Net Revenue</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg sm:text-2xl font-bold">₹{summary.net_revenue.toLocaleString()}</div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                    Total: ₹{summary.total_revenue.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Quantity Sold</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg sm:text-2xl font-bold">{summary.total_quantity_sold}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg sm:text-2xl font-bold">{summary.distinct_customers}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orders by Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {Object.entries(summary.orders_by_status).map(([status, count]) => (
                                    <div key={status} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-sm font-medium text-muted-foreground capitalize mb-1">
                                            {status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-2xl font-bold text-slate-900">{count as number}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500">No data available</div>
            )}
        </div>
    );
}
