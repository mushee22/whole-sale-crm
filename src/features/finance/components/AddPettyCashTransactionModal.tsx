import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { createPettyCashTransaction } from "../api/pettyCash";

const createTransactionSchema = z.object({
    to_account_id: z.coerce.number().min(1, "Account ID is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["credit", "debit"]),
    reference: z.string().min(1, "Reference is required"),
    date: z.string().min(1, "Date is required"),
});

type CreateTransactionData = z.infer<typeof createTransactionSchema>;

interface AddPettyCashTransactionModalProps {
    trigger?: React.ReactNode;
    accountId: number;
}

export function AddPettyCashTransactionModal({
    trigger,
    accountId,
}: AddPettyCashTransactionModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateTransactionData>({
        resolver: zodResolver(createTransactionSchema) as any,
        defaultValues: {
            to_account_id: accountId,
            amount: 0,
            type: "credit",
            reference: "",
            date: new Date().toISOString().split("T")[0],
        },
    });

    const createMutation = useMutation({
        mutationFn: createPettyCashTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["petty-cash-account", accountId],
            });
            queryClient.invalidateQueries({
                queryKey: ["petty-cash-transactions", accountId],
            });
            toast.success("Transaction created successfully");
            setIsOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || "Failed to create transaction"
            );
        },
    });

    const onSubmit = (data: CreateTransactionData) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <input type="hidden" {...register("to_account_id")} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register("amount")}
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-500">{errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="credit">Credit</SelectItem>
                                            <SelectItem value="debit">Debit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.type && (
                                <p className="text-sm text-red-500">{errors.type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="reference">Reference</Label>
                            <Input
                                id="reference"
                                placeholder="e.g., REF001, Invoice #123"
                                {...register("reference")}
                            />
                            {errors.reference && (
                                <p className="text-sm text-red-500">{errors.reference.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" {...register("date")} />
                            {errors.date && (
                                <p className="text-sm text-red-500">{errors.date.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Adding..." : "Add Transaction"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
