import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, deleteOrder } from "./api/orders";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ArrowLeft, Pencil, Trash2, User, Phone, Mail, Award } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { AssignDeliveryModal } from "./components/AssignDeliveryModal";
import { Truck } from "lucide-react";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const orderId = Number(id);

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId),
        enabled: !!orderId
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOrder,
        onSuccess: () => {
            toast.success("Order deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            navigate("/orders");
        },
        onError: () => toast.error("Failed to delete order")
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            deleteMutation.mutate(orderId);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-slate-900" onClick={() => navigate("/orders")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Button>
                {user?.role !== 'staff' && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <AssignDeliveryModal
                            orderId={orderId}
                            trigger={
                                <Button variant="outline" className="flex-1 sm:flex-none gap-2 text-slate-700 bg-blue-50 hover:bg-blue-100 border-blue-200">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                    Assign Delivery
                                </Button>
                            }
                        />
                        <Button variant="outline" className="flex-1 sm:flex-none gap-2 text-slate-700" onClick={() => navigate(`/orders/edit/${orderId}`)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="destructive" className="flex-1 sm:flex-none gap-2 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Title & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{order.order_number}</h1>
                    <p className="text-slate-500 mt-1">Placed on {new Date(order.order_date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Amount</div>
                        <div className="text-2xl font-bold text-slate-900">₹{order.total_amount}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items & Ledger */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Mobile Item List */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-slate-900">{item.product.name}</div>
                                                <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                                            </div>
                                            <div className="text-right font-medium text-slate-900">
                                                ₹{(Number(item.unit_price) * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Price: ₹{item.unit_price}</span>
                                            <span>Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items?.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">{item.product.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                                                </TableCell>
                                                <TableCell className="text-right">₹{item.unit_price}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₹{(Number(item.unit_price) * item.quantity).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Points Ledger */}
                    {order.points_ledger && order.points_ledger.length > 0 && (
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-500" />
                                    Loyalty Points History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.points_ledger.map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{entry.description}</p>
                                                <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                                            </div>
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-bold",
                                                entry.type === 'earn' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {entry.type === 'earn' ? '+' : '-'}{entry.points} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Customer Info */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{order.customer.name}</p>
                                    <p className="text-xs text-slate-500">Customer ID: #{order.customer.id}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {order.customer.phone}
                                </div>
                                {order.customer.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {order.customer.email}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Points Summary */}
                    <Card className="shadow-sm border-gray-100 bg-slate-900 text-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Points Earned</span>
                                <span className="text-xl font-bold text-emerald-400">+{order.total_points_earned || 0}</span>
                            </div>
                            {(order.total_points_used_for_claims || 0) > 0 && (
                                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                                    <span className="text-slate-400 text-sm">Points Redeemed</span>
                                    <span className="text-xl font-bold text-amber-400">-{order.total_points_used_for_claims}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
