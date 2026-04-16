import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, Save, Search } from "lucide-react";

import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { getCustomers, getCustomer, updateCustomerPrices, type Customer } from "../../customers/api/customers";
import { getProducts, type Product } from "../../products/api/products";
import { CreateCustomerModal } from "../components/CreateCustomerModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";
import { PermissionGuard } from "../../../hooks/usePermission";

export function CreateQuotePage() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);


    // Item State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [price, setPrice] = useState<string>("");


    // Multiple Items State
    const [quoteItems, setQuoteItems] = useState<Array<{
        productId: string;
        productName: string;
        price: number;
    }>>([]);

    const { data: customersData } = useQuery({
        queryKey: ["customers"],
        queryFn: () => getCustomers({ per_page: 100 })
    });

    const { data: productsData } = useQuery({
        queryKey: ["products", "all"],
        queryFn: () => getProducts({ per_page: 300 })
    });




    const queryClient = useQueryClient();

    const updatePricesMutation = useMutation({
        mutationFn: (data: { customerId: number, prices: { product_id: number, price: number }[] }) =>
            updateCustomerPrices(data.customerId, { prices: data.prices }),
        onSuccess: (_, variables) => {
            toast.success("Customer prices updated successfully");
            queryClient.invalidateQueries({ queryKey: ['customer', variables.customerId.toString()] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });

            // Open confirmation modal instead of immediate navigation
            setIsConfirmationOpen(true);
        },
        onError: () => toast.error("Failed to update prices"),
    });

    const customers: Customer[] = customersData?.data || [];
    const products: Product[] = productsData?.data || [];
    
    // Local product filtering
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.color?.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.size?.name?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);


    // Filter customers based on search term
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    // Fetch Full Customer Details (including product_prices)
    const { data: customerDetails } = useQuery({
        queryKey: ['customer', selectedCustomerId],
        queryFn: () => getCustomer(parseInt(selectedCustomerId)),
        enabled: !!selectedCustomerId && !isNaN(parseInt(selectedCustomerId))
    });

    const selectedCustomer = customers.find((c) => c.id.toString() === selectedCustomerId);

    // Clear items when customer changes to avoid persisting previous customer's data
    useEffect(() => {
        setQuoteItems([]);
    }, [selectedCustomerId]);

    // Auto-update prices of existing items when customer details (special prices) load
    useEffect(() => {
        if (customerDetails && customerDetails.product_prices) {
            // Pre-fill quote items from existing customer prices if needed?
            // User request implies "create quote" which might mean starting fresh or editing existing.
            // Let's load existing prices into the table so they can be edited.
            const existingItems = customerDetails.product_prices.map(pp => {
                // Try to find in both main list and current search results if any
                const product = products.find(p => p.id === pp.product_id);
                return {
                    productId: pp.product_id.toString(),
                    productName: product 
                        ? `${product.name}${product.color?.name ? ` (${product.color.name})` : ""}${product.size?.name ? ` [${product.size.name}]` : ""}`
                        : pp.product ? `${pp.product.name}${pp.product.color?.name ? ` (${pp.product.color.name})` : ""}${pp.product.size?.name ? ` [${pp.product.size.name}]` : ""}` : `Product #${pp.product_id}`,
                    price: parseFloat(pp.price)
                };
            });


            // Only set if we haven't manually added items yet to avoid overwriting work? 
            // Or maybe we should append? 
            // For now, let's just use it to populate if the list is empty, simulating "Edit Quote".
            if (quoteItems.length === 0 && products.length > 0) {
                setQuoteItems(existingItems);
            }
        }
    }, [customerDetails, products]);

    useEffect(() => {
        if (!selectedProduct) return;

        let effectivePrice = Number(selectedProduct.price);

        // Check for special customer price in currently loaded details
        if (customerDetails && customerDetails.product_prices) {
            const specialPrice = customerDetails.product_prices.find(pp => pp.product_id === selectedProduct.id);
            if (specialPrice) {
                effectivePrice = Number(specialPrice.price);
            }
        }

        setPrice(effectivePrice.toString());
    }, [selectedProduct, customerDetails]);


    const handleCustomerCreated = (newCustomer: any) => {
        if (newCustomer?.id) {
            setSelectedCustomerId(newCustomer.id.toString());
            setSearchTerm(newCustomer.name);
        }
    };

    const handleAddItem = () => {
        if (!selectedProduct || !price) {
            toast.error("Please fill in product details");
            return;
        }

        const newItem = {
            productId: selectedProduct.id.toString(),
            productName: `${selectedProduct.name}${selectedProduct.color?.name ? ` (${selectedProduct.color.name})` : ""}${selectedProduct.size?.name ? ` [${selectedProduct.size.name}]` : ""}`,
            price: parseFloat(price)
        };

        // Check if item exists and update it, or add new
        setQuoteItems(prev => {
            const existingIndex = prev.findIndex(item => item.productId === selectedProduct.id.toString());
            if (existingIndex >= 0) {
                const newItems = [...prev];
                newItems[existingIndex] = newItem;
                return newItems;
            }
            return [...prev, newItem];
        });

        // Reset inputs
        setSelectedProduct(null);
        setPrice("");
        setProductSearch("");
    };


    const handleRemoveItem = (index: number) => {
        const newItems = [...quoteItems];
        newItems.splice(index, 1);
        setQuoteItems(newItems);
    };

    // Confirmation Modal State
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const handleSubmit = () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer");
            return;
        }
        if (quoteItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        updatePricesMutation.mutate({
            customerId: parseInt(selectedCustomerId),
            prices: quoteItems.map(item => ({
                product_id: parseInt(item.productId),
                price: item.price
            }))
        });
    };

    const handleCreateOrder = () => {
        navigate("/orders/create", {
            state: {
                customerId: selectedCustomerId,
                quotedItems: quoteItems
            }
        });
    };

    const handleCancelConfirmation = () => {
        setIsConfirmationOpen(false);
        navigate("/customers");
    };

    return (
        <PermissionGuard module="create_quote" action="create" showMessage>
            <div className="space-y-6 lg:p-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold">Create Quote</h1>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Customer Section */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col space-y-2 relative">
                                <Label>Select Customer</Label>
                                <div className="flex gap-2">
                                    <div className="relative w-full">
                                        <Input
                                            placeholder="Search customer..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setOpen(true);
                                            }}
                                            onFocus={() => setOpen(true)}
                                            className="w-full"
                                        />
                                        {open && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredCustomers.length === 0 ? (
                                                    <div className="p-2 text-sm text-gray-500">No customer found.</div>
                                                ) : (
                                                    filteredCustomers.map((customer) => (
                                                        <div
                                                            key={customer.id}
                                                            className={cn(
                                                                "px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 flex items-center justify-between",
                                                                selectedCustomerId === customer.id.toString() && "bg-slate-50 font-medium"
                                                            )}
                                                            onClick={() => {
                                                                setSelectedCustomerId(customer.id.toString());
                                                                setSearchTerm("");
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <span>{customer.name} ({customer.phone})</span>
                                                            {selectedCustomerId === customer.id.toString() && (
                                                                <Check className="h-4 w-4 text-blue-600" />
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={() => setIsCreateModalOpen(true)} variant="secondary">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {open && (
                                    <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
                                )}
                            </div>

                            {selectedCustomer && (
                                <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm border border-slate-100">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Name</span>
                                            <span className="font-medium">{selectedCustomer.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Phone</span>
                                            <span className="font-medium">{selectedCustomer.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Products Section - Only show when customer is selected */}
                    {selectedCustomerId && (
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Quote Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Item Form */}
                                <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-6 space-y-2 relative">
                                            <Label>Product</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                                                <Input
                                                    placeholder="Search products..."
                                                    className="pl-9 bg-white"
                                                    value={selectedProduct ? 
                                                        `${selectedProduct.name}${selectedProduct.color?.name ? ` (${selectedProduct.color.name})` : ""}${selectedProduct.size?.name ? ` [${selectedProduct.size.name}]` : ""}`
                                                        : productSearch}
                                                    onChange={(e) => {
                                                        setProductSearch(e.target.value);
                                                        setIsProductSearchOpen(true);
                                                        setSelectedProduct(null);
                                                    }}
                                                    onFocus={() => setIsProductSearchOpen(true)}

                                                />
                                            </div>

                                            {isProductSearchOpen && productSearch !== "" && (
                                                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {filteredProducts.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            No products found for "{productSearch}"
                                                        </div>
                                                    ) : (
                                                        filteredProducts.map((product) => (
                                                            <div
                                                                key={product.id}
                                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                                                                onClick={() => {
                                                                    setSelectedProduct(product);
                                                                    setProductSearch("");
                                                                    setIsProductSearchOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900">
                                                                        {product.name}
                                                                        {product.color?.name && ` (${product.color.name})`}
                                                                        {product.size?.name && ` [${product.size.name}]`}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">Stock: {product.stock} | Price: ₹{product.price}</span>
                                                                </div>
                                                                {selectedProduct?.id === product.id && <Check className="h-4 w-4 text-blue-600" />}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}



                                            {isProductSearchOpen && (
                                                <div className="fixed inset-0 z-40" onClick={() => setIsProductSearchOpen(false)} />
                                            )}
                                        </div>


                                        <div className="md:col-span-5 space-y-2">
                                            <Label>Custom Price</Label>
                                            <Input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="bg-white"
                                            />
                                        </div>

                                        <div className="md:col-span-1">
                                            <Button onClick={handleAddItem} className="w-full" variant="outline">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[70%]">Product</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {quoteItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                        No items added yet
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                quoteItems.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell>{item.price.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleRemoveItem(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end pt-4 border-t">
                                    <PermissionGuard module="create_quote" action="create">
                                        <Button
                                            size="lg"
                                            className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700"
                                            onClick={handleSubmit}
                                            disabled={updatePricesMutation.isPending || quoteItems.length === 0}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {updatePricesMutation.isPending ? "Saving..." : "Save Quote"}
                                        </Button>
                                    </PermissionGuard>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <CreateCustomerModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCustomerCreated={handleCustomerCreated}
                />

                <Modal isOpen={isConfirmationOpen} onClose={handleCancelConfirmation} title="Quote Saved">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            The quote has been successfully saved. Would you like to create an order based on this quote now?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCancelConfirmation}>
                                Later
                            </Button>
                            <Button onClick={handleCreateOrder} className="bg-blue-600 hover:bg-blue-700">
                                Create Order
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </PermissionGuard>
    );
}
