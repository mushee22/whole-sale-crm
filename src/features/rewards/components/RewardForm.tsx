import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rewardSchema, type RewardFormData, type Reward } from "../api/rewards";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, type Product } from "../../products/api/products";

interface RewardFormProps {
    onSubmit: (data: RewardFormData) => void;
    initialData?: Reward | null;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function RewardForm({ onSubmit, initialData, isLoading, onCancel }: RewardFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm<RewardFormData>({
        resolver: zodResolver(rewardSchema),
        defaultValues: {
            reward_name: "",
            product_id: 0,
            required_points: 0,
            description: "",
            is_active: true,
            is_show_to_brochure: false
        },
    });

    const isActive = watch("is_active");
    const isShowToBrochure = watch("is_show_to_brochure");

    // Product Search State
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initialize form with initialData
    useEffect(() => {
        if (initialData) {
            reset({
                reward_name: initialData.reward_name || "",
                product_id: initialData.product_id || 0,
                required_points: initialData.required_points,
                description: initialData.description || "",
                is_active: initialData.is_active,
                is_show_to_brochure: initialData.is_show_to_brochure || false,
            });
            if (initialData.product) {
                // @ts-ignore - Create minimal product object for display if full product not available
                setSelectedProduct({ id: initialData.product.id, name: initialData.product.name, sku: "", stock: 0, price: 0 } as Product);
            }
        }
    }, [initialData, reset]);

    // Fetch products for autocomplete
    const { data: productsData } = useQuery({
        queryKey: ['products', 'autocomplete', search],
        queryFn: () => getProducts({ search, per_page: 5 }),
        enabled: open,
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setValue("product_id", product.id);
        setValue("reward_name", product.name); // Auto-fill reward name
        setOpen(false);
        setSearch('');
    };

    const filteredProducts = productsData?.data || [];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2" ref={wrapperRef}>
                <Label htmlFor="product_search">Select Product *</Label>
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="product_search"
                            type="text"
                            placeholder="Search & Select Product..."
                            className="pl-9 bg-white"
                            value={selectedProduct ? selectedProduct.name : search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setOpen(true);
                                setSelectedProduct(null);
                                setValue("product_id", 0);
                            }}
                            onFocus={() => setOpen(true)}
                        />
                    </div>
                    {open && filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            <ul className="py-1">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product.id}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSelectProduct(product)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{product.name}</span>
                                                <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <input type="hidden" {...register("product_id", { valueAsNumber: true })} />
                {errors.product_id && <p className="text-sm text-red-500">{errors.product_id.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="reward_name">Reward Name *</Label>
                <Input
                    id="reward_name"
                    {...register("reward_name")}
                    placeholder="e.g., Free Coffee"
                />
                {errors.reward_name && (
                    <p className="text-sm text-red-500">{errors.reward_name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="required_points">Required Points *</Label>
                <Input
                    id="required_points"
                    type="number"
                    min="0"
                    {...register("required_points", { valueAsNumber: true })}
                    placeholder="e.g., 500"
                />
                {errors.required_points && (
                    <p className="text-sm text-red-500">{errors.required_points.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe the reward..."
                    rows={3}
                />
                {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={(checked: boolean) => setValue("is_active", checked)}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer font-normal text-sm">
                        Active
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_show_to_brochure"
                        checked={isShowToBrochure}
                        onCheckedChange={(checked: boolean) => setValue("is_show_to_brochure", checked)}
                    />
                    <Label htmlFor="is_show_to_brochure" className="cursor-pointer font-normal text-sm">
                        Show to Brochure
                    </Label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white">
                    {isLoading ? "Saving..." : initialData ? "Update Reward" : "Create Reward"}
                </Button>
            </div>
        </form>
    );
}
