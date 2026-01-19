import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { getCustomers, getCustomer, type Customer } from "../../customers/api/customers";
import { getProducts, type Product } from "../../products/api/products";
import { createPreOrder } from "../api/sales";
import { CreateCustomerModal } from "../components/CreateCustomerModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../components/ui/modal";

export function SalesOrderPage() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [createdPreOrderId, setCreatedPreOrderId] = useState<number | null>(null);

    // Order Item State
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    // const [quantity, setQuantity] = useState<string>("1"); // Removed from UI, implicitly 1

    // Multiple Items State
    const [orderItems, setOrderItems] = useState<Array<{
        productId: string;
        productName: string;
        price: number;
        quantity: number;
        total: number;
    }>>([]);

    const { data: customersData } = useQuery({
        queryKey: ["customers"],
        queryFn: () => getCustomers({ per_page: 100 })
    });

    const { data: productsData } = useQuery({
        queryKey: ["products"],
        queryFn: () => getProducts({ per_page: 100 })
    });

    const createPreOrderMutation = useMutation({
        mutationFn: createPreOrder,
        onSuccess: (data) => {
            toast.success("Pre-order created successfully");
            if (data && data.id) {
                setCreatedPreOrderId(data.id);
            }
            setIsConfirmationOpen(true);
        },
        onError: () => toast.error("Failed to create pre-order"),
    });

    const customers: Customer[] = customersData?.data || [];
    const products: Product[] = productsData?.data || [];

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

    // Auto-update prices of existing items when customer details (special prices) load
    useEffect(() => {
        if (customerDetails && customerDetails.product_prices && orderItems.length > 0) {
            setOrderItems(prevItems => prevItems.map(item => {
                const specialPrice = customerDetails.product_prices?.find(pp => pp.product_id === parseInt(item.productId));
                if (specialPrice) {
                    const newPrice = Number(specialPrice.price);
                    return {
                        ...item,
                        price: newPrice,
                        total: newPrice * item.quantity
                    };
                }
                return item;
            }));
        }
    }, [customerDetails]);

    // Auto-fill price input when Product is selected OR Customer changes
    useEffect(() => {
        if (!selectedProductId) return;

        const product = products?.find(p => p.id.toString() === selectedProductId);
        if (!product) return;

        let effectivePrice = Number(product.price);

        // 1. Check for special customer price
        if (customerDetails && customerDetails.product_prices) {
            const specialPrice = customerDetails.product_prices.find(pp => pp.product_id === parseInt(selectedProductId));
            if (specialPrice) {
                effectivePrice = Number(specialPrice.price);
            } else if (product.discount_price) {
                // 2. Fallback to discount price
                effectivePrice = Number(product.discount_price);
            }
        } else {
            // Customer not loaded or no special price, usage discount if exists
            if (product.discount_price) {
                effectivePrice = Number(product.discount_price);
            }
        }

        setPrice(effectivePrice.toString());

    }, [selectedProductId, customerDetails, products]);

    const handleCustomerCreated = (newCustomer: any) => {
        if (newCustomer?.id) {
            setSelectedCustomerId(newCustomer.id.toString());
            setSearchTerm(newCustomer.name);
        }
    };

    const handleAddItem = () => {
        if (!selectedProductId || !price) {
            toast.error("Please fill in product details");
            return;
        }

        const product = products?.find(p => p.id.toString() === selectedProductId);
        if (!product) return;

        const quantity = 1; // Hardcoded as per requirement

        const newItem = {
            productId: selectedProductId,
            productName: product.name,
            price: parseFloat(price),
            quantity: quantity,
            total: parseFloat(price) * quantity
        };

        setOrderItems([...orderItems, newItem]);
        // Reset inputs
        setSelectedProductId("");
        setPrice("");
        // setQuantity("1");
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    };

    const handleSubmit = () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer");
            return;
        }
        if (orderItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        createPreOrderMutation.mutate({
            customer_id: parseInt(selectedCustomerId),
            items: orderItems.map(item => ({
                product_id: parseInt(item.productId),
                quantity: item.quantity,
                price: item.price
            }))
        });
    };

    const handleConfirmationClose = () => {
        setIsConfirmationOpen(false);
        navigate("/orders"); // Or stay on page, user request said "can close"
    };

    const handleCreateOrder = () => {
        if (createdPreOrderId) {
            navigate(`/sales/pre-orders/${createdPreOrderId}/create`);
        } else {
            handleConfirmationClose();
        }
    };

    const grandTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-6 lg:p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">New Sales Order</h1>
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
                                                            setSearchTerm(customer.name);
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
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Item Form */}
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-6 space-y-2">
                                        <Label>Product</Label>
                                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Select Product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products?.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.name} {p.color?.name ? `(${p.color.name})` : ''} {p.size?.name ? `[${p.size.name}]` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-5 space-y-2">
                                        <Label>Price</Label>
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
                                            <TableHead className="w-[60%]">Product</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orderItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    No items added yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orderItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell>{item.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
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

                            {/* Totals & Submit */}
                            <div className="flex flex-col items-end gap-4 pt-4 border-t">
                                <div className="flex items-center gap-8 text-lg font-semibold">
                                    <span>Grand Total:</span>
                                    <span>{grandTotal.toFixed(2)}</span>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full md:w-auto min-w-[200px] bg-green-600 hover:bg-green-700"
                                    onClick={handleSubmit}
                                    disabled={createPreOrderMutation.isPending || orderItems.length === 0}
                                >
                                    {createPreOrderMutation.isPending ? "Saving..." : "Save Order"}
                                </Button>
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

            <Modal isOpen={isConfirmationOpen} onClose={handleConfirmationClose} title="Pre-Order Created">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        The pre-order has been successfully saved. Would you like to create the order now?
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleConfirmationClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateOrder} className="bg-green-600 hover:bg-green-700">
                            Create Order
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
