import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { getPreOrder } from "../api/sales";

export function PreOrderDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: preOrder, isLoading } = useQuery({
        queryKey: ["pre-order", id],
        queryFn: () => getPreOrder(parseInt(id!)),
        enabled: !!id
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto lg:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/sales/pre-orders")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Pre-Order #{preOrder.id}
                            <Badge
                                variant={preOrder.status === "pending" ? "outline" : "default"}
                                className={
                                    preOrder.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                        preOrder.status === "approved" ? "bg-green-100 text-green-800 border-green-200" :
                                            "bg-gray-100 text-gray-800"
                                }
                            >
                                {preOrder.status.toUpperCase()}
                            </Badge>
                        </h1>
                        <p className="text-sm text-gray-500 pl-1">
                            Created on {new Date(preOrder.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {preOrder.status === 'pending' && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => navigate(`/sales/pre-orders/${preOrder.id}/create`)}
                        >
                            Create Sales Order
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Customer Info */}
                <Card className="md:col-span-1 border-gray-100 shadow-sm h-fit">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg">Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{preOrder.customer?.name}</p>
                                <p className="text-sm text-gray-500">ID: {preOrder.customer_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <p className="text-sm text-gray-700">{preOrder.customer?.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preOrder.items?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {item.product?.name || `Product #${item.product_id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {parseFloat(item.price).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
