import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { getProducts, type Product } from "../../products/api/products";
import { getCustomer, updateCustomerPrices } from "../api/customers";

interface EditCustomerPricesModalProps {
    customerId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function EditCustomerPricesModal({ customerId, isOpen, onClose }: EditCustomerPricesModalProps) {
    const queryClient = useQueryClient();
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [priceItems, setPriceItems] = useState<Array<{
        productId: string;
        productName: string;
        price: number;
    }>>([]);

    // Fetch products
    const { data: productsData } = useQuery({
        queryKey: ["products"],
        queryFn: () => getProducts({ per_page: 100 }),
        enabled: isOpen
    });

    const products: Product[] = productsData?.data || [];

    // Fetch current customer prices to pre-fill
    const { data: customerData } = useQuery({
        queryKey: ["customer", customerId],
        queryFn: () => getCustomer(customerId),
        enabled: isOpen && !!customerId
    });

    // Populate initial items from customer data
    useEffect(() => {
        if (customerData?.product_prices) {
            const existingItems = customerData.product_prices.map(pp => {
                const product = products.find(p => p.id === pp.product_id);
                return {
                    productId: pp.product_id.toString(),
                    productName: product ? product.name : `Product #${pp.product_id}`,
                    price: parseFloat(pp.price)
                };
            });
            setPriceItems(existingItems);
        }
    }, [customerData, products]);

    // Auto-fill price when product selected
    useEffect(() => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id.toString() === selectedProductId);
        if (product) {
            setPrice(product.price.toString());
        }
    }, [selectedProductId, products]);

    const updatePricesMutation = useMutation({
        mutationFn: (data: { customerId: number, prices: { product_id: number, price: number }[] }) =>
            updateCustomerPrices(data.customerId, { prices: data.prices }),
        onSuccess: () => {
            toast.success("Customer special prices updated");
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
            onClose();
        },
        onError: () => toast.error("Failed to update prices"),
    });

    const handleAddItem = () => {
        if (!selectedProductId || !price) {
            toast.error("Please select product and price");
            return;
        }

        const product = products.find(p => p.id.toString() === selectedProductId);
        if (!product) return;

        const newItem = {
            productId: selectedProductId,
            productName: product.name,
            price: parseFloat(price)
        };

        setPriceItems(prev => {
            const existingIndex = prev.findIndex(item => item.productId === selectedProductId);
            if (existingIndex >= 0) {
                const newItems = [...prev];
                newItems[existingIndex] = newItem;
                return newItems;
            }
            return [...prev, newItem];
        });

        // Reset inputs
        setSelectedProductId("");
        setPrice("");
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...priceItems];
        newItems.splice(index, 1);
        setPriceItems(newItems);
    };

    const handleSave = () => {
        updatePricesMutation.mutate({
            customerId,
            prices: priceItems.map(item => ({
                product_id: parseInt(item.productId),
                price: item.price
            }))
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Special Prices</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Add New Price */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-6 space-y-2">
                                <Label>Select Product</Label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Choose product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label>Set Price</Label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="bg-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleAddItem} className="w-full" variant="secondary">
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Price List */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Special Price</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {priceItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No special prices set. Add one above.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    priceItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell>
                                                <div className="font-bold text-green-600">
                                                    ₹{item.price.toFixed(2)}
                                                </div>
                                            </TableCell>
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={updatePricesMutation.isPending} className="min-w-[120px] bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {updatePricesMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
