import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { deletePettyCashAccount, getPettyCashAccounts, transferPettyCash, type PettyCashAccount, type TransferPettyCashParams } from "../api/pettyCash";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ArrowRight } from "lucide-react";

interface DeletePettyCashAccountModalProps {
    account: PettyCashAccount;
    trigger?: React.ReactNode;
}

type Step = 'confirm' | 'transfer' | 'delete';

export function DeletePettyCashAccountModal({ account, trigger }: DeletePettyCashAccountModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('confirm');
    const queryClient = useQueryClient();
    const currentBalance = parseFloat(account.current_balance);
    const hasBalance = currentBalance > 0;

    const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferPettyCashParams>();

    // Fetch accounts for transfer if needed
    const { data: accountsData } = useQuery({
        queryKey: ['petty-cash-accounts-for-delete-transfer'],
        queryFn: () => getPettyCashAccounts(1), // Fetch page 1
        enabled: open && hasBalance && step === 'transfer',
    });

    const transferMutation = useMutation({
        mutationFn: transferPettyCash,
        onSuccess: () => {
            toast.success("Balance transferred successfully");
            queryClient.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
            // Proceed to delete
            deleteMutation.mutate();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Transfer failed");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePettyCashAccount(account.id),
        onSuccess: () => {
            toast.success("Account deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
            setOpen(false);
            reset();
            setStep('confirm');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete account");
        },
    });



    const onDeleteConfirm = () => {
        deleteMutation.mutate();
    };

    const onTransferSubmit = (data: TransferPettyCashParams) => {
        transferMutation.mutate({
            ...data,
            from_account_id: account.id,
            to_account_id: Number(data.to_account_id),
            amount: currentBalance, // Transfer full balance
            date: new Date().toISOString().split('T')[0], // Default to today
        });
    };

    // accountsData is async, need to filter
    const availableAccounts = accountsData?.data.filter(
        (acc) => acc.id !== account.id && acc.is_amount_accepted
    ) || [];

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setTimeout(() => setStep('confirm'), 300); // Reset step after close
                reset();
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" /> Delete Account
                    </DialogTitle>
                </DialogHeader>

                {step === 'confirm' && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg text-amber-900 border border-amber-100">
                            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                            <div className="space-y-1">
                                <p className="font-medium">Warning</p>
                                <p className="text-sm opacity-90">
                                    Are you sure you want to delete <strong>{account.account_name}</strong>?
                                    This action cannot be undone.
                                </p>
                                {hasBalance && (
                                    <p className="text-sm font-semibold mt-2 text-amber-700">
                                        This account has a balance of {currentBalance.toFixed(2)}.
                                        You must transfer it before deleting.
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {/* <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button> */}
                            {hasBalance && (
                                <Button
                                    variant="default"
                                    onClick={() => setStep('transfer')}
                                >
                                    Transfer Balance <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                onClick={() => setStep('delete')}
                            >
                                {hasBalance ? "Delete" : "Delete Account"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'transfer' && (
                    <form onSubmit={handleSubmit(onTransferSubmit)} className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg text-blue-900 border border-blue-100 mb-4">
                            <p className="text-sm">
                                Transferring entire balance of <strong>{currentBalance.toFixed(2)}</strong> to proceed with deletion.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="to_account_id">Transfer To</Label>
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
                            <Label htmlFor="reference">Reference / Note</Label>
                            <Textarea
                                id="reference"
                                placeholder="Reason for transfer (e.g. Closing account)"
                                className="resize-none"
                                {...register("reference")}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStep('confirm')}>Back</Button>
                            <Button type="submit" disabled={transferMutation.isPending || deleteMutation.isPending}>
                                {transferMutation.isPending ? "Transferring..." : "Confirm Transfer & Delete"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === 'delete' && (
                    <div className="space-y-4 pt-2">
                        <DialogDescription>
                            Are you absolutely sure? This account will be permanently removed.
                        </DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep('confirm')}>Back</Button>
                            <Button
                                variant="destructive"
                                onClick={onDeleteConfirm}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
