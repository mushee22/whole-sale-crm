import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";
import { getOrders } from "./api/orders";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Pencil } from "lucide-react";

export default function CompletedOrdersPage() {
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['orders', 'delivered', page, startDate, endDate],
        queryFn: () => getOrders({
            page,
            per_page: 15,
            status: 'delivered',
            order_date_from: startDate,
            order_date_to: endDate
        }),
    });

    const orders = data?.data || [];

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading completed orders...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Completed Orders
                        </CardTitle>
                        <p className="text-sm text-gray-500">History of successfully delivered orders.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters Toolbar */}
                    <div className="p-4 flex flex-wrap gap-2 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
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
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Delivered Date</TableHead>
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
                                            No completed orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/orders/${order.id}`)}>#{order.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.customer?.name}</span>
                                                    <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{order.order_date ? format(new Date(order.order_date), "PPP") : "-"}</TableCell>
                                            {/* Using updated_at as proxy for delivered date if logic holds, or estimated if close */}
                                            <TableCell>{order.updated_at ? format(new Date(order.updated_at), "PPP") : "-"}</TableCell>
                                            <TableCell>{order.items?.length || 0} items</TableCell>
                                            <TableCell>₹{(order.total_amount || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                                    Delivered
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="mr-2 text-slate-600 hover:text-slate-900" onClick={() => navigate(`/orders/edit/${order.id}`)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/${order.id}`)}>
                                                    View Details
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
                        {orders.map((order) => (
                            <div key={order.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900" onClick={() => navigate(`/orders/${order.id}`)}>Order #{order.id}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</div>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Delivered
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 text-xs block">Customer</span>
                                        <span className="font-medium text-gray-900">{order.customer?.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 text-xs block">Total</span>
                                        <span className="font-medium text-gray-900">₹{(order.total_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/orders/edit/${order.id}`)}>
                                        <Pencil className="h-4 w-4" /> Edit
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/orders/${order.id}`)}>
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
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
