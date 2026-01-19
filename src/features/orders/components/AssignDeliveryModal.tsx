import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { assignDelivery } from "../api/orders";
import { getUsers } from "../../users/api/users";

const assignDeliverySchema = z.object({
    delivery_boy_id: z.coerce.number().min(1, "Delivery boy is required"),
    delivery_date: z.string().min(1, "Delivery date is required"),
});

type AssignDeliveryData = z.infer<typeof assignDeliverySchema>;

interface AssignDeliveryModalProps {
    orderId: number;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AssignDeliveryModal({ orderId, trigger, open, onOpenChange, onSuccess }: AssignDeliveryModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AssignDeliveryData>({
        resolver: zodResolver(assignDeliverySchema) as any,
    });

    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["users-list", "delivery-boys"], // Added specific key to avoid caching issues with generic list
        queryFn: () => getUsers({ per_page: 100, role_id: 3 }),
    });

    const assignMutation = useMutation({
        mutationFn: (data: AssignDeliveryData) => assignDelivery(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            toast.success("Delivery assigned successfully");
            setIsOpen && setIsOpen(false);
            reset();
            onSuccess && onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to assign delivery");
        },
    });

    const onSubmit = (data: AssignDeliveryData) => {
        assignMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Delivery</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="delivery_boy">Delivery Boy</Label>
                        <Select onValueChange={(val) => setValue("delivery_boy_id", parseInt(val))}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"} />
                            </SelectTrigger>
                            <SelectContent>
                                {usersData?.data.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.delivery_boy_id && (
                            <p className="text-sm text-red-500">{errors.delivery_boy_id.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="delivery_date">Delivery Date</Label>
                        <Input
                            id="delivery_date"
                            type="date"
                            {...register("delivery_date")}
                        />
                        {errors.delivery_date && (
                            <p className="text-sm text-red-500">{errors.delivery_date.message}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen && setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={assignMutation.isPending}>
                            {assignMutation.isPending ? "Assigning..." : "Assign Delivery"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
