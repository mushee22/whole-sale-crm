import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../orders/api/orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Package, Eye } from "lucide-react";
import { Pagination } from "../../../components/ui/pagination";

interface CustomerOrdersListProps {
    customerId: number;
}

export default function CustomerOrdersList({ customerId }: CustomerOrdersListProps) {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<string>("all"); // Default to all
    const [dateFrom, setDateFrom] = useState<string>("");

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ["customer-orders", customerId, page, status, dateFrom],
        queryFn: () => getOrders({
            customer_id: customerId,
            page,
            per_page: 15,
            status: status === "all" ? undefined : status,
            order_date_from: dateFrom || undefined,
        }),
        enabled: !!customerId
    });

    const orders = ordersData?.data || [];


    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-slate-500" />
                        <CardTitle className="text-lg font-semibold text-slate-800">Order History</CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-[150px]">
                            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                                <SelectTrigger className="h-8 bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="dispatched">Dispatched</SelectItem>
                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[150px]">
                            <Input
                                type="date"
                                className="h-8 bg-white"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                placeholder="From Date"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading orders...</div>
                    ) : orders.length > 0 ? (
                        orders.map((order) => (
                            <div key={order.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-slate-900">
                                            {order.order_number || `#${order.id}`}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Badge variant={
                                        order.status === 'delivered' ? 'default' :
                                            order.status === 'cancelled' ? 'destructive' :
                                                order.status === 'confirmed' ? 'secondary' : 'outline'
                                    } className="capitalize">
                                        {order.status.replace(/_/g, " ")}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 text-xs block">Items</span>
                                        <span className="font-medium text-slate-900">{order.items?.length || 0} items</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 text-xs block">Total Amount</span>
                                        <span className="font-bold text-slate-900">{order.total_amount || '-'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-gray-50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-blue-600 hover:bg-blue-50"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" /> View Order
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No orders found matching criteria
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30">
                                <TableHead>Order #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Loading orders...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-700">
                                            {order.order_number || `#${order.id}`}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                order.status === 'delivered' ? 'default' :
                                                    order.status === 'cancelled' ? 'destructive' :
                                                        order.status === 'confirmed' ? 'secondary' : 'outline'
                                            } className="capitalize">
                                                {order.status.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {order.items?.length || 0} items
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-slate-900">
                                            {order.total_amount || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No orders found matching criteria
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {ordersData && (
                    <div className="px-4 py-4 border-t border-gray-100">
                        <Pagination
                            currentPage={ordersData.current_page}
                            totalPages={ordersData.last_page}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
