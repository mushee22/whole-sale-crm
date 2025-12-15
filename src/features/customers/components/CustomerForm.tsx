import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { createCustomer, createCustomerSchema, type CreateCustomerData, type Customer } from "../api/customers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CustomerFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Customer;
}

export default function CustomerForm({ onSuccess, onCancel, initialData }: CustomerFormProps) {
    const queryClient = useQueryClient();
    const isEditMode = !!initialData;

    const { register, handleSubmit, formState: { errors } } = useForm<CreateCustomerData>({
        resolver: zodResolver(createCustomerSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            phone: initialData.phone,
            whatsapp_no: initialData.whatsapp_no || "",
            email: initialData.email || "",
            total_earned_points: initialData.total_earned_points,
            total_referral_points: initialData.total_referral_points,
            total_used_points: initialData.total_used_points,
        } : {
            total_earned_points: 0,
            total_referral_points: 0,
            total_used_points: 0,
        }
    });

    const mutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            toast.success("Customer saved successfully");
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error("Failed to save customer");
            console.error(error);
        }
    });

    const onSubmit = (data: CreateCustomerData) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input id="name" placeholder="John Doe" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" placeholder="1234567890" {...register("phone")} />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="whatsapp_no">WhatsApp Number (Optional)</Label>
                    <Input id="whatsapp_no" placeholder="1234567890" {...register("whatsapp_no")} />
                    {errors.whatsapp_no && <p className="text-sm text-red-500">{errors.whatsapp_no.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" type="email" placeholder="customer@example.com" {...register("email")} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                {isEditMode && (
                    <>
                        <div className="col-span-full pt-4 border-t">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Loyalty Points</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="total_earned_points">Points Earned</Label>
                                    <Input
                                        id="total_earned_points"
                                        type="number"
                                        min="0"
                                        {...register("total_earned_points", { valueAsNumber: true })}
                                    />
                                    {errors.total_earned_points && <p className="text-sm text-red-500">{errors.total_earned_points.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="total_referral_points">Referral Points</Label>
                                    <Input
                                        id="total_referral_points"
                                        type="number"
                                        min="0"
                                        {...register("total_referral_points", { valueAsNumber: true })}
                                    />
                                    {errors.total_referral_points && <p className="text-sm text-red-500">{errors.total_referral_points.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="total_used_points">Points Used</Label>
                                    <Input
                                        id="total_used_points"
                                        type="number"
                                        min="0"
                                        {...register("total_used_points", { valueAsNumber: true })}
                                    />
                                    {errors.total_used_points && <p className="text-sm text-red-500">{errors.total_used_points.message}</p>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Customer"}
                </Button>
            </div>
        </form>
    );
}
