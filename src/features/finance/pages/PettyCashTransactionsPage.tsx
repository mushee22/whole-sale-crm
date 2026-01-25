
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllPettyCashTransactions, getPettyCashAccounts, updatePettyCashTransaction } from "../api/pettyCash";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { format } from "date-fns";
import { Button } from "../../../components/ui/button";
import { RotateCcw, Eye, CheckCircle } from "lucide-react";
import { PettyCashTransactionDetailsModal } from "../components/PettyCashTransactionDetailsModal";
import type { PettyCashTransaction } from "../api/pettyCash";
import { Pagination } from "../../../components/ui/pagination";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "../../../components/ui/tabs";
import { PermissionGuard } from "../../../hooks/usePermission";


interface PettyCashTransactionsPageProps {
    isAccountsMode?: boolean;
}

export default function PettyCashTransactionsPage({ isAccountsMode = false }: PettyCashTransactionsPageProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<PettyCashTransaction | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [viewFilter, setViewFilter] = useState<'all' | 'in_queue' | 'completed'>('all');
    const [filters, setFilters] = useState({
        account_id: "",
        type: "",
        date_from: "",
        date_to: "",
    });

    // Fetch accounts for filter
    const { data: accountsData } = useQuery({
        queryKey: ['petty-cash-accounts-list'],
        queryFn: () => getPettyCashAccounts(1),
    });

    const { data: transactionsData, isLoading } = useQuery({
        queryKey: ['all-petty-cash-transactions', page, filters, viewFilter, isAccountsMode],
        queryFn: () => getAllPettyCashTransactions({
            page,
            per_page: 15,
            account_id: filters.account_id ? parseInt(filters.account_id) : undefined,
            type: filters.type || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            is_moved_to_system: isAccountsMode ? (viewFilter === 'all' ? undefined : viewFilter === 'completed') : undefined
        }),
    });

    const queryClient = useQueryClient();

    const moveSystemMutation = useMutation({
        mutationFn: (id: number) => updatePettyCashTransaction(id, { is_moved_to_system: true }),
        onSuccess: () => {
            toast.success("Transaction marked as moved to system");
            queryClient.invalidateQueries({ queryKey: ['all-petty-cash-transactions'] });
        },
        onError: () => toast.error("Failed to update status"),
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            account_id: "",
            type: "",
            date_from: "",
            date_to: "",
        });
        setViewFilter('all');
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                    <div className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Petty Cash Transactions</CardTitle>
                            <p className="text-sm text-gray-500">View and filter all petty cash transactions.</p>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                        <div className="flex-1 min-w-[200px]">
                            <Select
                                value={filters.account_id}
                                onValueChange={(val) => handleFilterChange("account_id", val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Filter by Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accountsData?.data.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.account_name} ({account.user.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-[150px]">
                            <Select
                                value={filters.type}
                                onValueChange={(val) => handleFilterChange("type", val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">Credit</SelectItem>
                                    <SelectItem value="debit">Debit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-[150px]">
                            <Input
                                type="date"
                                placeholder="From Date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="w-full md:w-[150px]">
                            <Input
                                type="date"
                                placeholder="To Date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        {isAccountsMode && (
                            <div className="w-full md:w-[300px]">
                                <Tabs
                                    value={viewFilter}
                                    onValueChange={(val) => {
                                        setViewFilter(val as 'all' | 'in_queue' | 'completed');
                                        setPage(1);
                                    }}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-3 h-10">
                                        <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                        <TabsTrigger value="in_queue" className="text-xs">In Queue</TabsTrigger>
                                        <TabsTrigger value="completed" className="text-xs">Moved</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}
                        {(filters.account_id || filters.type || filters.date_from || filters.date_to || (isAccountsMode && viewFilter !== 'all')) && (
                            <Button variant="ghost" size="icon" onClick={clearFilters}>
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading transactions...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {transactionsData?.data.map((transaction) => (
                                    <div key={transaction.id} className="p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {transaction.type === 'transfer' ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-red-700">From: {transaction.from_account?.account_name || 'Unknown'}</span>
                                                            <span className="text-green-700">To: {transaction.to_account?.account_name || 'Unknown'}</span>
                                                        </div>
                                                    ) : (
                                                        <span>
                                                            {transaction.to_account?.account_name || transaction.from_account?.account_name || 'N/A'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'credit'
                                                ? 'bg-green-50 text-green-700'
                                                : transaction.type === 'debit'
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {transaction.type.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 pt-1">
                                            <div>
                                                <span className="text-xs block">Amount</span>
                                                <span className="font-medium text-gray-900">₹{parseFloat(transaction.amount).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {!isAccountsMode && (
                                            <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-gray-50">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-gray-400 hover:text-blue-600"
                                                    onClick={() => {
                                                        setSelectedTransaction(transaction);
                                                        setDetailsOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="w-[120px] font-semibold text-gray-600 pl-6">Date</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Account</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Type</TableHead>
                                            {isAccountsMode && <TableHead className="font-semibold text-gray-600">Moved to System</TableHead>}
                                            <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                                            {!isAccountsMode && <TableHead className="w-[50px] font-semibold text-gray-600"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactionsData?.data.map((transaction) => (
                                            <TableRow key={transaction.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="text-slate-600 text-sm pl-6">
                                                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">
                                                    {transaction.type === 'transfer' ? (
                                                        <div className="flex flex-col text-sm">
                                                            <span className="text-red-700 font-medium">From: <span className="font-normal text-slate-600">{transaction.from_account?.account_name || 'Unknown'}</span></span>
                                                            <span className="text-green-700 font-medium">To: <span className="font-normal text-slate-600">{transaction.to_account?.account_name || 'Unknown'}</span></span>
                                                        </div>
                                                    ) : (
                                                        <span>
                                                            {transaction.to_account?.account_name || transaction.from_account?.account_name || 'N/A'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-600 text-sm">
                                                            {transaction.description || transaction.reference || '-'}
                                                        </span>
                                                        {transaction.reference && transaction.description && (
                                                            <span className="text-xs text-slate-400">{transaction.reference}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'credit'
                                                        ? 'bg-green-50 text-green-700'
                                                        : transaction.type === 'debit'
                                                            ? 'bg-red-50 text-red-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {transaction.type.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                {isAccountsMode && (
                                                    <TableCell>
                                                        {transaction.is_moved_to_system ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Moved
                                                            </Badge>
                                                        ) : (
                                                            <PermissionGuard module="finance" action="mark_moved_to_system">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs bg-slate-50 border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                                                    onClick={() => moveSystemMutation.mutate(transaction.id)}
                                                                    disabled={moveSystemMutation.isPending}
                                                                >
                                                                    Mark as Moved
                                                                </Button>
                                                            </PermissionGuard>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right font-medium text-slate-900">
                                                    ₹{parseFloat(transaction.amount).toFixed(2)}
                                                </TableCell>
                                                {!isAccountsMode && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-blue-600"
                                                            onClick={() => {
                                                                setSelectedTransaction(transaction);
                                                                setDetailsOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                        {transactionsData?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                    No transactions found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {transactionsData && transactionsData.last_page > 1 && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                    <Pagination
                                        currentPage={transactionsData.current_page}
                                        totalPages={transactionsData.last_page}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <PettyCashTransactionDetailsModal
                transaction={selectedTransaction}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
