import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { MapPin, Phone, Package, CheckCircle, Truck, Filter, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";

import { useAuth } from "../../../context/AuthContext";
import { getDeliveryOrders } from "../api/orders";
import { PermissionGuard } from "../../../hooks/usePermission";

export default function MyOrdersPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string>('out_for_delivery');

    const { data, isLoading } = useQuery({
        queryKey: ['my-delivery-orders', user?.id, statusFilter],
        queryFn: () => getDeliveryOrders(user!.id, {
            status: statusFilter,
            order_date_from: '2024-01-01',
            per_page: 15
        }),
        enabled: !!user?.id
    });


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Deliveries</h2>
                    <p className="text-muted-foreground">Orders assigned to you specifically for delivery.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data?.data.map((order) => (
                    <Card key={order.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-600" />
                                        Order #{order.id}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        {new Date(order.order_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase text-[10px] tracking-wider">
                                    {order.status.replace(/_/g, " ")}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {order.customer?.name || "Guest Customer"}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">Customer</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Phone className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            {order.customer?.phone}
                                        </p>
                                        <p className="text-xs text-slate-500">Contact Number</p>
                                    </div>
                                </div>

                                {order.customer?.location_id && (
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                            <MapPin className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 break-words">
                                                Location ID: {order.customer.location_id}
                                                {/* Fetching location details might be needed if not populated */}
                                            </p>
                                            <p className="text-xs text-slate-500">Delivery Address</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                </Button>
                                {order.status === 'out_for_delivery' && (
                                    <PermissionGuard module="sales" action="delivery_check">
                                        <Button
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            onClick={() => navigate(`/sales/out-for-delivery/${order.id}/check`)}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Delivery Check
                                        </Button>
                                    </PermissionGuard>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data?.data.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-200">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No active deliveries</h3>
                    <p className="text-slate-500 mt-1">You don't have any orders currently out for delivery.</p>
                </div>
            )}
        </div>
    );
}
