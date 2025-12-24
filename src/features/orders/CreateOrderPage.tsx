import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { createOrder, updateOrder, getOrder, createOrderSchema, type CreateOrderData } from "./api/orders";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Search, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getProducts, type Product } from "../products/api/products";

// ... OrderItemRow component remains same ...

interface OrderItemRowProps {
    index: number;
    register: any;
    control: any;
    remove: (index: number) => void;
    setValue: any;
    watch: any;
    errors: any;
}

function OrderItemRow({ index, register, remove, setValue, watch, errors }: OrderItemRowProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fetch products for autocomplete
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

    // Helper to initialize search text if product_id is preset (edit mode)
    // Note: In a real app we might need to fetch the specific product if not in list, but we'll skip for now or assume loaded

    const unitPrice = watch(`items.${index}.unit_price`);
    const quantity = watch(`items.${index}.quantity`);
    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setValue(`items.${index}.product_id`, product.id);
        // Use discount_price if available, otherwise use regular price
        const effectivePrice = product.discount_price || product.price;
        setValue(`items.${index}.unit_price`, effectivePrice);
        setOpen(false);
        setSearch('');
    };



    const lineTotal = (unitPrice || 0) * (quantity || 0);

    const filteredProducts = productsData?.data || [];

    return (
        <div className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-100 rounded-lg bg-gray-50/50 relative group">
            <div className="col-span-12 md:col-span-6 space-y-2" ref={wrapperRef}>
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
                                setValue(`items.${index}.product_id`, 0); // Clear product_id
                                setValue(`items.${index}.unit_price`, 0); // Clear unit_price
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
                                            {
                                                product.price ? (
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
                                                ) : (
                                                    null
                                                )}
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

            <div className="col-span-4 md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</Label>
                <Input
                    type="number"
                    className="bg-white"
                    step="0.01"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                />
            </div>

            <div className="col-span-4 md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</Label>
                <Input
                    type="number"
                    className="bg-white"
                    min="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
            </div>

            <div className="col-span-4 md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</Label>
                <div className="h-10 flex items-center px-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-md">
                    ₹{lineTotal.toFixed(2)}
                </div>
            </div>

            <div className="col-span-12 md:col-span-1 flex justify-end md:pb-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => remove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function CreateOrderPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const orderId = Number(id);

    const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateOrderData>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            items: [{ product_id: 0, quantity: 1, unit_price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Fetch order details if editing
    const { data: orderData, isLoading: isLoadingOrder } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId),
        enabled: isEditMode
    });

    useEffect(() => {
        if (orderData && isEditMode) {
            reset({
                customer_name: orderData.customer.name,
                phone: orderData.customer.phone,
                whatsapp_no: orderData.customer.whatsapp_no || "",
                email: orderData.customer.email || "",
                referral_phone: orderData.referral_phone,
                // Map items
                items: orderData.order_items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: Number(item.unit_price)
                }))
            });
        }
    }, [orderData, isEditMode, reset]);

    const mutation = useMutation({
        mutationFn: (data: CreateOrderData) => isEditMode ? updateOrder(orderId, data) : createOrder(data),
        onSuccess: (data: any) => {
            toast.success(`Order ${isEditMode ? 'updated' : 'created'} successfully`);
            if (!isEditMode && data?.customer_id) {
                navigate(`/customers/${data.customer_id}`);
            } else {
                navigate("/orders");
            }
        },
        onError: (error: any) => {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} order`);
            console.error(error);
        }
    });

    const onSubmit = (data: CreateOrderData) => {
        const totalAmount = data.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        mutation.mutate({ ...data, total_amount: totalAmount });
    };

    // Calculate total order value
    const items = watch("items");
    const totalOrderValue = items?.reduce((acc, item) => {
        return acc + ((item.unit_price || 0) * (item.quantity || 0));
    }, 0) || 0;

    if (isEditMode && isLoadingOrder) return <div className="p-8 text-center text-gray-500">Loading order...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" className="pl-0 hover:bg-transparent -ml-2 mb-2 text-slate-500" onClick={() => navigate("/orders")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{isEditMode ? 'Edit Order' : 'Create New Order'}</h1>
                    <p className="text-slate-500 mt-1">{isEditMode ? 'Modify customer details or items.' : 'Enter customer details and add products.'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900">Customer Details</CardTitle>
                        <CardDescription>Who is this order for?</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
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
                            />
                        ))}
                        {errors.items && <p className="text-sm text-red-500 text-center">{errors.items.message}</p>}

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <div className="text-right">
                                <span className="text-sm text-gray-500">Order Total</span>
                                <div className="text-2xl font-bold text-slate-900">₹{totalOrderValue.toFixed(2)}</div>
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
                        {/* Placeholder for Claim Reward ID if needed, hiding for now or keeping minimal */}
                        {/* <div className="space-y-2">
                            <Label htmlFor="claim_reward_id">Reward ID (Optional)</Label>
                            <Input
                                id="claim_reward_id"
                                type="number"
                                placeholder="Enter reward ID"
                                {...register("claim_reward_id", {
                                    setValueAs: (v) => v === "" ? null : parseInt(v, 10)
                                })}
                            />
                        </div> */}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate("/orders")}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px]" disabled={mutation.isPending}>
                        {mutation.isPending ? (isEditMode ? "Updating Order..." : "Creating Order...") : (isEditMode ? "Update Order" : "Create Order")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
