import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { createProduct, getProducts, updateProduct, deleteProduct, type CreateProductData, type Product } from "./api/products";
import { ProductForm } from "./components/ProductForm";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { PermissionGuard } from "../../hooks/usePermission";

export default function ProductList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null); // For delete confirmation

    const queryClient = useQueryClient();

    const { data: productData, isLoading } = useQuery({
        queryKey: ['products', page, search],
        queryFn: () => getProducts({ page, search, per_page: 15 }),
        placeholderData: (previousData) => previousData,
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Product created successfully!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to create product");
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateProduct,
        onSuccess: () => {
            setIsFormOpen(false);
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Product updated successfully!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to update product");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Product deleted successfully!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to delete product");
        }
    });

    const handleSubmit = (formData: CreateProductData) => {
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-lg md:text-3xl font-bold">Products</CardTitle>
                        <p className="text-sm text-gray-500">Manage your product inventory.</p>
                    </div>
                </CardHeader>

                <CardContent className="p-0 border-t border-gray-100">
                    <PermissionGuard module="products" action="view" showMessage>
                        {/* Toolbar */}
                        <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                            <div className="relative w-full sm:w-72">
                                <Input
                                    placeholder="Search products..."
                                    className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-all"
                                    value={search}
                                    onChange={handleSearch}
                                />
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            <PermissionGuard module="products" action="add">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all" onClick={openCreate}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Product
                                </Button>
                            </PermissionGuard>
                        </div>

                        {isLoading && !productData ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                                <p className="text-gray-500">Loading inventory...</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-gray-100">
                                    {productData?.data.map((product) => (
                                        <div key={product.id} className="p-4 space-y-3 bg-white">
                                            <div className="flex gap-4">
                                                <div className="h-20 w-20 flex-shrink-0 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5Mjk2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                                                            <p className="text-xs text-gray-500">#{product.id}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${product.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                            }`}>
                                                            {product.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex justify-between items-end">
                                                        <div>
                                                            {product.discount_price && Number(product.discount_price) < Number(product.price) ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-gray-400 line-through">₹{Number(product.price).toFixed(2)}</span>
                                                                    <span className="text-sm font-bold text-green-600">₹{Number(product.discount_price).toFixed(2)}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm font-bold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-xs font-medium ${product.stock < 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                                                            {product.stock} units
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                                <PermissionGuard module="products" action="update">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => openEdit(product)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit
                                                    </Button>
                                                </PermissionGuard>
                                                <PermissionGuard module="products" action="delete">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => setDeleteId(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </Button>
                                                </PermissionGuard>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500 pl-6 w-[80px]">Image</TableHead>
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Product</TableHead>
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">SKU</TableHead>
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Price</TableHead>
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Stock</TableHead>
                                                <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Status</TableHead>
                                                <TableHead className="text-right uppercase tracking-wider text-xs font-semibold text-gray-500 pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productData?.data.map((product) => (
                                                <TableRow key={product.id} className="group hover:bg-slate-50 transition-colors border-gray-100">
                                                    <TableCell className="pl-6">
                                                        <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                            {product.image_url ? (
                                                                <img
                                                                    src={product.image_url}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5Mjk2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                        <polyline points="21 15 16 10 5 21"></polyline>
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-900">
                                                        <div className="flex flex-col">
                                                            <span>{product.name}</span>
                                                            <span className="text-xs text-gray-400 font-mono">ID: #{product.id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">{product.sku}</TableCell>
                                                    <TableCell>
                                                        {product.discount_price && Number(product.discount_price) < Number(product.price) ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs text-gray-400 line-through">₹{Number(product.price).toFixed(2)}</span>
                                                                <span className="text-sm font-semibold text-green-600">₹{Number(product.discount_price).toFixed(2)}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-medium">₹{Number(product.price).toFixed(2)}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`text-sm font-medium ${product.stock < 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                                                            {product.stock} units
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                            }`}>
                                                            {product.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end gap-1">
                                                            <PermissionGuard module="products" action="update">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => openEdit(product)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </PermissionGuard>
                                                            <PermissionGuard module="products" action="delete">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => setDeleteId(product.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </PermissionGuard>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {productData?.data.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                                                        No products found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                    <Pagination
                                        currentPage={productData?.current_page || 1}
                                        totalPages={productData?.last_page || 1}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </>
                        )}
                    </PermissionGuard>
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingProduct ? "Edit Product" : "Add New Product"}
            >
                <ProductForm
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    initialData={editingProduct}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
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
                            {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
