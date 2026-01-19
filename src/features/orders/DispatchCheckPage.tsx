import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Truck, ArrowLeft } from "lucide-react";
import { getOrder, dispatchCheck, updateOrderStatus } from "./api/orders";

export default function DispatchCheckPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const orderId = parseInt(id || "0");

    const { data: order, isLoading } = useQuery({
        queryKey: ['orders', orderId],
        queryFn: () => getOrder(orderId),
        enabled: !!orderId,
    });

    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (order?.items) {
            const initial: Record<number, boolean> = {};
            order.items.forEach(item => {
                // Initialize based on existing api state
                // dispatch_check object exists even if is_checked is false, so we must access the property
                initial[item.id] = item.dispatch_check?.is_checked || false;
            });
            setCheckedItems(initial);
        }
    }, [order]);

    const checkMutation = useMutation({
        mutationFn: ({ itemId, is_checked }: { itemId: number; is_checked: boolean }) =>
            dispatchCheck(orderId, { order_item_id: itemId, is_checked }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
        },
        onError: () => {
            toast.error("Failed to update item status");
        }
    });

    const statusMutation = useMutation({
        mutationFn: () => updateOrderStatus(orderId, 'out_for_delivery'),
        onSuccess: () => {
            toast.success("Order marked Out for Delivery");
            navigate('/sales/dispatched-orders');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    });

    const handleCheck = (itemId: number, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
        checkMutation.mutate({ itemId, is_checked: checked });
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const allChecked = order.items && order.items.length > 0 && order.items.every(item => checkedItems[item.id]);

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-4">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Dispatch Check - Order #{order.id}</span>
                        <span className="text-sm font-normal text-gray-500">
                            {order.items?.length} Items
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
                        Please verify each item physically before checking it off. Once all items are verified, you can mark the order as "Out for Delivery".
                    </p>

                    <div className="space-y-4">
                        {order.items?.map((item) => (
                            <div key={item.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:bg-slate-50 transition-colors">
                                <Checkbox
                                    id={`item-${item.id}`}
                                    checked={checkedItems[item.id] || false}
                                    onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                                    className="mt-1 h-5 w-5"
                                />
                                <div className="flex-1 space-y-1">
                                    <label
                                        htmlFor={`item-${item.id}`}
                                        className="text-base font-medium leading-none cursor-pointer block"
                                    >
                                        {item.product.name}
                                    </label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        <span>Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                                        <span>SKU: {item.product.sku || '-'}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {item.product.color_id && (
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Color: {item.product.color_id}</span>
                                        )}
                                        {item.product.size_id && (
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Size: {item.product.size_id}</span>
                                        )}
                                    </div>
                                    {item.product.description && (
                                        <p className="text-xs text-slate-500 mt-1">{item.product.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <Button
                            className="w-full gap-2 h-12 text-lg"
                            disabled={!allChecked || statusMutation.isPending}
                            onClick={() => statusMutation.mutate()}
                            variant={allChecked ? "default" : "secondary"}
                        >
                            <Truck className="h-5 w-5" />
                            {statusMutation.isPending ? "Updating..." : "Mark Out for Delivery"}
                        </Button>
                        {!allChecked && (
                            <p className="text-xs text-center text-amber-600 mt-3">
                                * All items must be checked to proceed.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
