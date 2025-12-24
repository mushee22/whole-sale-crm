import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { createLoyaltySchema, type CreateLoyaltyData, type Loyalty } from "../api/loyalties";
import { getProducts, type Product } from "../../products/api/products";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

interface LoyaltyFormProps {
    onSubmit: (data: CreateLoyaltyData) => void;
    isLoading?: boolean;
    initialData?: Loyalty | null;
}

export function LoyaltyForm({ onSubmit, isLoading, initialData }: LoyaltyFormProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialData?.product as unknown as Product || null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateLoyaltyData>({
        resolver: zodResolver(createLoyaltySchema) as any,
        defaultValues: {
            is_active: true,
            is_show_to_brochure: false
        }
    });

    // Fetch products for autocomplete
    const { data: productsData } = useQuery({
        queryKey: ['products', 'autocomplete', search],
        queryFn: () => getProducts({ search, per_page: 5 }),
        enabled: open, // Only fetch when dropdown is open
    });

    useEffect(() => {
        if (initialData) {
            reset({
                product_id: initialData.product_id,
                points: initialData.points,
                is_active: initialData.is_active,
                is_show_to_brochure: initialData.is_show_to_brochure,
            });
            if (initialData.product) {
                setSearch(initialData.product.name);
                setSelectedProduct(initialData.product as unknown as Product);
            }
        } else {
            reset({
                product_id: 0,
                points: 0,
                is_active: true,
                is_show_to_brochure: false,
            });
            setSearch("");
            setSelectedProduct(null);
        }
    }, [initialData, reset]);

    // Handle clicking outside to close dropdown
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
        setValue("product_id", product.id);
        setSelectedProduct(product);
        setSearch(product.name);
        setOpen(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2" ref={wrapperRef}>
                <Label>Product</Label>
                <div className="relative">
                    <Input
                        placeholder="Search product..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                    />
                    {open && productsData?.data && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {productsData.data.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">No products found.</div>
                            ) : (
                                <ul className="py-1">
                                    {productsData.data.map((product) => (
                                        <li
                                            key={product.id}
                                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            <span>{product.name} <span className="text-gray-400">({product.sku})</span></span>
                                            {selectedProduct?.id === product.id && <Check className="h-4 w-4 text-slate-900" />}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                {/* Hidden input to actually register the ID */}
                <input type="hidden" {...register("product_id")} />
                {errors.product_id && <p className="text-sm text-red-500">{errors.product_id.message}</p>}

                {selectedProduct && (
                    <div className="text-xs text-gray-500">
                        Selected: {selectedProduct.name} (SKU: {selectedProduct.sku})
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="points">Loyalty Points</Label>
                <Input
                    id="points"
                    type="number"
                    placeholder="100"
                    {...register("points")}
                />
                {errors.points && <p className="text-sm text-red-500">{errors.points.message}</p>}
            </div>

            {/* Checkboxes for active and show to brochure */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                        {...register("is_active")}
                    />
                    <Label htmlFor="is_active" className="font-normal text-sm text-gray-700">Active Rule</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_show_to_brochure"
                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                        {...register("is_show_to_brochure")}
                    />
                    <Label htmlFor="is_show_to_brochure" className="font-normal text-sm text-gray-700">Show to Brochure</Label>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]">
                    {isLoading ? "Saving..." : (initialData ? "Update Rule" : "Create Rule")}
                </Button>
            </div>
        </form>
    );
}
