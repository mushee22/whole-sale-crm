import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { ProductForm } from "../components/ProductForm";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Modal } from "../../../components/ui/modal";
import { Plus, Pencil, Trash2, AlertTriangle, Layers } from "lucide-react";
import { toast } from "sonner";
import { type Product } from "../types";
import { Badge } from "../../../components/ui/badge";
import { PermissionGuard } from "../../../hooks/usePermission";

export function ProductsPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isVariantMode, setIsVariantMode] = useState(false);
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    const { data: products, isLoading } = useQuery({
        queryKey: ["products", "main"],
        queryFn: () => getProducts({ is_main: true })
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsFormOpen(false);
            toast.success("Product created successfully");
        },
        onError: () => toast.error("Failed to create product"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: FormData }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsFormOpen(false);
            setEditingProduct(null);
            toast.success("Product updated successfully");
        },
        onError: () => toast.error("Failed to update product"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setDeleteId(null);
            toast.success("Product deleted successfully");
        },
        onError: () => toast.error("Failed to delete product"),
    });

    const handleCreateMain = () => {
        setEditingProduct(null);
        setIsVariantMode(false);
        setIsFormOpen(true);
    };

    const handleCreateVariant = () => {
        setEditingProduct(null);
        setIsVariantMode(true);
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        // If it has a parent_id, it's effectively a variant (or child), so we show parent field to allow edits
        setIsVariantMode(!!product.parent_id);
        setIsFormOpen(true);
    };

    const handleSubmit = (data: FormData) => {
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <CardTitle className="text-lg font-bold">Products</CardTitle>
                    <div className="flex gap-2">
                        <PermissionGuard module="products" action="add">
                            <Button size="sm" onClick={handleCreateMain} className="bg-slate-900 text-white hover:bg-slate-800">
                                <Plus className="mr-2 h-4 w-4" /> Add Main Product
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard module="products" action="add">
                            <Button size="sm" onClick={handleCreateVariant} variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Add Variant Product
                            </Button>
                        </PermissionGuard>
                    </div>
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
                                        <TableHead>Variants</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products?.map((product) => (
                                        <TableRow key={product.id} className="hover:bg-slate-50">
                                            <TableCell className="font-mono text-xs text-gray-500">#{product.id}</TableCell>
                                            <TableCell>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                                                ) : (
                                                    <div className="h-10 w-10 bg-gray-100 rounded-md" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">{product.name}</span>
                                                    {product.parent_id ? (
                                                        <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0 h-5 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                                                            Variant
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default" className="w-fit text-[10px] px-2 py-0 h-5 bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                                                            Main
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {/* @ts-ignore - color object exists in API response but might not be in base type yet */}
                                                {product.color?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {/* @ts-ignore - size object exists in API response but might not be in base type yet */}
                                                {product.size?.name || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate text-gray-500">
                                                {product.description || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-8 text-indigo-600 hover:text-indigo-800 px-0"
                                                    onClick={() => window.location.href = `/products/${product.id}/variants`}
                                                >
                                                    <Layers className="mr-1 h-3 w-3" />
                                                    View Variants
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <PermissionGuard module="products" action="update">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleEdit(product)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGuard>
                                                    <PermissionGuard module="products" action="delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                            onClick={() => setDeleteId(product.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {products?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                                                No products found.
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
                title={editingProduct ? "Edit Product" : (isVariantMode ? "Add Variant Product" : "Add Main Product")}
            >
                <ProductForm
                    key={editingProduct ? editingProduct.id : `create-${isVariantMode}`}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    initialData={editingProduct}
                    onCancel={() => setIsFormOpen(false)}
                    isVariantMode={isVariantMode}
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
                        Are you sure you want to delete this product?
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
