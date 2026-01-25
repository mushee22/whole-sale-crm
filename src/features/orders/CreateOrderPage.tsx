import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { createOrder, getOrder, createOrderSchema, type CreateOrderData, updateOrder, deleteOrder } from "./api/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, Trash2, Search, ArrowLeft, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getProducts, getProduct, type Product } from "../products/api/products";
import { getCustomers, getCustomer, type Customer } from "../customers/api/customers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

// --- OrderItemRow Component ---
interface OrderItemRowProps {
    index: number;
    register: any;
    control: any;
    remove: (index: number) => void;
    setValue: any;
    watch: any;
    errors: any;
    customer?: Customer; // Added customer prop
}

function OrderItemRow({ index, register, remove, setValue, watch, errors, customer }: OrderItemRowProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    const productId = watch(`items.${index}.product_id`);
    const storedProduct = watch(`items.${index}.stored_product`);

    // Fetch product details if we have an ID but no selected product (e.g. from quote or edit)
    // We skip fetching if we already have storedProduct from the order data
    const { data: productDetails } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => getProduct(productId),
        enabled: !!productId && !selectedProduct && !storedProduct
    });

    useEffect(() => {
        if (storedProduct && !selectedProduct) {
            setSelectedProduct(storedProduct);
            setSearch(storedProduct.name);
        } else if (productDetails) {
            setSelectedProduct(productDetails);
            setSearch(productDetails.name);
        }
    }, [productDetails, storedProduct]);

    const unitPrice = watch(`items.${index}.unit_price`);
    const quantity = watch(`items.${index}.quantity`);

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setValue(`items.${index}.product_id`, product.id);

        // --- Special Price Logic ---
        let effectivePrice = Number(product.price);

        // 1. Check for special customer price
        if (customer && customer.product_prices) {
            const specialPrice = customer.product_prices.find(pp => String(pp.product_id) === String(product.id));
            if (specialPrice) {
                effectivePrice = Number(specialPrice.price);
            } else {
                // 2. Fallback to discount price if no special price
                if (product.discount_price) {
                    effectivePrice = Number(product.discount_price);
                }
            }
        } else {
            // No customer selected, normal fallback
            if (product.discount_price) {
                effectivePrice = Number(product.discount_price);
            }
        }

        setValue(`items.${index}.unit_price`, effectivePrice);
        setOpen(false);
        setSearch('');
    };

    const lineTotal = (unitPrice || 0) * (quantity || 0);
    const filteredProducts = productsData?.data || [];

    return (
        <div className="p-3 md:p-4 border border-gray-100 rounded-lg bg-gray-50/50 relative group space-y-3 md:space-y-4">
            <input type="hidden" {...register(`items.${index}.id`)} />

            {/* Mobile Delete Button (Absolute) */}
            <div className="absolute top-2 right-2 md:hidden">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600 h-8 w-8"
                    onClick={() => remove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-3 md:gap-4 items-start md:items-end">
                <div className="col-span-12 md:col-span-4 space-y-2" ref={wrapperRef}>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</Label>
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search products..."
                                className="pl-9 bg-white"
                                value={selectedProduct ? selectedProduct.name : search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setOpen(true);
                                    setSelectedProduct(null);
                                    setValue(`items.${index}.product_id`, 0);
                                    setValue(`items.${index}.unit_price`, 0);
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
                                                    <span className="text-xs text-gray-400">SKU: {product.sku} • Stock: {product.stock}</span>
                                                </div>
                                                {product.price ? (
                                                    <div className="flex flex-col items-end">
                                                        {product.discount_price && product.discount_price < product.price ? (
                                                            <>
                                                                <span className="text-xs text-gray-400 line-through">₹{product?.price ?? 0}</span>
                                                                <span className="text-sm font-semibold text-green-600">₹{product?.discount_price ?? 0}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm font-medium">₹{product?.price ?? 0}</span>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <input type="hidden" {...register(`items.${index}.product_id`, { valueAsNumber: true })} />
                    {errors.items?.[index]?.product_id && <p className="text-xs text-red-500 mt-1">{errors.items[index].product_id.message as string}</p>}
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</Label>
                    <Input
                        type="number"
                        className="bg-white"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    />
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</Label>
                    <Input
                        type="number"
                        className="bg-white"
                        min="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                </div>

                <div className="col-span-12 md:col-span-3 space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</Label>
                    <div className="h-10 flex items-center px-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-md truncate">
                        ₹{lineTotal.toFixed(2)}
                    </div>
                </div>

                <div className="hidden md:flex col-span-1 justify-end md:justify-center md:pb-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="w-full">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</Label>
                    <Input
                        type="text"
                        placeholder="Add a comment (e.g. Special instructions)"
                        className="bg-white"
                        {...register(`items.${index}.comment`)}
                    />
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function CreateOrderPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation(); // Add useLocation hooks
    const isEditMode = !!id;
    const orderId = Number(id);
    const queryClient = useQueryClient();

    // State from Navigation (Quote Page)
    const { customerId: stateCustomerId, quotedItems: stateQuotedItems } = location.state || {};

    // Edit Mode State
    const [status, setStatus] = useState<string>("");
    const [itemsToDelete, setItemsToDelete] = useState<number[]>([]);

    // Customer Selection State
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(stateCustomerId ? parseInt(stateCustomerId) : null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

    // Quoted Items State
    const [quotedItems, setQuotedItems] = useState<any[]>(stateQuotedItems || []);

    // Fetch Customers for Autocomplete
    const { data: customersData } = useQuery({
        queryKey: ['customers', 'autocomplete', customerQuery],
        queryFn: () => getCustomers({ name: customerQuery, per_page: 5 }),
        enabled: isCustomerSearchOpen
    });

    // Fetch Full Customer Details (including product_prices)
    const { data: customerDetails } = useQuery({
        queryKey: ['customer', selectedCustomerId],
        queryFn: () => getCustomer(selectedCustomerId!),
        enabled: !!selectedCustomerId
    });

    // Helper to get today's date
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // React Hook Form for Creation
    const { register, control, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<CreateOrderData | any>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            items: [{ product_id: 0, quantity: 1, unit_price: 0 }],
            order_date: getTodayDate()
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const handleRemoveItem = (index: number) => {
        const item = watch(`items.${index}`);
        if (item && item.id) {
            setItemsToDelete(prev => [...prev, item.id]);
        }
        remove(index);
    };

    // Auto-fill form and refresh prices when customerDetails loads
    useEffect(() => {
        if (customerDetails) {
            setValue("customer_name", customerDetails.name);
            setValue("phone", customerDetails.phone);
            setValue("email", customerDetails.email || "");
            setValue("whatsapp_no", customerDetails.whatsapp_no || "");
            setValue("customer_id", customerDetails.id);

            // Update prices for existing items based on new customer's special prices
            const currentItems = watch("items");
            if (currentItems && Array.isArray(currentItems)) {
                currentItems.forEach((item, index) => {
                    // Only update price if it's a new item or explicitly requested (logic can be refined)
                    // For now, only if it doesn't have a price or if we want to enforce customer price
                    if (item.product_id && item.unit_price === 0) {
                        const specialPrice = customerDetails.product_prices?.find(pp => String(pp.product_id) === String(item.product_id));
                        if (specialPrice) {
                            setValue(`items.${index}.unit_price`, Number(specialPrice.price));
                        }
                    }
                });
            }

            // Sync search input
            setCustomerQuery(customerDetails.name);

            // Populate Quoted Items from Customer Special Prices if not coming from CreateQuotePage (which passes quotedItems in state)
            if (customerDetails.product_prices && customerDetails.product_prices.length > 0 && (!stateQuotedItems || stateQuotedItems.length === 0)) {
                const specialPriceItems = customerDetails.product_prices.map(pp => ({
                    productId: pp.product_id,
                    productName: pp.product?.name || `Product #${pp.product_id}`,
                    price: Number(pp.price)
                }));
                setQuotedItems(specialPriceItems);
            }
        }
    }, [customerDetails, setValue, watch, stateQuotedItems]);

    // Fetch order details if editing
    const { data: orderData, isLoading: isLoadingOrder } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId),
        enabled: isEditMode
    });

    useEffect(() => {
        if (orderData && isEditMode) {
            setStatus(orderData.status);
            setValue("order_date", orderData.order_date.split('T')[0]); // Ensure date format
            if (orderData.estimated_delivery_date) {
                setValue("estimated_delivery_date", orderData.estimated_delivery_date.split('T')[0]);
            }
            setSelectedCustomerId(orderData.customer.id);

            // Map Items
            const mappedItems = orderData.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: Number(item.price),
                comment: item.comment || "",
                stored_product: item.product,
                // attachment: item.attachment_url // Cannot set file input value
            }));
            setValue("items", mappedItems);
        }
    }, [orderData, isEditMode, setValue]);

    const mutation = useMutation({
        mutationFn: (data: any) => isEditMode ? updateOrder(orderId, data) : createOrder(data),
        onSuccess: (data: any) => {
            toast.success(isEditMode ? 'Order updated successfully' : 'Order created successfully');
            if (isEditMode) {
                queryClient.invalidateQueries({ queryKey: ['order', orderId] });
                queryClient.invalidateQueries({ queryKey: ['orders'] }); // Also invalidate list
                navigate(`/orders/${orderId}`);
            } else {
                if (data?.customer_id) {
                    navigate(`/customers/${data.customer_id}`);
                } else {
                    navigate("/orders");
                }
            }
        },
        onError: (error: any) => {
            toast.error(isEditMode ? 'Failed to update order' : 'Failed to create order');
            console.error(error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOrder,
        onSuccess: () => {
            toast.success("Order deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            navigate("/orders");
        },
        onError: () => toast.error("Failed to delete order")
    });

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            deleteMutation.mutate(orderId);
        }
    };

    const onCreateSubmit = (data: CreateOrderData | any) => {
        console.log("Form Submission Data:", data);
        const currentValues = getValues(); // Get raw values to ensure FileList integrity

        const formData = new FormData();

        if (data.customer_id) formData.append("customer_id", String(data.customer_id));
        formData.append("order_date", data.order_date);
        if (data.estimated_delivery_date) formData.append("estimated_delivery_date", data.estimated_delivery_date);
        if (status && isEditMode) formData.append("status", status);

        // Appending items as individual fields with array notation
        data.items.forEach((item: any, index: number) => {
            if (item.id) {
                formData.append(`items[${index}][id]`, String(item.id));
            }
            formData.append(`items[${index}][product_id]`, String(item.product_id));
            formData.append(`items[${index}][quantity]`, String(item.quantity));
            formData.append(`items[${index}][price]`, String(item.unit_price));
            formData.append(`items[${index}][comment]`, item.comment || "");

            // Attachment Handling - Use getValues() to ensure we get the FileList
            // item.attachment in 'data' might be serialized to {} by handleSubmit
            const rawItem = currentValues.items?.[index];
            const attachment = rawItem?.attachment;

            console.log(`Processing Item ${index} Attachment (Raw):`, attachment);

            if (attachment) {
                if (attachment instanceof FileList && attachment.length > 0) {
                    formData.append(`items[${index}][attachment]`, attachment[0]);
                } else if (attachment instanceof File) {
                    formData.append(`items[${index}][attachment]`, attachment);
                } else if (Array.isArray(attachment) && attachment.length > 0 && attachment[0] instanceof File) {
                    formData.append(`items[${index}][attachment]`, attachment[0]);
                } else if (typeof attachment === 'object' && attachment.length && attachment[0]) {
                    formData.append(`items[${index}][attachment]`, attachment[0]);
                }
            }
        });

        // Items to delete
        if (itemsToDelete.length > 0 && isEditMode) {
            itemsToDelete.forEach(id => formData.append("items_to_delete[]", String(id)));
        }

        mutation.mutate(formData);
    };


    if (isEditMode && isLoadingOrder) return <div className="p-8 text-center text-gray-500">Loading order...</div>;

    const ORDER_STATUSES = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "dispatched", label: "Dispatched" },
        { value: "out_for_delivery", label: "Out For Delivery" },
        // { value: "delivered", label: "Delivered" }, // Usually moved via delivery workflow
        { value: "cancelled", label: "Cancelled" },
    ];

    // Create Mode UI (now used for Edit as well)
    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" className="pl-0 hover:bg-transparent -ml-2 mb-2 text-slate-500" onClick={() => navigate("/orders")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{isEditMode ? "Edit Order" : "Create New Order"}</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">{isEditMode ? "Update order details." : "Select a customer and add products."}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-8">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900">Customer Details</CardTitle>
                        <CardDescription>Search for an existing customer or enter details manually.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer Search */}
                        <div className="flex flex-col space-y-2 relative">
                            <Label>Select Customer</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    className="pl-9"
                                    value={customerQuery}
                                    onChange={(e) => {
                                        setCustomerQuery(e.target.value);
                                        setIsCustomerSearchOpen(true);
                                        if (!e.target.value) {
                                            setSelectedCustomerId(null);
                                        }
                                    }}
                                    onFocus={() => setIsCustomerSearchOpen(true)}
                                />
                            </div>

                            {isCustomerSearchOpen && customersData?.data && customersData.data.length > 0 && (
                                <div className="absolute top-[72px] z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {customersData.data.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                                            onClick={() => {
                                                setSelectedCustomerId(customer.id);
                                                setCustomerQuery(customer.name);
                                                setIsCustomerSearchOpen(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{customer.name}</span>
                                                <span className="text-xs text-slate-500">{customer.phone}</span>
                                            </div>
                                            {selectedCustomerId === customer.id && <Check className="h-4 w-4 text-blue-600" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isCustomerSearchOpen && customersData?.data?.length === 0 && customerQuery && (
                                <div className="absolute top-[72px] z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
                                    No customer found.
                                </div>
                            )}

                            {/* Backdrop to close search */}
                            {isCustomerSearchOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsCustomerSearchOpen(false)}
                                />
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="estimated_delivery_date">Est. Delivery Date (Optional)</Label>
                                <Input
                                    id="estimated_delivery_date"
                                    type="date"
                                    min={getTodayDate()}
                                    {...register("estimated_delivery_date")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order_date">Order Date</Label>
                                <Input
                                    id="order_date"
                                    type="date"
                                    max={getTodayDate()}
                                    {...register("order_date")}
                                />
                                {errors.order_date && <p className="text-sm text-red-500">{errors.order_date.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Customer Name</Label>
                                <Input id="customer_name" placeholder="Enter customer name" {...register("customer_name")} />
                                {errors.customer_name && <p className="text-sm text-red-500">{errors.customer_name.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" placeholder="Enter phone number" {...register("phone")} />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <div className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-500 flex items-center">
                                    {customerDetails?.location?.name || "Not set"}
                                </div>
                                {isEditMode && (
                                    <div className="space-y-2">
                                        <Label>Order Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ORDER_STATUSES.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quoted Items Section - Only show if we came from a quote */}
                {
                    quotedItems.length > 0 && (
                        <Card className="shadow-sm border-gray-100 bg-blue-50/50 mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">!</span>
                                    Customer Product Prices
                                </CardTitle>
                                <CardDescription>Product prices from the recently created quote. Click "Add" to include them in this order.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md divide-y divide-gray-100 bg-white">
                                    {quotedItems
                                        .filter(qItem => !watch("items")?.some((oItem: any) => String(oItem.product_id) === String(qItem.productId)))
                                        .map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center p-3 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{item.productName}</span>
                                                    <span className="text-xs text-slate-500">Quoted Price: ₹{item.price?.toFixed(2)}</span>
                                                </div>
                                                {/* <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                    onClick={() => append({
                                                        product_id: parseInt(item.productId),
                                                        quantity: 1,
                                                        unit_price: item.price
                                                    })}
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                                </Button> */}
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )
                }

                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900">Order Items</CardTitle>
                            <CardDescription>Add products to the order.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: 0, quantity: 1, unit_price: 0 })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <OrderItemRow
                                key={field.id}
                                index={index}
                                register={register}
                                control={control}
                                remove={handleRemoveItem}
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                customer={customerDetails} // Pass the fetched customer details
                            />
                        ))}
                        {errors.items && <p className="text-sm text-red-500 text-center">{errors.items.message as string}</p>}

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <div className="text-right">
                                <span className="text-sm text-gray-500">Order Total</span>
                                <OrderTotal items={watch("items")} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="w-full md:w-auto">
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="w-full md:w-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Order
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto">
                        <Button type="button" variant="ghost" onClick={() => navigate("/orders")} className="w-full md:w-auto order-1 md:order-none">
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" className="bg-slate-900 hover:bg-slate-800 text-white w-full md:w-auto min-w-[200px]" disabled={mutation.isPending}>
                            {mutation.isPending ? "Processing..." : (isEditMode ? "Update Order" : "Create Order")}
                        </Button>
                    </div>
                </div>
            </form >
        </div >
    );
}

// Small helper to avoid repeating reduce logic in JSX
function OrderTotal({ items }: { items: any[] }) {
    const total = items?.reduce((acc, item) => {
        return acc + ((item.unit_price || 0) * (item.quantity || 0));
    }, 0) || 0;
    return <div className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</div>;
}
