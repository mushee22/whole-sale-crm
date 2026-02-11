import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { getProducts } from "../../products/api/products";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
    createProductLoyaltySystem,
    updateProductLoyaltySystem,
    createAmountLoyaltySystem,
    updateAmountLoyaltySystem,
    type LoyaltySystem
} from "../api/loyalty";

const productTargetSchema = z.object({
    product_id: z.string().min(1, "Product is required"),
    target_quantity: z.number().min(1, "Quantity must be at least 1"),
    reward_product_id: z.string().min(1, "Reward product is required"),
    reward_quantity: z.number().min(1, "Reward quantity is required"),
});

const amountTierSchema = z.object({
    threshold_amount: z.number().min(1, "Amount must be at least 1"),
    reward_product_id: z.string().min(1, "Reward Product is required"),
    reward_quantity: z.number().min(1, "Quantity must be at least 1"),
});

const productSystemSchema = z.object({
    type: z.literal("product"),
    duration_days: z.number().min(1, "Duration is required"),
    loyalty_products: z.array(productTargetSchema).min(1, "At least one target is required"),
    // Allow other fields to exist but be ignored/optional
    tiers: z.any().optional(),
});

const amountSystemSchema = z.object({
    type: z.literal("amount"),
    duration_days: z.number().min(1, "Duration is required"),
    tiers: z.array(amountTierSchema).min(1, "At least one tier is required"),
    // Allow other fields to exist but be ignored/optional
    // Allow other fields to exist but be ignored/optional
    loyalty_products: z.any().optional(),
});

const schema = z.discriminatedUnion("type", [productSystemSchema, amountSystemSchema]);

type SchemaData = z.infer<typeof schema>;

// Loose type for the form to handle all fields existing
type FormValues = {
    type: "product" | "amount";
    duration_days: number;
    loyalty_products: { product_id: string; target_quantity: number; reward_product_id: string; reward_quantity: number }[];
    tiers: { threshold_amount: number; reward_product_id: string; reward_quantity: number }[];
};

interface LoyaltySystemFormProps {
    customerId: number;
    initialData?: LoyaltySystem;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LoyaltySystemForm({ customerId, initialData, onSuccess, onCancel }: LoyaltySystemFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [systemType, setSystemType] = useState<'product' | 'amount'>(
        initialData?.type || 'product'
    );

    const { data: productsData } = useQuery({
        queryKey: ["products"],
        queryFn: () => getProducts({ per_page: 100 })
    });

    const products = productsData?.data || [];

    const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            type: initialData?.type || "product",
            duration_days: initialData?.duration_days || 30,
            loyalty_products: initialData?.product_targets?.map(t => ({
                product_id: t.product_id.toString(),
                target_quantity: t.target_quantity,
                reward_product_id: t.reward_product_id.toString(),
                reward_quantity: t.reward_quantity
            })) || [{ product_id: "", target_quantity: 1, reward_product_id: "", reward_quantity: 1 }],
            tiers: initialData?.amount_tiers?.map(t => ({
                threshold_amount: t.threshold_amount,
                reward_product_id: t.reward_product_id.toString(),
                reward_quantity: t.reward_quantity
            })) || [{ threshold_amount: 1000, reward_product_id: "", reward_quantity: 1 }],
        }
    });

    const { fields: targetFields, append: appendTarget, remove: removeTarget } = useFieldArray({
        control,
        name: "loyalty_products"
    });

    const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
        control,
        name: "tiers"
    });

    // Watch type to update local state for conditional rendering logic if needed beyond Tabs
    // although Tabs handles visual switching, form state 'type' needs to sync.
    useEffect(() => {
        setValue("type", systemType);
    }, [systemType, setValue]);

    // Debug errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Form Validation Errors:", errors);
            // toast.error("Please fix form errors");
        }
    }, [errors]);

    const onSubmit = async (formData: FormValues) => {
        const data = formData as unknown as SchemaData;
        setIsLoading(true);
        try {
            if (data.type === "product") {
                const payload = {
                    duration_days: data.duration_days,
                    loyalty_products: data.loyalty_products!.map(t => ({
                        product_id: parseInt(t.product_id),
                        target_quantity: t.target_quantity,
                        reward_product_id: parseInt(t.reward_product_id),
                        reward_quantity: t.reward_quantity
                    })),
                };

                if (initialData) {
                    await updateProductLoyaltySystem(initialData.id, payload);
                } else {
                    await createProductLoyaltySystem({
                        customer_id: customerId,
                        ...payload
                    });
                }
            } else {
                const payload = {
                    duration_days: data.duration_days,
                    tiers: data.tiers!.map(t => ({
                        threshold_amount: t.threshold_amount,
                        reward_product_id: parseInt(t.reward_product_id),
                        reward_quantity: t.reward_quantity
                    }))
                };

                if (initialData) {
                    await updateAmountLoyaltySystem(initialData.id, payload);
                } else {
                    await createAmountLoyaltySystem({
                        customer_id: customerId,
                        ...payload
                    });
                }
            }
            toast.success("Loyalty system saved successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save loyalty system");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!initialData && (
                <Tabs value={systemType} onValueChange={(v) => setSystemType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="product">Product Based</TabsTrigger>
                        <TabsTrigger value="amount">Amount Based</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (Days)</Label>
                    <Input
                        id="duration"
                        type="number"
                        {...register("duration_days", { valueAsNumber: true })}
                        placeholder="30"
                    />
                    {errors.duration_days && <p className="text-sm text-red-500">{errors.duration_days.message}</p>}
                </div>

                {systemType === "product" && (
                    <div className="space-y-4 border rounded-md p-4 bg-slate-50">
                        <h4 className="font-medium text-sm">Target Products & Rewards</h4>
                        {targetFields.map((field, index) => (
                            <div key={field.id} className="space-y-3 p-3 bg-white rounded border mb-2">
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <Label className="text-xs">Product</Label>
                                        <Select
                                            onValueChange={(val) => setValue(`loyalty_products.${index}.product_id`, val, { shouldValidate: true })}
                                            defaultValue={field.product_id}
                                        >
                                            <SelectTrigger className={errors.loyalty_products?.[index]?.product_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select Product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            {...register(`loyalty_products.${index}.target_quantity`, { valueAsNumber: true })}
                                            className={errors.loyalty_products?.[index]?.target_quantity ? "border-red-500" : ""}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTarget(index)}
                                        disabled={targetFields.length === 1}
                                        className="text-red-500 mt-5"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                    <div>
                                        <Label className="text-xs">Reward Product</Label>
                                        <Select
                                            onValueChange={(val) => setValue(`loyalty_products.${index}.reward_product_id`, val, { shouldValidate: true })}
                                            defaultValue={field.reward_product_id}
                                        >
                                            <SelectTrigger className={errors.loyalty_products?.[index]?.reward_product_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select Reward" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Reward Qty</Label>
                                        <Input
                                            type="number"
                                            {...register(`loyalty_products.${index}.reward_quantity`, { valueAsNumber: true })}
                                            className={errors.loyalty_products?.[index]?.reward_quantity ? "border-red-500" : ""}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {errors.loyalty_products && <p className="text-sm text-red-500">{errors.loyalty_products.message}</p>}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTarget({ product_id: "", target_quantity: 1, reward_product_id: "", reward_quantity: 1 })}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Target Product
                        </Button>
                    </div>
                )}

                {systemType === "amount" && (
                    <div className="space-y-4 border rounded-md p-4 bg-slate-50">
                        <h4 className="font-medium text-sm">Amount Tiers</h4>
                        {tierFields.map((field, index) => (
                            <div key={field.id} className="space-y-3 p-3 bg-white rounded border mb-2">
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <Label className="text-xs">Threshold Amount</Label>
                                        <Input
                                            type="number"
                                            {...register(`tiers.${index}.threshold_amount`, { valueAsNumber: true })}
                                            placeholder="e.g. 5000"
                                            className={errors.tiers?.[index]?.threshold_amount ? "border-red-500" : ""}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTier(index)}
                                        disabled={tierFields.length === 1}
                                        className="text-red-500 mt-5"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Reward Product</Label>
                                        <Select
                                            onValueChange={(val) => setValue(`tiers.${index}.reward_product_id`, val, { shouldValidate: true })}
                                            defaultValue={field.reward_product_id}
                                        >
                                            <SelectTrigger className={`h-9 ${errors.tiers?.[index]?.reward_product_id ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Reward Qty</Label>
                                        <Input
                                            type="number"
                                            className={`h-9 ${errors.tiers?.[index]?.reward_quantity ? "border-red-500" : ""}`}
                                            {...register(`tiers.${index}.reward_quantity`, { valueAsNumber: true })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {errors.tiers && <p className="text-sm text-red-500">{errors.tiers.message}</p>}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTier({ threshold_amount: 0, reward_product_id: "", reward_quantity: 1 })}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Tier
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-slate-900 text-white hover:bg-slate-800">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save System
                </Button>
            </div>
        </form>
    );
}
