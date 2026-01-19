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
import { Label } from "../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { updateOrderStatus } from "../api/orders";

interface UpdateStatusModalProps {
    orderId: number;
    currentStatus: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function UpdateStatusModal({ orderId, currentStatus, trigger, open, onOpenChange, onSuccess }: UpdateStatusModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
    const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);

    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (status: string) => updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast.success("Order status updated successfully");
            setIsOpen && setIsOpen(false);
            onSuccess && onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update order status");
        },
    });

    const handleUpdate = () => {
        if (selectedStatus === currentStatus) {
            setIsOpen && setIsOpen(false);
            return;
        }
        updateMutation.mutate(selectedStatus);
    };

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "dispatched", label: "Dispatched" },
        { value: "out_for_delivery", label: "Out For Delivery" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Order Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Order Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen && setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending || selectedStatus === currentStatus}>
                            {updateMutation.isPending ? "Updating..." : "Update Status"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
