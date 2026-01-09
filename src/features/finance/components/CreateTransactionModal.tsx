import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "../../../components/ui/textarea";  // Need to verify if this exists, otherwise use Input
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { createCustomerTransaction } from "../api/customerTransactions";
import { getCustomers } from "../../customers/api/customers";
import { useAuth } from "../../../context/AuthContext";
import { useEffect } from "react";

// Schema definition
const createTransactionSchema = z.object({
    customer_id: z.coerce.number().min(1, "Customer is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["credit", "debit"]),
    payment_mode: z.string().min(1, "Payment mode is required"),
    collected_by: z.coerce.number().min(1, "Collector is required"),
    date: z.string().min(1, "Date is required"),
    note: z.string().optional().default(""),
});

type CreateTransactionData = z.infer<typeof createTransactionSchema>;

interface CreateTransactionModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateTransactionModal({ trigger, open, onOpenChange }: CreateTransactionModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { register, control, handleSubmit, formState: { errors }, reset, setValue } = useForm<CreateTransactionData>({
        resolver: zodResolver(createTransactionSchema) as any,
        defaultValues: {
            amount: 0,
            type: "credit",
            payment_mode: "cash",
            date: new Date().toISOString().split('T')[0],
            note: "",
        },
    });

    useEffect(() => {
        if (user?.id) {
            setValue("collected_by", user.id);
        }
    }, [user, setValue]);



    const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customers-list"],
        queryFn: () => getCustomers({ per_page: 100 }), // Assuming getCustomers supports pagination params or similar
    });

    const createMutation = useMutation({
        mutationFn: createCustomerTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-transactions"] });
            toast.success("Transaction created successfully");
            setIsOpen && setIsOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create transaction");
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
                    <DialogTitle>Add Customer Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="customer">Customer</Label>
                            <Controller
                                name="customer_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCustomers ? "Loading..." : "Select customer"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customersData?.data.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name} ({customer.phone})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.customer_id && (
                                <p className="text-sm text-red-500">{errors.customer_id.message}</p>
                            )}
                        </div>

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

                        <div className="space-y-2">
                            <Label htmlFor="payment_mode">Payment Mode</Label>
                            <Controller
                                name="payment_mode"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="upi">UPI</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.payment_mode && (
                                <p className="text-sm text-red-500">{errors.payment_mode.message}</p>
                            )}
                        </div>



                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                {...register("date")}
                            />
                            {errors.date && (
                                <p className="text-sm text-red-500">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 col-span-2">
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
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen && setIsOpen(false)}
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
