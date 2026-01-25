import { useQuery } from "@tanstack/react-query";
import { getOrder } from "../api/orders";
import { Modal } from "../../../components/ui/modal";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "../../../components/ui/table";
import { Award, ShoppingBag, Calendar } from "lucide-react";
import { Badge } from "../../../components/ui/badge";

interface OrderDetailsModalProps {
    orderId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId!),
        enabled: !!orderId && isOpen,
    });

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={order ? `Order #${order.unique_id || order.id}` : "Order Details"}
        >
            {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading order details...</div>
            ) : !order ? (
                <div className="p-8 text-center text-red-500">Order not found</div>
            ) : (
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.order_date).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                                    Items
                                </Badge>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Total: ₹{order.total_amount}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="text-sm font-semibold text-gray-900">{order.customer.name}</div>
                            <div className="text-xs text-gray-500">{order.customer.phone}</div>
                            {order.customer.location && (
                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    {order.customer.location.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-gray-500" />
                            Items
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead className="py-2 h-9 text-xs">Product</TableHead>
                                        <TableHead className="py-2 h-9 text-xs text-right">Price</TableHead>
                                        <TableHead className="py-2 h-9 text-xs text-center">Qty</TableHead>
                                        <TableHead className="py-2 h-9 text-xs text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="py-2">
                                                <div className="font-medium text-sm text-slate-900">{item.product.name}</div>
                                                <div className="text-[10px] text-gray-500">
                                                    {item.product.sku ? `SKU: ${item.product.sku}` : ''}
                                                    {item.product.color_id ? ` • Color: ${item.product.color_id}` : ''}
                                                    {item.product.size_id ? ` • Size: ${item.product.size_id}` : ''}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-right text-sm">₹{item.price}</TableCell>
                                            <TableCell className="py-2 text-center text-sm">{item.quantity}</TableCell>
                                            <TableCell className="py-2 text-right font-medium text-sm">
                                                ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Points Info */}
                    {(order.total_points_earned || 0) > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Points Earned</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">+{order.total_points_earned}</span>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
