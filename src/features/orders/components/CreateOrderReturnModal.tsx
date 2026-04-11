import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { toast } from "sonner";
import { createOrderReturn, type OrderItem, type CreateOrderReturnParams } from "../api/orders";

const createReturnSchema = z.object({
    return_date: z.string().min(1, "Return date is required"),
    note: z.string().optional(),
});

type CreateReturnFormData = z.infer<typeof createReturnSchema>;

interface CreateOrderReturnModalProps {
    orderId: number;
    orderItems: OrderItem[];
    isOpen: boolean;
    onClose: () => void;
}

export function CreateOrderReturnModal({ orderId, orderItems, isOpen, onClose }: CreateOrderReturnModalProps) {
    const queryClient = useQueryClient();
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateReturnFormData>({
        resolver: zodResolver(createReturnSchema),
        defaultValues: {
            return_date: new Date().toISOString().split('T')[0],
            note: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateOrderReturnParams) => createOrderReturn(orderId, data),
        onSuccess: () => {
            toast.success("Order return created successfully");
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orderReturns', orderId] });
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create return");
        },
    });

    const handleClose = () => {
        reset();
        setSelectedItems(new Set());
        setItemQuantities({});
        onClose();
    };

    const handleItemToggle = (itemId: number, checked: boolean) => {
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(itemId);
            // Set default quantity to 1
            setItemQuantities(prev => ({ ...prev, [itemId]: 1 }));
        } else {
            newSelected.delete(itemId);
            const newQuantities = { ...itemQuantities };
            delete newQuantities[itemId];
            setItemQuantities(newQuantities);
        }
        setSelectedItems(newSelected);
    };

    const handleQuantityChange = (itemId: number, value: string) => {
        const numValue = parseInt(value) || 0;
        setItemQuantities(prev => ({ ...prev, [itemId]: numValue }));
    };

    const onSubmit = (data: CreateReturnFormData) => {
        const returnItems = Array.from(selectedItems).map(itemId => ({
            order_item_id: itemId,
            quantity: itemQuantities[itemId] || 1,
        }));

        if (returnItems.length === 0) {
            toast.error("Please select at least one item to return");
            return;
        }

        // Validate quantities
        for (const item of returnItems) {
            const orderItem = orderItems.find(oi => oi.id === item.order_item_id);
            if (!orderItem) continue;
            if (item.quantity > orderItem.quantity) {
                toast.error(`Return quantity for ${orderItem.product.name} cannot exceed ordered quantity`);
                return;
            }
        }

        createMutation.mutate({
            return_date: data.return_date,
            note: data.note,
            items: returnItems,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Order Return</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Return Date */}
                    <div className="space-y-2">
                        <Label htmlFor="return_date">Return Date *</Label>
                        <Input
                            id="return_date"
                            type="date"
                            {...register("return_date")}
                        />
                        {errors.return_date && (
                            <p className="text-sm text-red-500">{errors.return_date.message}</p>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <textarea
                            id="note"
                            {...register("note")}
                            className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Reason for return (e.g., damaged goods, wrong item)"
                        />
                        {errors.note && (
                            <p className="text-sm text-red-500">{errors.note.message}</p>
                        )}
                    </div>

                    {/* Items Selection */}
                    <div className="space-y-3">
                        <Label>Select Items to Return *</Label>
                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                            {orderItems.map((item) => {
                                const isSelected = selectedItems.has(item.id);
                                const quantity = itemQuantities[item.id] || 1;

                                return (
                                    <div key={item.id} className="p-3 hover:bg-gray-50">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{item.product.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    Ordered Qty: {item.quantity}
                                                </div>
                                                {isSelected && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Label htmlFor={`qty-${item.id}`} className="text-xs">
                                                            Return Qty:
                                                        </Label>
                                                        <Input
                                                            id={`qty-${item.id}`}
                                                            type="number"
                                                            min="1"
                                                            max={item.quantity}
                                                            value={quantity}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="w-20 h-8 text-sm"
                                                        />
                                                        <span className="text-xs text-gray-500">
                                                            of {item.quantity}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {selectedItems.size === 0 && (
                            <p className="text-sm text-amber-600">Please select at least one item</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || selectedItems.size === 0}
                        >
                            {createMutation.isPending ? "Creating..." : "Create Return"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
