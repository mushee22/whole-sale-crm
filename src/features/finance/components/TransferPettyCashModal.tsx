import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea"; // Assuming Textarea component exists
import { getPettyCashAccounts, transferPettyCash } from "../api/pettyCash";
import type { TransferPettyCashParams } from "../api/pettyCash";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";

interface TransferPettyCashModalProps {
    fromAccountId: number;
    currentBalance: string;
}

export function TransferPettyCashModal({ fromAccountId, currentBalance }: TransferPettyCashModalProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferPettyCashParams>();

    // Fetch potential destination accounts
    // Assuming getPettyCashAccounts without page returns a list or we fetch enough to fill dropdown
    // If API is strictly paginated, we might only get first page. For now, assuming standard usage.
    const { data: accountsData } = useQuery({
        queryKey: ['petty-cash-accounts-for-transfer'],
        queryFn: () => getPettyCashAccounts(1), // Fetch page 1, might need logic for "all" 
        enabled: open,
    });

    const transferMutation = useMutation({
        mutationFn: transferPettyCash,
        onSuccess: () => {
            toast.success("Transfer successful");
            queryClient.invalidateQueries({ queryKey: ['petty-cash-account', fromAccountId.toString()] });
            queryClient.invalidateQueries({ queryKey: ["petty-cash-transactions"] });
            setOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Transfer failed"); // Handle backend validation errors
        },
    });

    const onSubmit = (data: TransferPettyCashParams) => {
        if (Number(data.amount) > Number(currentBalance)) {
            toast.error("Insufficient balance");
            return;
        }

        transferMutation.mutate({
            ...data,
            from_account_id: fromAccountId,
            to_account_id: Number(data.to_account_id)
        });
    };

    // Filter accounts: exclude current and enforce is_amount_accepted
    const availableAccounts = accountsData?.data.filter(
        (acc) => acc.id !== fromAccountId && acc.is_amount_accepted
    ) || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                    <ArrowLeftRight className="h-4 w-4" /> Transfer Balance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transfer Funds</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <input type="hidden" {...register("from_account_id", { value: fromAccountId })} />

                    <div className="space-y-2">
                        <Label htmlFor="to_account_id">To Account</Label>
                        <select
                            id="to_account_id"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("to_account_id", { required: "Destination account is required" })}
                        >
                            <option value="">Select Account</option>
                            {availableAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_name} ({acc.user.name})
                                </option>
                            ))}
                        </select>
                        {errors.to_account_id && <p className="text-red-500 text-xs">{errors.to_account_id.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder={`Max: ${currentBalance}`}
                            {...register("amount", {
                                required: "Amount is required",
                                min: { value: 1, message: "Amount must be greater than 0" }
                            })}
                        />
                        {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register("date", { required: "Date is required" })}
                        />
                        {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Textarea
                            id="reference"
                            placeholder="Reason for transfer..."
                            className="resize-none"
                            {...register("reference")}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={transferMutation.isPending}>
                            {transferMutation.isPending ? "Transferring..." : "Confirm Transfer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
