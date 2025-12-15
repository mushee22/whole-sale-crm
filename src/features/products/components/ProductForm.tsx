import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { createProductSchema, type CreateProductData, type Product } from "../api/products";
import { useEffect, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

interface ProductFormProps {
    onSubmit: (data: CreateProductData) => void;
    isLoading?: boolean;
    initialData?: Product | null;
}

export function ProductForm({ onSubmit, isLoading, initialData }: ProductFormProps) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateProductData>({
        resolver: zodResolver(createProductSchema) as any,
        defaultValues: {
            is_active: true,
            discount_price: 0,
            image: null
        }
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Reset form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                price: initialData.price,
                discount_price: initialData.discount_price || 0,
                stock: initialData.stock,
                is_active: initialData.is_active,
                image: null // Start with null for file input
            });
            setImagePreview(initialData.image_url || null);
        } else {
            reset({
                name: "",
                price: 0,
                discount_price: 0,
                stock: 0,
                is_active: true,
                image: null
            });
            setImagePreview(null);
        }
    }, [initialData, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Set file object to form
            setValue("image", file);
            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="w-full"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {imagePreview ? "Change Image" : "Upload Image"}
                            </Button>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Upload a product image (JPG, PNG).</p>
                        {errors.image && <p className="text-sm text-red-500">{errors.image.message as string}</p>}
                    </div>

                    <div className={`h-20 w-20 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 relative group`}>
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-full w-full object-cover"
                                onError={() => setImagePreview(null)}
                            />
                        ) : (
                            <ImageIcon className="h-8 w-8 text-gray-300" />
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="Enter product name" {...register("name")} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" step="0.01" placeholder="Enter price" {...register("price")} />
                    {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount_price">Discount Price (₹)</Label>
                    <Input id="discount_price" type="number" step="0.01" placeholder="Enter discount price" {...register("discount_price")} />
                    {errors.discount_price && <p className="text-sm text-red-500">{errors.discount_price.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" placeholder="Enter stock quantity" {...register("stock")} />
                {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="is_active"
                    className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                    {...register("is_active")}
                />
                <Label htmlFor="is_active" className="font-normal text-sm text-gray-700">Active Product</Label>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]">
                    {isLoading ? "Saving..." : (initialData ? "Update Product" : "Create Product")}
                </Button>
            </div>
        </form>
    );
}
