import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { updateCustomerTransaction } from "../api/customerTransactions";

export interface EditableTransaction {
    id: number;
    amount: string;
    note?: string | null;
    description?: string | null;
}

const updateTransactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    note: z.string().optional(),
});

type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;

interface EditTransactionModalProps {
    transaction: EditableTransaction;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditTransactionModal({ transaction, trigger, open, onOpenChange }: EditTransactionModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm<UpdateTransactionData>({
        resolver: zodResolver(updateTransactionSchema) as any,
        defaultValues: {
            amount: parseFloat(transaction.amount),
            note: transaction.note || transaction.description || "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateTransactionData) => updateCustomerTransaction(transaction.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-transactions"] });
            toast.success("Transaction updated successfully");
            setIsOpen && setIsOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update transaction");
        },
    });

    const onSubmit = (data: UpdateTransactionData) => {
        updateMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction #{transaction.id}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register("amount")}
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                            id="note"
                            placeholder="Optional note..."
                            {...register("note")}
                        />
                        {errors.note && (
                            <p className="text-sm text-red-500">{errors.note.message}</p>
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
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Update Transaction"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
