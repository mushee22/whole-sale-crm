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
import { UpdateStatusModal } from "./components/UpdateStatusModal";
import { Truck, FileText, ExternalLink } from "lucide-react";
import { downloadInvoice } from "../accounts/api/invoices";
import { PermissionGuard } from "../../hooks/usePermission";

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
                        <PermissionGuard module="orders" action="update">
                            <Button variant="outline" className="flex-1 sm:flex-none gap-2 text-slate-700" onClick={() => navigate(`/orders/edit/${orderId}`)}>
                                <Pencil className="h-4 w-4" />
                                Edit Order
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard module="orders" action="update_status">
                            <UpdateStatusModal
                                orderId={orderId}
                                currentStatus={order.status}
                                trigger={
                                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 text-slate-700">
                                        <Pencil className="h-4 w-4" />
                                        Update Status
                                    </Button>
                                }
                            />
                        </PermissionGuard>
                        <PermissionGuard module="orders" action="delete">
                            <Button variant="destructive" className="flex-1 sm:flex-none gap-2 bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            {/* Title & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        {order.unique_id || order.order_number || `Order #${order.id}`}
                        <span className="text-base font-normal px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            #{order.id}
                        </span>
                    </h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mt-2">
                        <span>Placed: {new Date(order.order_date).toLocaleString()}</span>
                        {order.estimated_delivery_date && (
                            <span>Est. Delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}</span>
                        )}
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-semibold uppercase",
                            order.status === 'out_for_delivery' ? "bg-amber-100 text-amber-700" :
                                order.status === 'delivered' ? "bg-green-100 text-green-700" :
                                    order.status === 'dispatched' ? "bg-blue-100 text-blue-700" :
                                        "bg-gray-100 text-gray-700"
                        )}>{order.status.replace(/_/g, ' ')}</span>
                    </div>
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
                                {order.items?.map((item) => {
                                    const deliveryCheck = order.delivery_checks?.find((dc: any) => dc.order_item_id === item.id);
                                    return (
                                        <div key={item.id} className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-slate-900">{item.product.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        {item.product.color_id && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Color: {item.product.color_id}</span>}
                                                        {item.product.size_id && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Size: {item.product.size_id}</span>}
                                                    </div>
                                                    {item.comment && (
                                                        <div className="text-xs text-slate-600 mt-1 italic bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                                            <span className="font-semibold not-italic">Note:</span> {item.comment}
                                                        </div>
                                                    )}
                                                    {item.attachment_url && (
                                                        <div className="mt-1">
                                                            <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                <FileText className="h-3 w-3" /> View Attachment
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right font-medium text-slate-900">
                                                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>Price: ₹{item.price}</span>
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                            {/* Status Chips */}
                                            <div className="flex gap-2 mt-2">
                                                {item.dispatch_check?.is_checked && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                        ✓ Dispatched
                                                    </span>
                                                )}
                                                {deliveryCheck?.is_delivered && (
                                                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                                                        ✓ Delivered
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
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
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items?.map((item) => {
                                            const deliveryCheck = order.delivery_checks?.find((dc: any) => dc.order_item_id === item.id);
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-slate-900">{item.product.name}</div>
                                                        <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                                                        <div className="flex gap-2 mt-1">
                                                            {item.product.color_id && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Color: {item.product.color_id}</span>}
                                                            {item.product.size_id && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Size: {item.product.size_id}</span>}
                                                        </div>
                                                        {item.comment && (
                                                            <div className="text-xs text-slate-600 mt-1 italic bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                                                <span className="font-semibold not-italic">Note:</span> {item.comment}
                                                            </div>
                                                        )}
                                                        {item.attachment_url && (
                                                            <div className="mt-1">
                                                                <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                    <FileText className="h-3 w-3" /> View Attachment
                                                                </a>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">₹{item.price}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {item.dispatch_check?.is_checked && (
                                                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                    Dispatched
                                                                </span>
                                                            )}
                                                            {deliveryCheck?.is_delivered && (
                                                                <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                    Delivered
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery & Logistics Info */}
                    {order.deliveries && order.deliveries.length > 0 && (
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-indigo-500" />
                                    Delivery Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.deliveries.map((delivery: any) => (
                                        <div key={delivery.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-semibold text-slate-800">Assigned Delivery Boy</span>
                                                <span className="text-xs text-slate-500">Assigned: {new Date(delivery.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 uppercase font-bold text-xs">
                                                    {delivery.delivery_boy.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{delivery.delivery_boy.name}</p>
                                                    <div className="flex gap-3 text-xs text-slate-500">
                                                        <span>{delivery.delivery_boy.phone}</span>
                                                        <span>{delivery.delivery_boy.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-slate-600">
                                                <strong>Scheduled Date:</strong> {new Date(delivery.delivery_date).toDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Invoice Info */}
                    {order.invoice && (
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    Invoice Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Invoice #{order.invoice.id}</p>
                                        <p className="text-xs text-slate-500">
                                            Date: {new Date(order.invoice.invoice_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">
                                            Amount: ₹{order.invoice.total_amount}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 sm:flex-none gap-2"
                                            onClick={async () => {
                                                try {
                                                    if (!order.invoice) return;
                                                    const blob = await downloadInvoice(order.invoice.id);
                                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `invoice-${order.unique_id || order.id}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                } catch (error) {
                                                    console.error("Failed to download invoice", error);
                                                    toast.error("Failed to download invoice");
                                                }
                                            }}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Download
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1 sm:flex-none gap-2"
                                            onClick={() => navigate(`/accounts/${order.invoice?.id}`)}
                                        >
                                            View Details <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                            <div
                                className="flex items-center gap-3 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                                onClick={() => navigate(`/customers/${order.customer.id}`)}
                            >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{order.customer.name}</p>
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
                                {order.customer.outstanding_amount && (
                                    <div className="flex flex-col gap-1 mt-2 p-2 bg-red-50 rounded border border-red-100">
                                        <span className="text-xs text-red-600 font-medium">Outstanding Amount</span>
                                        <span className="text-sm font-bold text-red-700">₹{order.customer.outstanding_amount}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Creator Info */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Order Created By</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{order.creator?.name || "Unknown"}</p>
                                    <p className="text-xs text-slate-500">{order.creator?.role_id === 1 ? "Admin" : "Staff"}</p>
                                </div>
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
