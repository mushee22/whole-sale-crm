
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserOrderLogs } from "./api/users";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { ArrowLeft, Eye } from "lucide-react";

export default function UserOrderLogsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const userId = Number(id);
    const [page, setPage] = useState(1);

    // Fetch logs
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['order-logs', userId, page],
        queryFn: () => getUserOrderLogs(userId, { page, per_page: 15 }),
        enabled: !!userId
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading logs...</div>;

    const logs = logsData?.data || [];
    // Assuming the API returns a standard paginated response where 'data' is the array of logs
    // Adjust depending on actual API response structure (e.g. if it returns orders directly)

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/staff")} className="pl-0 hover:bg-transparent text-slate-500">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Staff
                </Button>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Staff Order History</h1>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800">Order Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No order history found for this user.</div>
                        ) : (
                            logs.map((log: any) => (
                                <div key={log.id} className="p-4 space-y-2 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-slate-900">Order #{log.order?.order_number || log.order_id}</div>
                                        <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2">
                                        {log.description}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Amount: <span className="font-medium text-slate-900">₹{log.order?.total_amount || '0.00'}</span>
                                    </div>
                                    {log.order && (
                                        <div className="pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-blue-600 border-blue-200"
                                                onClick={() => navigate(`/orders/${log.order_id}`)}
                                            >
                                                View Order
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No order history found for this user.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log: any) => (
                                        <TableRow key={log.id} className="hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-900">
                                                #{log.order?.order_number || log.order_id}
                                            </TableCell>
                                            <TableCell className="capitalize text-slate-600">
                                                {log.action || 'Created'}
                                            </TableCell>
                                            <TableCell>
                                                ₹{log.order?.total_amount || '0.00'}
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {log.order && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => navigate(`/orders/${log.order_id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t border-gray-100">
                        <Pagination
                            currentPage={logsData?.current_page || 1}
                            totalPages={logsData?.last_page || 1}
                            onPageChange={setPage}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
