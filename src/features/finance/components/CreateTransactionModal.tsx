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
    type: z.enum(["credit", "debit"]).default("credit"),
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
    customerId?: number;
    collectedBy?: number;
}

export function CreateTransactionModal({ trigger, open, onOpenChange, customerId, collectedBy }: CreateTransactionModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setIsOpen = (val: boolean) => {
        if (isControlled && onOpenChange) {
            onOpenChange(val);
        } else if (!isControlled) {
            setInternalOpen(val);
        }
    };

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
            customer_id: customerId,
        },
    });

    useEffect(() => {
        const collectorId = collectedBy || user?.id;
        console.log("CreateTransactionModal Debug:", { collectedByProp: collectedBy, userContextId: user?.id, finalCollectorId: collectorId });

        if (collectorId) {
            console.log("Setting collected_by to:", collectorId);
            setValue("collected_by", collectorId, { shouldDirty: true, shouldValidate: true });
        } else {
            console.error("No collector ID found!");
        }

        if (customerId) {
            setValue("customer_id", customerId);
        }
    }, [user, collectedBy, customerId, setValue]);



    const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customers-list"],
        queryFn: () => getCustomers({ per_page: 100 }), // Assuming getCustomers supports pagination params or similar
        enabled: !customerId, // Don't fetch list if customer is pre-selected? Ideally we still might need name, but usually passed in context. Actually let's fetch to be safe or if allows changing.
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

    const onInvalid = (errors: any) => {
        console.error("Form validation errors:", errors);
        if (errors.collected_by) {
            toast.error(`Validation Error: ${errors.collected_by.message}`);
        }
        if (errors.customer_id) {
            // Customer error is visible, but good to debug
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Customer Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 pt-4">
                    <input type="hidden" {...register("collected_by")} />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="customer">Customer</Label>
                            <Controller
                                name="customer_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(val) => field.onChange(parseInt(val))}
                                        value={field.value?.toString()}
                                        disabled={!!customerId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCustomers ? "Loading..." : "Select customer"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customerId && customersData && !customersData.data.find(c => c.id === customerId) ? (
                                                // Fallback if the pre-selected customer isn't in the page 1 list... 
                                                // Ideally we would fetch that specific customer. But for now let's assume it works or we rely on the list.
                                                // If customerId is passed, maybe the parent should pass the name?
                                                // For now, let's just show the ID if name not found, or rely on fetching.
                                                <SelectItem value={customerId.toString()}>Current Customer ({customerId})</SelectItem>
                                            ) : null}
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
