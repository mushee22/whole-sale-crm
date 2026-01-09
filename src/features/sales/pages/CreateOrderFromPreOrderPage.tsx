import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { getPreOrder } from "../api/sales";
import { createOrder } from "../../orders/api/orders";
import { toast } from "sonner";
import { confirmPreOrder } from "../api/sales";

interface OrderItemState {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    total: number;
}

export function CreateOrderFromPreOrderPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [orderItems, setOrderItems] = useState<OrderItemState[]>([]);

    // Date states
    const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    const { data: preOrderData, isLoading } = useQuery({
        queryKey: ["pre-order", id],
        queryFn: () => getPreOrder(parseInt(id!)),
        enabled: !!id
    });

    const preOrder = preOrderData;

    useEffect(() => {
        if (preOrder?.items) {
            const initialItems = preOrder.items.map(item => ({
                productId: item.product_id,
                productName: item.product?.name || `Product ${item.product_id}`,
                price: parseFloat(item.price), // Ensure price is number
                quantity: item.quantity,
                total: parseFloat(item.price) * item.quantity
            }));
            setOrderItems(initialItems);
        }
    }, [preOrder]);



    const createOrderMutation = useMutation({
        mutationFn: async (data: any) => {
            // First create the order
            await createOrder(data);
            // If successful, confirm the pre-order
            if (id) {
                await confirmPreOrder(parseInt(id));
            }
        },
        onSuccess: () => {
            toast.success("Order created and pre-order confirmed");
            navigate("/orders");
        },
        onError: (error) => {
            toast.error("Failed to process order");
            console.error(error);
        },
    });

    const handleQuantityChange = (index: number, newQuantity: string) => {
        const qty = parseInt(newQuantity) || 0;
        setOrderItems(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                quantity: qty,
                total: updated[index].price * qty
            };
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!preOrder || !preOrder.customer_id) {
            toast.error("Customer information missing");
            return;
        }

        const validItems = orderItems.filter(item => item.quantity > 0);

        if (validItems.length === 0) {
            toast.error("Order must have at least one item with quantity > 0");
            return;
        }

        createOrderMutation.mutate({
            customer_id: preOrder.customer_id,
            // customer_name/phone are optional now if customer_id is present, but validation might still require them if not adjusted fully. 
            // The user requested checking payload. Schema was updated to allow optional.
            order_date: orderDate,
            estimated_delivery_date: deliveryDate,
            items: validItems.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                price: item.price,
                // unit_price: item.price // Schema allows 'price' or 'unit_price'
            })),
            // total_amount is likely calculated by backend or optional
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!preOrder) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Pre-Order not found</h2>
                <Button variant="ghost" onClick={() => navigate("/sales/pre-orders")} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                </Button>
            </div>
        );
    }

    const grandTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto lg:p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/sales/pre-orders")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Order from Pre-Order #{preOrder.id}</h1>
                    <p className="text-sm text-gray-500">Review details and confirm quantities</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label>Order Date</Label>
                            <Input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Estimated Delivery Date</Label>
                            <Input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-gray-500">Customer Name</Label>
                            <p className="font-medium text-lg">{preOrder.customer?.name}</p>
                        </div>
                        <div>
                            <Label className="text-gray-500">Phone</Label>
                            <p className="font-medium text-lg">{preOrder.customer?.phone}</p>
                        </div>
                        <div>
                            <Label className="text-gray-500">Pre-Order Date</Label>
                            <p className="font-medium">{new Date(preOrder.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Product</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="w-[150px]">Quantity</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderItems.map((item, index) => (
                                <TableRow key={item.productId}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex flex-col items-end gap-4 pt-4 border-t">
                        <div className="flex items-center gap-8 text-xl font-bold">
                            <span>Grand Total:</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full md:w-auto min-w-[200px] bg-green-600 hover:bg-green-700"
                            onClick={handleSubmit}
                            disabled={createOrderMutation.isPending}
                        >
                            {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
