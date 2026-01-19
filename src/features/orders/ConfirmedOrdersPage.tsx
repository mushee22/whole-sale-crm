import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";
import { getOrders } from "./api/orders";
import { AssignDeliveryModal } from "./components/AssignDeliveryModal";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConfirmedOrdersPage() {
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['orders', 'confirmed', page, startDate, endDate],
        queryFn: () => getOrders({
            page,
            per_page: 15,
            status: 'confirmed',
            order_date_from: startDate,
            order_date_to: endDate
        }),
    });

    const orders = data?.data || [];

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading confirmed orders...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Confirmed Orders</CardTitle>
                        <p className="text-sm text-gray-500">Manage orders ready for delivery assignment.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters Toolbar */}
                    <div className="p-4 flex flex-wrap gap-2 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
                            {/* Reusing Input component assuming it exists or using standard HTML input for simplicity if imports needed */}
                            {/* Need to verify Input import. It wasn't in original file, but Table components were. Let's add Input import. */}
                            <span className="text-sm text-gray-500 font-medium">From:</span>
                            <input
                                type="date"
                                className="h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
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
                                    setPage(1);
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
                                    setPage(1);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                Clear
                            </Button>
                        )}
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
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-500 text-xs block">Total</span>
                                            <span className="font-medium text-gray-900">₹{calculatedTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
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
            </Card>
        </div>
    );
}
