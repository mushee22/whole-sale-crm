import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Truck } from "lucide-react";
import { dispatchCheck, updateOrderStatus, type Order } from "../api/orders";

interface DispatchCheckModalProps {
    order: Order;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DispatchCheckModal({ order, trigger, open, onOpenChange, onSuccess }: DispatchCheckModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
    const queryClient = useQueryClient();

    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        order.items.forEach(item => {
            initial[item.id] = !!item.dispatch_check;
        });
        return initial;
    });

    const checkMutation = useMutation({
        mutationFn: ({ itemId, checked }: { itemId: number; checked: boolean }) =>
            dispatchCheck(order.id, { order_item_id: itemId, is_checked: checked }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: () => {
            toast.error("Failed to update item status");
        }
    });

    const statusMutation = useMutation({
        mutationFn: () => updateOrderStatus(order.id, 'out-of-delivery'),
        onSuccess: () => {
            toast.success("Order marked Out for Delivery");
            setIsOpen && setIsOpen(false);
            onSuccess && onSuccess();
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    });

    const handleCheck = (itemId: number, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
        checkMutation.mutate({ itemId, checked });
    };

    const allChecked = order.items.length > 0 && order.items.every(item => checkedItems[item.id]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Dispatch Check - Order #{order.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        Verify all items before marking the order as Out for Delivery.
                    </p>
                    <div className="h-[300px] overflow-y-auto pr-4 rounded-md border p-2">
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <Checkbox
                                        id={`item-${item.id}`}
                                        checked={checkedItems[item.id] || false}
                                        onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1 leading-none">
                                        <label
                                            htmlFor={`item-${item.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {item.product.name}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} • {item.product.sku || 'No SKU'}
                                        </p>
                                        {item.product.description && (
                                            <p className="text-xs text-slate-400 line-clamp-1">{item.product.description}</p>
                                        )}
                                        {item.product.color_id && (
                                            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-600 mr-2">Color ID: {item.product.color_id}</span>
                                        )}
                                        {item.product.size_id && (
                                            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-600">Size ID: {item.product.size_id}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            className="w-full gap-2"
                            disabled={!allChecked || statusMutation.isPending}
                            onClick={() => statusMutation.mutate()}
                            variant={allChecked ? "default" : "secondary"}
                        >
                            <Truck className="h-4 w-4" />
                            {statusMutation.isPending ? "Updating..." : "Mark Out for Delivery"}
                        </Button>
                        {!allChecked && (
                            <p className="text-xs text-center text-amber-600 bg-amber-50 py-2 rounded-md">
                                Please check all items to proceed.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
