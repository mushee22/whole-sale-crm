import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { getUsers } from "../../users/api/users";
import { getProducts } from "../../products/api/products";
import { exportOrders } from "../api/reports";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportOrdersModal({ isOpen, onClose }: ExportOrdersModalProps) {
    const [search] = useState("");
    const [userId, setUserId] = useState("");
    const [productId, setProductId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: users } = useQuery({
        queryKey: ['users', 'staff'],
        queryFn: () => getUsers({ per_page: 100 }),
        enabled: isOpen,
    });

    const { data: products } = useQuery({
        queryKey: ['products', 'list'],
        queryFn: () => getProducts({ per_page: 100, is_active: true }),
        enabled: isOpen,
    });

    const exportMutation = useMutation({
        mutationFn: exportOrders,
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders_export_${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Orders exported successfully");
            onClose();
        },
        onError: () => {
            toast.error("Failed to export orders");
        },
    });

    const handleExport = () => {
        exportMutation.mutate({
            search,
            user_id: userId,
            product_id: productId,
            start_date: startDate,
            end_date: endDate,
            format: 'xlsx',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Orders"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                    Filter and export order data to Excel.
                </p>
                <div className="grid gap-4">
                    {/* <div className="grid gap-2">
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            placeholder="Order # or Customer Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div> */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user">Staff Member</Label>
                        <select
                            id="user"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        >
                            <option value="">All Staff</option>
                            {users?.data.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role_id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="product">Product</Label>
                        <select
                            id="product"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        >
                            <option value="">All Products</option>
                            {products?.data.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleExport} disabled={exportMutation.isPending} className="bg-slate-900 text-white hover:bg-slate-800">
                        {exportMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export Excel
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
