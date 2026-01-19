import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, User, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { getInvoice, downloadInvoice } from "../api/invoices";
import { getOrder } from "../../orders/api/orders";

export function InvoiceDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
        queryKey: ["invoice", id],
        queryFn: () => getInvoice(parseInt(id!)),
        enabled: !!id
    });

    const { data: order, isLoading: isLoadingOrder } = useQuery({
        queryKey: ["order", invoice?.order_id],
        queryFn: () => getOrder(invoice!.order_id),
        enabled: !!invoice?.order_id
    });

    const isLoading = isLoadingInvoice || isLoadingOrder;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Invoice not found</h2>
                <Button variant="ghost" onClick={() => navigate("/accounts")} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                </Button>
            </div>
        );
    }

    const orderData = order || invoice.order;

    return (
        <div className="space-y-6 max-w-5xl mx-auto lg:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/accounts")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Invoice #{invoice.order?.unique_id || `INV-${invoice.id}`}
                            <Badge
                                variant={orderData?.status === "delivered" ? "default" : "secondary"}
                                className="capitalize"
                            >
                                {orderData?.status || 'Unknown'}
                            </Badge>
                        </h1>
                        <p className="text-sm text-gray-500 pl-1">
                            Invoice Date: {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={async () => {
                        try {
                            const blob = await downloadInvoice(invoice.id);
                            const url = window.URL.createObjectURL(new Blob([blob]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `invoice-${invoice.order?.unique_id || invoice.id}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                        } catch (error) {
                            console.error("Failed to download invoice", error);
                        }
                    }}
                >
                    <FileText className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Customer & Invoice Info */}
                <div className="space-y-6 md:col-span-1">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">{orderData?.customer?.name}</p>
                                    <p className="text-sm text-gray-500">ID: {orderData?.customer_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5" />
                                <p className="text-sm text-gray-700">{orderData?.customer?.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg">Order Info</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Order Date</span>
                                <span className="font-medium">{orderData?.order_date ? new Date(orderData.order_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Order ID</span>
                                <span className="font-medium">#{invoice.order_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Amount</span>
                                <span className="font-bold text-lg">{invoice.total_amount}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Items */}
                <Card className="md:col-span-2 border-gray-100 shadow-sm h-fit">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg">Invoice Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderData?.items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {item.product?.name || `Product #${item.product_id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {Number(item.price).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {(Number(item.price) * item.quantity).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-gray-50 font-bold">
                                    <TableCell colSpan={3} className="text-right">Grand Total:</TableCell>
                                    <TableCell className="text-right text-lg">
                                        {invoice.total_amount}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
