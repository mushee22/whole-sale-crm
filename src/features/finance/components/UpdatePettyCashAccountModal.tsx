import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { updatePettyCashAccount, type PettyCashAccount } from "../api/pettyCash";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface UpdatePettyCashAccountModalProps {
    account: PettyCashAccount;
    trigger?: React.ReactNode;
}

interface UpdatePettyCashFormData {
    opening_balance: number;
    is_amount_accepted: boolean;
}

export function UpdatePettyCashAccountModal({ account, trigger }: UpdatePettyCashAccountModalProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UpdatePettyCashFormData>({
        defaultValues: {
            opening_balance: parseFloat(account.opening_balance),
            is_amount_accepted: account.is_amount_accepted
        }
    });

    const isAmountAccepted = watch("is_amount_accepted");

    const updateMutation = useMutation({
        mutationFn: (data: UpdatePettyCashFormData) => updatePettyCashAccount(account.id, data),
        onSuccess: () => {
            toast.success("Account updated successfully");
            queryClient.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["petty-cash-account", account.id] });
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update account");
        },
    });

    const onSubmit = (data: UpdatePettyCashFormData) => {
        updateMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="opening_balance">Opening Balance</Label>
                        <Input
                            id="opening_balance"
                            type="number"
                            step="0.01"
                            {...register("opening_balance", {
                                required: "Opening balance is required",
                                min: { value: 0, message: "Balance cannot be negative" }
                            })}
                        />
                        {errors.opening_balance && (
                            <p className="text-red-500 text-xs">{errors.opening_balance.message}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_amount_accepted"
                            checked={isAmountAccepted}
                            onCheckedChange={(checked) => setValue("is_amount_accepted", checked as boolean)}
                        />
                        <Label htmlFor="is_amount_accepted">Accepts Incoming Transfers</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Update Account"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
