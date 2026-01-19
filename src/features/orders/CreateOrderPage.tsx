import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { createOrder, updateOrderStatus, getOrder, createOrderSchema, type CreateOrderData } from "./api/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Search, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getProducts, type Product } from "../products/api/products";
import { getCustomers, getCustomer, type Customer } from "../customers/api/customers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { cn } from "../../lib/utils";

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

    const unitPrice = watch(`items.${index}.unit_price`);
    const quantity = watch(`items.${index}.quantity`);

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setValue(`items.${index}.product_id`, product.id);

        // --- Special Price Logic ---
        let effectivePrice = Number(product.price);

        // 1. Check for special customer price
        if (customer && customer.product_prices) {
            const specialPrice = customer.product_prices.find(pp => pp.product_id === product.id);
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
        <div className="grid grid-cols-12 gap-4 items-start md:items-end p-4 border border-gray-100 rounded-lg bg-gray-50/50 relative group">
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
                {errors.items?.[index]?.product_id && <p className="text-xs text-red-500 mt-1">{errors.items[index].product_id.message}</p>}
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

            <div className="col-span-6 md:col-span-3 space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</Label>
                <div className="h-10 flex items-center px-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-md truncate">
                    ₹{lineTotal.toFixed(2)}
                </div>
            </div>

            <div className="col-span-6 md:col-span-1 flex justify-end md:justify-center md:pb-1 pt-6 md:pt-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 md:h-8 md:w-8"
                    onClick={() => remove(index)}
                >
                    <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function CreateOrderPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const orderId = Number(id);
    const queryClient = useQueryClient();

    // Edit Mode State
    const [status, setStatus] = useState<string>("");

    // Customer Selection State
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);

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
    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateOrderData>({
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
                    if (item.product_id) {
                        const specialPrice = customerDetails.product_prices?.find(pp => pp.product_id === item.product_id);
                        if (specialPrice) {
                            setValue(`items.${index}.unit_price`, Number(specialPrice.price));
                        }
                    }
                });
            }
        }
    }, [customerDetails, setValue, watch]);

    // Fetch order details if editing
    const { data: orderData, isLoading: isLoadingOrder } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId),
        enabled: isEditMode
    });

    useEffect(() => {
        if (orderData && isEditMode) {
            setStatus(orderData.status);
        }
    }, [orderData, isEditMode]);

    const createMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (data: any) => {
            toast.success('Order created successfully');
            if (data?.customer_id) {
                navigate(`/customers/${data.customer_id}`);
            } else {
                navigate("/orders");
            }
        },
        onError: (error: any) => {
            toast.error('Failed to create order');
            console.error(error);
        }
    });

    const updateFromStatusMutation = useMutation({
        mutationFn: (newStatus: string) => updateOrderStatus(orderId, newStatus),
        onSuccess: () => {
            toast.success('Order status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            navigate(`/orders/${orderId}`);
        },
        onError: (error: any) => {
            toast.error('Failed to update order status');
            console.error(error);
        }
    });

    const onCreateSubmit = (data: CreateOrderData) => {
        const totalAmount = data.items.reduce((acc, item) => acc + ((item.unit_price || 0) * item.quantity), 0);
        createMutation.mutate({ ...data, total_amount: totalAmount });
    };

    const onUpdateStatus = () => {
        if (!status) return;
        updateFromStatusMutation.mutate(status);
    };

    if (isEditMode && isLoadingOrder) return <div className="p-8 text-center text-gray-500">Loading order...</div>;

    const ORDER_STATUSES = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "dispatched", label: "Dispatched" },
        { value: "out_for_delivery", label: "Out For Delivery" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    if (isEditMode) {
        // Edit mode UI (Status update only)
        return (
            <div className="max-w-md mx-auto space-y-6 px-4 md:px-0 mt-10">
                <Button variant="ghost" className="pl-0 hover:bg-transparent -ml-2 mb-2 text-slate-500" onClick={() => navigate(`/orders/${orderId}`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Order
                </Button>

                <Card className="shadow-lg border-gray-100">
                    <CardHeader>
                        <CardTitle>Update Order Status</CardTitle>
                        <CardDescription>Order #{orderData?.order_number || orderData?.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Current Status</Label>
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

                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800"
                            onClick={onUpdateStatus}
                            disabled={updateFromStatusMutation.isPending || status === orderData?.status}
                        >
                            {updateFromStatusMutation.isPending ? "Updating..." : "Update Status"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Create Mode UI
    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" className="pl-0 hover:bg-transparent -ml-2 mb-2 text-slate-500" onClick={() => navigate("/orders")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Create New Order</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">Select a customer and add products.</p>
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
                        <div className="flex flex-col space-y-2">
                            <Label>Select Customer</Label>
                            <Popover open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isCustomerSearchOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedCustomerId && customerDetails
                                            ? `${customerDetails.name} (${customerDetails.phone})`
                                            : "Search customer..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search by name..." value={customerQuery} onValueChange={setCustomerQuery} />
                                        <CommandList>
                                            <CommandEmpty>No customer found.</CommandEmpty>
                                            <CommandGroup>
                                                {customersData?.data?.map((customer) => (
                                                    <CommandItem
                                                        key={customer.id}
                                                        value={customer.name}
                                                        onSelect={() => {
                                                            setSelectedCustomerId(customer.id);
                                                            setIsCustomerSearchOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{customer.name}</span>
                                                            <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="order_date">Order Date</Label>
                                <Input
                                    id="order_date"
                                    type="date"
                                    max={getTodayDate()}
                                    {...register("order_date")}
                                />
                                {errors.order_date && <p className="text-sm text-red-500">{errors.order_date.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Customer Name</Label>
                                <Input id="customer_name" placeholder="Enter customer name" {...register("customer_name")} />
                                {errors.customer_name && <p className="text-sm text-red-500">{errors.customer_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" placeholder="Enter phone number" {...register("phone")} />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp_no">WhatsApp Number (Optional)</Label>
                                <Input id="whatsapp_no" placeholder="Enter WhatsApp number" {...register("whatsapp_no")} />
                                {errors.whatsapp_no && <p className="text-sm text-red-500">{errors.whatsapp_no.message}</p>}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input id="email" type="email" placeholder="Enter email address" {...register("email")} />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                remove={remove}
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                customer={customerDetails} // Pass the fetched customer details
                            />
                        ))}
                        {errors.items && <p className="text-sm text-red-500 text-center">{errors.items.message}</p>}

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <div className="text-right">
                                <span className="text-sm text-gray-500">Order Total</span>
                                <OrderTotal items={watch("items")} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900">Extra Details</CardTitle>
                        <CardDescription>Optional referral or reward information.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="referral_phone">Referral Phone (Optional)</Label>
                            <Input id="referral_phone" placeholder="Enter referrer's phone number" {...register("referral_phone")} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate("/orders")}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px]" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creating Order..." : "Create Order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Small helper to avoid repeating reduce logic in JSX
function OrderTotal({ items }: { items: any[] }) {
    const total = items?.reduce((acc, item) => {
        return acc + ((item.unit_price || 0) * (item.quantity || 0));
    }, 0) || 0;
    return <div className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</div>;
}
