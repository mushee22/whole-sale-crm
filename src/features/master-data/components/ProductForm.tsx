// ProductForm.tsx
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { getProducts } from "../api/products";
import { getColors } from "../api/colors";
import { getSizes } from "../api/sizes";
import { useQuery } from "@tanstack/react-query";

import { type Product } from "../types";

interface ProductFormProps {
    onSubmit: (data: FormData) => void;
    isLoading: boolean;
    initialData: Product | null;
    onCancel: () => void;
    isVariantMode: boolean; // Added control for variant mode
    implicitParentId?: string; // If provided, parent selection is hidden and this ID is used
}

export function ProductForm({ onSubmit, isLoading, initialData, onCancel, isVariantMode, implicitParentId }: ProductFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState<File | null>(null);
    const [parentId, setParentId] = useState<string>("");
    const [colorId, setColorId] = useState<string>("");
    const [sizeId, setSizeId] = useState<string>("");

    const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
    const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: getColors });
    const { data: sizes } = useQuery({ queryKey: ["sizes"], queryFn: getSizes });

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || "");
            setIsActive(initialData.is_active ?? true);
            // Image handling for initial data might need review if we want to show existing image

            // Ensure we use strings and handle null/undefined correctly
            // If the value exists, use it. If not, use "none" for the Select component to map to the None option, or empty string if that's preferred.
            // But since we have a "None" option with value="none", we should probably default to that or empty string.
            // Let's stick to the value matching.
            setParentId(initialData.parent_id ? initialData.parent_id.toString() : "none");
            setColorId(initialData.color_id ? initialData.color_id.toString() : "none");
            setSizeId(initialData.size_id ? initialData.size_id.toString() : "none");
        } else {
            setName("");
            setDescription("");
            setIsActive(true);
            setImage(null);
            setParentId(implicitParentId || "none");
            setColorId("none");
            setSizeId("none");
        }
    }, [initialData, implicitParentId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("is_active", isActive ? '1' : '0');
        formData.append("price", '0');
        formData.append("stock", '0');

        if (isVariantMode && parentId && parentId !== "none") {
            formData.append("parent_id", parentId);
        }

        if (colorId && colorId !== "none") formData.append("color_id", colorId);
        if (sizeId && sizeId !== "none") formData.append("size_id", sizeId);

        if (image) {
            formData.append("image", image);
        }

        onSubmit(formData);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isVariantMode && (
                    <>
                        {!implicitParentId && (
                            <div className="space-y-2">
                                <Label>Parent Product</Label>
                                <Select value={parentId} onValueChange={setParentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {products?.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <Select value={colorId} onValueChange={setColorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Color" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {colors?.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Size</Label>
                            <Select value={sizeId} onValueChange={setSizeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {sizes?.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                {initialData?.image_url && !image && (
                    <img src={initialData.image_url} alt={initialData.name} className="h-10 w-10 object-cover rounded-md" />
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                />
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="is_active">Active Status</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
                </Button>
            </div>
        </form>
    );
}
