import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { format } from "date-fns";
import { getOrders } from "./api/orders";
import { AssignDeliveryModal } from "./components/AssignDeliveryModal";
import { Truck, Eye, Pencil } from "lucide-react";
import OrderDetailsModal from "./components/OrderDetailsModal";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from "../../hooks/usePermission";

export default function ConfirmedOrdersPage() {
    const [status, setStatus] = useState<'confirmed' | 'dispatched'>('confirmed');
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

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
        setPage(1);
    };

    // Set current month as default on mount
    useEffect(() => {
        handleMonthChange(getCurrentMonth());
    }, []);

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['orders', status, page, startDate, endDate],
        queryFn: () => getOrders({
            page,
            per_page: 15,
            status: status,
            order_date_from: startDate,
            order_date_to: endDate
        }),
    });

    const orders = data?.data || [];

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading confirmed orders...</div>;

    return (
        <PermissionGuard module="sales_confirmed" action="view" showMessage>
            <div className="space-y-6">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Confirmed Orders</CardTitle>
                            <p className="text-sm text-gray-500">Manage orders ready for delivery assignment.</p>
                        </div>
                    </CardHeader>
                    <Tabs value={status} onValueChange={(val) => { setStatus(val as 'confirmed' | 'dispatched'); setPage(1); }}>
                        <div className="border-b border-gray-100 px-6 pt-4">
                            <TabsList>
                                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                                <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value={status} className="m-0">
                            <CardContent className="p-0">
                                {/* Filters Toolbar */}
                                <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-gray-100 bg-white">
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                        <div className="w-full md:w-[165px]">
                                            <input
                                                type="month"
                                                placeholder="Month"
                                                value={selectedMonth}
                                                onChange={(e) => handleMonthChange(e.target.value)}
                                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        {/* OR Separator */}
                                        <span className="text-xs text-gray-400 font-medium self-center hidden md:block">OR</span>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 font-medium">From:</span>
                                            <input
                                                type="date"
                                                className="h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    setSelectedMonth("");
                                                    setPage(1);
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 font-medium">To:</span>
                                            <input
                                                type="date"
                                                className="h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    setSelectedMonth("");
                                                    setPage(1);
                                                }}
                                            />
                                        </div>
                                        {(selectedMonth || startDate || endDate) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setStartDate("");
                                                    setEndDate("");
                                                    setSelectedMonth("");
                                                    setPage(1);
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Est. Delivery</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Total Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                        No confirmed orders found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                orders.map((order) => {
                                                    const calculatedTotal = order.items?.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) || 0;
                                                    return (
                                                        <TableRow key={order.id}>
                                                            <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/orders/${order.id}`)}>#{order.id}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{order.customer?.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                                                                    <span className="text-xs text-muted-foreground">{order.customer?.location?.name || "No Location"}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{order.order_date ? format(new Date(order.order_date), "PPP") : "-"}</TableCell>
                                                            <TableCell>{order.estimated_delivery_date ? format(new Date(order.estimated_delivery_date), "PPP") : "-"}</TableCell>
                                                            <TableCell>{order.items?.length || 0} items</TableCell>
                                                            <TableCell>₹{calculatedTotal.toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                                                    {order.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    size="sm" variant="ghost" className="mr-1 text-slate-600 hover:text-slate-900"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/orders/edit/${order.id}`);
                                                                    }}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm" variant="ghost" className="mr-2 text-slate-600 hover:text-slate-900"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedOrder(order.id);
                                                                    }}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <PermissionGuard module="orders" action="assign_delivery">
                                                                    <AssignDeliveryModal
                                                                        orderId={order.id}
                                                                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
                                                                        trigger={
                                                                            <Button size="sm" variant="outline" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                                                                <Truck className="h-4 w-4" />
                                                                                Assign
                                                                            </Button>
                                                                        }
                                                                    />
                                                                </PermissionGuard>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-gray-100">
                                    {orders.map((order) => {
                                        const calculatedTotal = order.items?.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) || 0;
                                        return (
                                            <div key={order.id} className="p-4 space-y-3 bg-white">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-semibold text-gray-900" onClick={() => navigate(`/orders/${order.id}`)}>Order #{order.id}</div>
                                                        <div className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</div>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Customer</span>
                                                        <span className="font-medium text-gray-900">{order.customer?.name}</span>
                                                        <span className="text-xs text-gray-500 block">{order.customer?.location?.name || "No Location"}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-gray-500 text-xs block">Total</span>
                                                        <span className="font-medium text-gray-900">₹{calculatedTotal.toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Items</span>
                                                        <span className="font-medium text-gray-900">{order.items?.length || 0} items</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-gray-500 text-xs block">Est. Delivery</span>
                                                        <span className="font-medium text-gray-900">{order.estimated_delivery_date ? format(new Date(order.estimated_delivery_date), "PPP") : "-"}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-2 flex gap-2">
                                                    <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/orders/edit/${order.id}`)}>
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </Button>
                                                    <div className="flex-1">
                                                        <PermissionGuard module="orders" action="assign_delivery">
                                                            <AssignDeliveryModal
                                                                orderId={order.id}
                                                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
                                                                trigger={
                                                                    <Button size="sm" variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                                                        <Truck className="h-4 w-4" />
                                                                        Assign Delivery
                                                                    </Button>
                                                                }
                                                            />
                                                        </PermissionGuard>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="px-4 py-4 border-t border-gray-100">
                                    <Pagination
                                        currentPage={data?.current_page || 1}
                                        totalPages={data?.last_page || 1}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </CardContent>
                        </TabsContent>
                    </Tabs>
                </Card>
                <OrderDetailsModal
                    orderId={selectedOrder}
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            </div>
        </PermissionGuard>
    );
}
