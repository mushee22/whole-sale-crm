import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { getInvoices } from "../api/invoices";
import { Badge } from "../../../components/ui/badge";

import { useNavigate } from "react-router-dom";

export default function InvoicesListPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    // Default to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(firstDay);
    const [dateTo, setDateTo] = useState(lastDay);

    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ['invoices', page, dateFrom, dateTo],
        queryFn: () => getInvoices({
            page,
            per_page: 15,
            date_from: dateFrom,
            date_to: dateTo
        }),
    });

    const invoices = invoicesData?.data || [];

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            Accounts & Invoices
                        </CardTitle>
                        <p className="text-sm text-gray-500">Manage and view all invoices.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters */}
                    <div className="p-4 flex flex-wrap gap-4 border-b border-gray-100 bg-white items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> From Date
                            </label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 w-[150px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> To Date
                            </label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 w-[150px]"
                            />
                        </div>
                        <div className="ml-auto">
                            {(dateFrom !== firstDay || dateTo !== lastDay) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDateFrom(firstDay);
                                        setDateTo(lastDay);
                                        setPage(1);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>Invoice / Order #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading invoices...</TableCell>
                                    </TableRow>
                                ) : invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No invoices found for the selected period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {invoice.order?.unique_id || `INV-${invoice.id}`}
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-slate-900">{invoice.order?.customer?.name || "Unknown"}</span>
                                                    <span className="text-xs text-gray-500">{invoice.order?.customer?.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={invoice.order?.status === 'delivered' ? 'default' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {invoice.order?.status || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                {invoice.total_amount}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/accounts/${invoice.id}`)}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="px-4 py-4 border-t border-gray-100">
                        <Pagination
                            currentPage={invoicesData?.current_page || 1}
                            totalPages={invoicesData?.last_page || 1}
                            onPageChange={setPage}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
