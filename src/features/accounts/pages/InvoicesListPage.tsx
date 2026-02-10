import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { FileText, Calendar, CheckCircle } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { getInvoices, updateInvoice } from "../api/invoices";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "../../../components/ui/tabs";
import { PermissionGuard } from "../../../hooks/usePermission";

export default function InvoicesListPage() {
    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [viewFilter, setViewFilter] = useState<'all' | 'in_queue' | 'completed'>('all');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    // Default to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(firstDay);
    const [dateTo, setDateTo] = useState(lastDay);

    const queryClient = useQueryClient();

    // Handle month selection - sets first and last day of month
    const handleMonthChange = (monthValue: string) => {
        setSelectedMonth(monthValue);

        if (!monthValue) {
            setDateFrom("");
            setDateTo("");
            return;
        }

        // monthValue is in format "YYYY-MM"
        const [year, month] = monthValue.split('-');
        const firstDayOfMonth = `${year}-${month}-01`;

        // Get last day of month
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDayFormatted = `${year}-${month}-${lastDayOfMonth.toString().padStart(2, '0')}`;

        setDateFrom(firstDayOfMonth);
        setDateTo(lastDayFormatted);
        setPage(1);
    };

    // Set current month as default on mount
    useEffect(() => {
        handleMonthChange(getCurrentMonth());
    }, []);

    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ['invoices', page, dateFrom, dateTo, viewFilter],
        queryFn: () => getInvoices({
            page,
            per_page: 15,
            date_from: dateFrom,
            date_to: dateTo,
            is_moved_to_system: viewFilter === 'all' ? undefined : viewFilter === 'completed'
        }),
    });

    const moveSystemMutation = useMutation({
        mutationFn: (id: number) => updateInvoice(id, { is_moved_to_system: true }),
        onSuccess: () => {
            toast.success("Invoice marked as moved to system");
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
        onError: () => toast.error("Failed to update status"),
    });

    const invoices = invoicesData?.data || [];

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-lg md:text-3xl font-bold flex items-center gap-2">
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
                                <Calendar className="h-3 w-3" /> Month
                            </label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="h-9 w-[165px]"
                            />
                        </div>

                        {/* OR Separator */}
                        <span className="text-xs text-gray-400 font-medium self-end pb-2">OR</span>

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
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <FileText className="h-3 w-3" /> View
                            </label>
                            <Tabs
                                value={viewFilter}
                                onValueChange={(val) => {
                                    setViewFilter(val as 'all' | 'in_queue' | 'completed');
                                    setPage(1);
                                }}
                                className="w-[300px]"
                            >
                                <TabsList className="grid w-full grid-cols-3 h-9">
                                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                    <TabsTrigger value="in_queue" className="text-xs">In Queue</TabsTrigger>
                                    <TabsTrigger value="completed" className="text-xs">Moved</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="ml-auto">
                            {(dateFrom !== firstDay || dateTo !== lastDay || viewFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedMonth(getCurrentMonth());
                                        handleMonthChange(getCurrentMonth());
                                        setViewFilter('all');
                                        setPage(1);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading invoices...</div>
                        ) : invoices.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No invoices found.
                            </div>
                        ) : (
                            invoices.map((invoice) => (
                                <div key={invoice.id} className="p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-gray-900" onClick={() => navigate(`/accounts/${invoice.id}`)}>
                                                {invoice.order?.unique_id || `INV-${invoice.id}`}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={invoice.order?.status === 'delivered' ? 'default' : 'secondary'}
                                            className="capitalize"
                                        >
                                            {invoice.order?.status || 'Unknown'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 text-xs block">Customer</span>
                                            <div className="font-medium text-gray-900">{invoice.order?.customer?.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-400">{invoice.order?.customer?.phone}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-500 text-xs block">Amount</span>
                                            <span className="font-bold text-slate-900">{invoice.total_amount}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-500">System Status</span>
                                        {invoice.is_moved_to_system ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Moved
                                            </Badge>
                                        ) : (
                                            <PermissionGuard module="accounts" action="mark_moved_to_system">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs bg-slate-50 border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                                    onClick={() => moveSystemMutation.mutate(invoice.id)}
                                                    disabled={moveSystemMutation.isPending}
                                                >
                                                    Mark as Moved
                                                </Button>
                                            </PermissionGuard>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate(`/accounts/${invoice.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>Invoice / Order #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Moved to System</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading invoices...</TableCell>
                                    </TableRow>
                                ) : invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                                            <TableCell>
                                                {invoice.is_moved_to_system ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Moved
                                                    </Badge>
                                                ) : (
                                                    <PermissionGuard module="accounts" action="mark_moved_to_system">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs bg-slate-50 border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                                            onClick={() => moveSystemMutation.mutate(invoice.id)}
                                                            disabled={moveSystemMutation.isPending}
                                                        >
                                                            Mark as Moved
                                                        </Button>
                                                    </PermissionGuard>
                                                )}
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
