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
import { Checkbox } from "../../../components/ui/checkbox";
import { createPettyCashAccount } from "../api/pettyCash";
import { getUsers } from "../../users/api/users";

const createPettyCashSchema = z.object({
    user_id: z.coerce.number().min(1, "User is required"),
    opening_balance: z.coerce.number().min(0, "Opening balance must be positive"),
    is_amount_accepted: z.boolean().default(false),
});

type CreatePettyCashData = z.infer<typeof createPettyCashSchema>;

interface CreatePettyCashModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreatePettyCashModal({ trigger, open, onOpenChange }: CreatePettyCashModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CreatePettyCashData>({
        resolver: zodResolver(createPettyCashSchema) as any,
        defaultValues: {
            opening_balance: 0,
            is_amount_accepted: false,
        },
    });

    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["users-list"],
        queryFn: () => getUsers({ per_page: 100 }), // Fetch enough users for the dropdown
    });

    const createMutation = useMutation({
        mutationFn: createPettyCashAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
            toast.success("Petty cash account created successfully");
            setIsOpen && setIsOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create petty cash account");
        },
    });

    const onSubmit = (data: CreatePettyCashData) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Petty Cash Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">User</Label>
                        <Select onValueChange={(val) => setValue("user_id", parseInt(val))}>
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
                        {errors.user_id && (
                            <p className="text-sm text-red-500">{errors.user_id.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="opening_balance">Opening Balance</Label>
                        <Input
                            id="opening_balance"
                            type="number"
                            step="0.01"
                            {...register("opening_balance")}
                        />
                        {errors.opening_balance && (
                            <p className="text-sm text-red-500">{errors.opening_balance.message}</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_amount_accepted"
                            onCheckedChange={(checked) => setValue("is_amount_accepted", checked as boolean)}
                        />
                        <Label htmlFor="is_amount_accepted">Amount Accepted</Label>
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
                            {createMutation.isPending ? "Creating..." : "Create Account"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
