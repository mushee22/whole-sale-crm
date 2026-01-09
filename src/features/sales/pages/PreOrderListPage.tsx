import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { getPreOrders } from "../api/sales";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";


export function PreOrderListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const status = searchParams.get("status") || "pending";
    const perPage = parseInt(searchParams.get("per_page") || "15");
    const page = parseInt(searchParams.get("page") || "1");

    // We can add customer filter later, taking from params for now if exists
    const customerId = searchParams.get("customer_id") ? parseInt(searchParams.get("customer_id")!) : undefined;

    const { data: preOrdersData, isLoading } = useQuery({
        queryKey: ["pre-orders", status, page, perPage, customerId],
        queryFn: () => getPreOrders({ status, per_page: perPage, page, customer_id: customerId })
    });

    const preOrders = preOrdersData?.data || [];
    // const meta = preOrdersData?.meta;

    const handleStatusChange = (newStatus: string) => {
        setSearchParams(prev => {
            prev.set("status", newStatus);
            prev.set("page", "1"); // Reset to page 1 on status change
            return prev;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Pre-Orders</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>List</CardTitle>
                        <div className="w-[200px]">
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No pre-orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    preOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.customer?.name || "Unknown"}</span>
                                                    <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(order.created_at), "PPP")}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    if (order.total_amount) return `₹${order.total_amount.toFixed(2)}`;

                                                    // Calculate from items if total_amount is missing
                                                    if (order.items && order.items.length > 0) {
                                                        const total = order.items.reduce((sum, item) => {
                                                            return sum + (parseFloat(item.price) * item.quantity);
                                                        }, 0);
                                                        return `₹${total.toFixed(2)}`;
                                                    }

                                                    return "-";
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={order.status === "pending" ? "outline" : "default"}
                                                    className={
                                                        order.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                                            order.status === "approved" ? "bg-green-100 text-green-800 border-green-200" :
                                                                "bg-gray-100 text-gray-800"
                                                    }
                                                >
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => navigate(`/sales/pre-orders/${order.id}/create`)}
                                                >
                                                    Create Order
                                                </Button>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
