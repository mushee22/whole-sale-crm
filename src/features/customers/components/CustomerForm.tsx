import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { createCustomer, createCustomerSchema, type CreateCustomerData, type Customer } from "../api/customers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { getLocations } from "../../master-data/api/locations";

interface CustomerFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Customer;
}

export default function CustomerForm({ onSuccess, onCancel, initialData }: CustomerFormProps) {
    const queryClient = useQueryClient();

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: getLocations
    });

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<CreateCustomerData>({
        resolver: zodResolver(createCustomerSchema) as any,
        defaultValues: initialData ? {
            name: initialData.name,
            phone: initialData.phone,
            location_id: initialData.location_id || 0,
        } : {
            name: "",
            phone: "",
            location_id: 0
        }
    });

    // Watch location_id to manage Select value state if needed, though Select usually handles itself via onValueChange
    // const currentLocationId = watch("location_id");

    const mutation = useMutation({
        mutationFn: (data: CreateCustomerData) => {
            if (initialData) {
                return initialData
                    ? import("../api/customers").then(mod => mod.updateCustomer(initialData.id, data))
                    : createCustomer(data);
            }
            return createCustomer(data);
        },
        onSuccess: () => {
            toast.success(initialData ? "Customer updated successfully" : "Customer created successfully");
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer', initialData?.id] });
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(initialData ? "Failed to update customer" : "Failed to create customer");
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
                    <Input id="name" placeholder="ABC Store" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" placeholder="9876543210" {...register("phone")} />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_id">Location *</Label>
                    <Select
                        onValueChange={(value) => setValue("location_id", Number(value), { shouldValidate: true })}
                        defaultValue={initialData?.location_id?.toString()}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations?.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.location_id && <p className="text-sm text-red-500">{errors.location_id.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : (initialData ? "Update Customer" : "Create Customer")}
                </Button>
            </div>
        </form>
    );
}
