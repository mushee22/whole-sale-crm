import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductVariants, createProduct, updateProduct, deleteProduct } from "../api/products";
import { ProductForm } from "../components/ProductForm";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Modal } from "../../../components/ui/modal";
import { Plus, Pencil, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { type Product } from "../types";

export function ProductVariantsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    const { data: variants, isLoading } = useQuery({
        queryKey: ["products", "variants", id],
        queryFn: () => getProductVariants({ parent_id: id }),
        enabled: !!id
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", "variants", id] });
            setIsFormOpen(false);
            toast.success("Variant created successfully");
        },
        onError: () => toast.error("Failed to create variant"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: FormData }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", "variants", id] });
            setIsFormOpen(false);
            setEditingProduct(null);
            toast.success("Variant updated successfully");
        },
        onError: () => toast.error("Failed to update variant"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", "variants", id] });
            setDeleteId(null);
            toast.success("Variant deleted successfully");
        },
        onError: () => toast.error("Failed to delete variant"),
    });

    const handleCreate = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleSubmit = (data: FormData) => {
        // Ensure parent_id is set for new variants
        if (!editingProduct && id) {
            data.append("parent_id", id);
        }

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
                </Button>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <CardTitle className="text-lg font-bold">Product Variants</CardTitle>
                    <Button size="sm" onClick={handleCreate} className="bg-slate-900 text-white hover:bg-slate-800">
                        <Plus className="mr-2 h-4 w-4" /> Add Variant
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead className="max-w-[300px]">Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {variants?.map((product) => (
                                        <TableRow key={product.id} className="hover:bg-slate-50">
                                            <TableCell className="font-mono text-xs text-gray-500">#{product.id}</TableCell>
                                            <TableCell>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                                                ) : (
                                                    <div className="h-10 w-10 bg-gray-100 rounded-md" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-gray-600">
                                                {/* @ts-ignore */}
                                                {product.color?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {/* @ts-ignore */}
                                                {product.size?.name || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate text-gray-500">
                                                {product.description || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => setDeleteId(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {variants?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                                                No variants found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingProduct ? "Edit Variant" : "Add Variant"}
            >
                <ProductForm
                    key={editingProduct ? editingProduct.id : "create-variant"}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    initialData={editingProduct}
                    onCancel={() => setIsFormOpen(false)}
                    isVariantMode={true}
                    implicitParentId={id}
                />
            </Modal>

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm font-medium">This action cannot be undone.</p>
                    </div>
                    <p className="text-gray-600">
                        Are you sure you want to delete this variant?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
