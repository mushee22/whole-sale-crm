import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProductSales, getDashboardSummary } from "../dashboard/api/dashboard";
import { getOrders } from "../orders/api/orders";
import { getProducts } from "../products/api/products";
import { getUser } from "./api/users";
import { getLocations } from "../master-data/api/locations";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Package, Eye, TrendingDown, ShoppingCart, IndianRupee, Users } from "lucide-react";
import { Badge } from "../../components/ui/badge";

export default function StaffDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const userId = id;

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedLocationId, setSelectedLocationId] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [salesPage, setSalesPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);

    // Handle month selection - sets first and last day of month
    const handleMonthChange = (monthValue: string) => {
        setSelectedMonth(monthValue);

        if (!monthValue) {
            setStartDate("");
            setEndDate("");
            return;
        }

        // monthValue is in format "YYYY-MM"
        const [year, month] = monthValue.split('-');
        const firstDay = `${year}-${month}-01`;

        // Get last day of month
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDayFormatted = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

        setStartDate(firstDay);
        setEndDate(lastDayFormatted);
        setSalesPage(1);
        setOrdersPage(1);
    };

    // Set current month as default on mount
    useEffect(() => {
        handleMonthChange(getCurrentMonth());
    }, []);

    const { data: user } = useQuery({
        queryKey: ['users', userId],
        queryFn: () => getUser(Number(userId)),
        enabled: !!userId,
    });

    const { data: products } = useQuery({
        queryKey: ['products', 'list'],
        queryFn: () => getProducts({ per_page: 100 }),
    });

    const { data: locations } = useQuery({
        queryKey: ['master-data', 'locations'],
        queryFn: getLocations,
    });

    // Fetch dashboard summary for this user
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['dashboard', 'summary', userId, startDate, endDate, selectedLocationId, selectedProductId],
        queryFn: () => getDashboardSummary({
            date_from: startDate,
            date_to: endDate,
            location_id: selectedLocationId,
            product_id: selectedProductId,
            user_id: userId
        }),
        enabled: !!userId
    });

    const { data: salesData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin', 'dashboard', 'sales', selectedProductId, userId, startDate, endDate, salesPage, selectedLocationId],
        queryFn: () => getProductSales({
            product_id: selectedProductId,
            user_id: userId,
            date_from: startDate,
            date_to: endDate,
            page: salesPage,
            location_id: selectedLocationId
        }),
        enabled: !!userId
    });

    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['orders', 'user', userId, ordersPage, startDate, endDate],
        queryFn: () => getOrders({
            page: ordersPage,
            per_page: 15,
            created_by: userId,
            order_date_from: startDate,
            order_date_to: endDate
        }),
        enabled: !!userId
    });


    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/users")} className="pl-0 hover:bg-transparent text-slate-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Users List
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-lg md:text-3xl font-bold text-slate-900">
                    {user?.name || "User Details"}
                    <span className="block text-sm font-normal text-slate-500 mt-1">{user?.email}</span>
                </h1>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Location Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedLocationId}
                            onChange={(e) => {
                                setSelectedLocationId(e.target.value);
                                setSalesPage(1);
                            }}
                        >
                            <option value="">All Locations</option>
                            {locations?.map((loc: any) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month/Year Picker */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Month:</span>
                        <Input
                            type="month"
                            className="w-auto h-9"
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(e.target.value)}
                        />
                    </div>

                    {/* OR Separator */}
                    <span className="text-xs text-gray-400 font-medium">OR</span>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">From:</span>
                        <Input
                            type="date"
                            className="w-auto h-9"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setSalesPage(1);
                                setOrdersPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">To:</span>
                        <Input
                            type="date"
                            className="w-auto h-9"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setSalesPage(1);
                                setOrdersPage(1);
                            }}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                                setSalesPage(1);
                                setOrdersPage(1);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Dashboard Summary Section */}
            {isSummaryLoading ? (
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
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Orders by Status</CardTitle>
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
                <div className="text-center p-8 text-gray-500">No summary data available</div>
            )}

            {/* Product Sales Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Sales Performance
                    </h2>
                    <div className="w-full sm:w-auto">
                        <select
                            className="h-10 w-full sm:w-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setSalesPage(1);
                            }}
                        >
                            <option value="">All Products</option>
                            {products?.data.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>



                {/* Product Sales Table */}
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty Sold</TableHead>
                                        <TableHead className="text-right">Qty Returned</TableHead>
                                        <TableHead className="text-right">Net Qty</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Returns</TableHead>
                                        <TableHead className="text-right">Net Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStats ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                Loading sales data...
                                            </TableCell>
                                        </TableRow>
                                    ) : salesData?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No product sales found for this user.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        salesData?.data.map((item) => (
                                            <TableRow key={item.product_id} className="hover:bg-slate-50">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-900">{item.product.name}</span>
                                                        {item.product.color && item.product.size && (
                                                            <span className="text-xs text-slate-500">
                                                                {item.product.color.name} - {item.product.size.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-slate-700">{item.quantity_sold}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.quantity_returned > 0 ? (
                                                        <Badge variant="destructive" className="font-mono">
                                                            <TrendingDown className="h-3 w-3 mr-1" />
                                                            {item.quantity_returned}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">0</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-slate-900">{item.net_quantity}</TableCell>
                                                <TableCell className="text-right text-slate-700">₹{item.revenue.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.return_amount > 0 ? (
                                                        <span className="text-red-600 font-medium">₹{item.return_amount.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-slate-400">₹0</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-700">
                                                    ₹{item.net_revenue.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {salesData && salesData.data.length > 0 && (
                            <div className="p-4 border-t border-gray-100">
                                <Pagination
                                    currentPage={salesData.current_page}
                                    totalPages={salesData.last_page}
                                    onPageChange={setSalesPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Orders List Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Order History</h2>

                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingOrders ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                Loading orders...
                                            </TableCell>
                                        </TableRow>
                                    ) : ordersData?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No orders found for this staff member.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ordersData?.data.map((order: any) => (
                                            <TableRow key={order.id} className="hover:bg-slate-50">
                                                <TableCell className="font-medium text-slate-900">
                                                    {order.unique_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{order.customer.name}</span>
                                                        <span className="text-xs text-gray-500">{order.customer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                </TableCell>
                                                <TableCell>{order.order_items?.length || 0}</TableCell>
                                                <TableCell>₹{order.total_amount}</TableCell>
                                                <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => navigate(`/orders/${order.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {ordersData?.data.map((order: any) => (
                                <div key={order.id} className="p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-gray-900">{order.order_number}</div>
                                            <div className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 text-xs block">Customer</span>
                                            <span className="font-medium text-gray-900">{order.customer.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-500 text-xs block">Total</span>
                                            <span className="font-medium text-gray-900">₹{order.total_amount}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" /> View Order
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <Pagination
                                currentPage={ordersData?.current_page || 1}
                                totalPages={ordersData?.last_page || 1}
                                onPageChange={setOrdersPage}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
