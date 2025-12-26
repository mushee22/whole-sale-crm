import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Eye, Download } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import ExportOrdersModal from "../reports/components/ExportOrdersModal";

import { getOrders } from "./api/orders";

export default function OrderList() {
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['orders', page, startDate, endDate],
        queryFn: () => getOrders({ page, per_page: 15, start_date: startDate, end_date: endDate }),
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div className="space-y-6">

            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">All Orders</CardTitle>
                        <p className="text-sm text-gray-500">View and manage all orders here.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
                            onClick={() => setIsExportModalOpen(true)}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 w-full sm:w-auto"
                            onClick={() => navigate('/orders/create')}
                        >
                            + Create Manual Order
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters Toolbar */}
                    <div className="p-4 flex flex-wrap gap-2 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium">From:</span>
                            <Input
                                type="date"
                                className="w-auto"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1); // Reset to first page on filter change
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium">To:</span>
                            <Input
                                type="date"
                                className="w-auto"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1); // Reset to first page on filter change
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
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {data?.data.map((order) => (
                            <div key={order.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900">{order.order_number}</div>
                                        <div className="text-xs text-gray-500">#{order.id} • {new Date(order.created_at).toLocaleDateString()}</div>
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

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-xs text-gray-500">
                                        {order.order_items?.length || 0} items
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" /> View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="font-semibold text-gray-600">Order Number</TableHead>
                                    <TableHead className="font-semibold text-gray-600">User</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Items</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Total</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Created At</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{order.order_number}</div>
                                            <div className="text-xs text-gray-500">ID: #{order.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{order.customer.name}</div>
                                            <div className="text-xs text-gray-500">{order.customer.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        </TableCell>
                                        <TableCell>{order.order_items?.length || 0}</TableCell>
                                        <TableCell>₹{order.total_amount}</TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
            <ExportOrdersModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </div>
    );
}
