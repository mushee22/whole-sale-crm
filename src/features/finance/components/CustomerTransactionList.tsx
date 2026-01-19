import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerTransactions } from "../api/customerTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Plus, Edit } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CreateTransactionModal } from "./CreateTransactionModal";
import { EditTransactionModal } from "./EditTransactionModal";

export default function CustomerTransactionList() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useQuery({
        queryKey: ['customer-transactions', page],
        queryFn: () => getCustomerTransactions(page),
    });

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Customer Transactions</CardTitle>
                        <p className="text-sm text-gray-500">Manage payment transactions with customers.</p>
                    </div>
                    <CreateTransactionModal
                        trigger={
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                                <Plus className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>
                        }
                    />
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
                                {data?.data.map((transaction) => (
                                    <div key={transaction.id} className="p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-gray-900">{transaction.customer?.name}</div>
                                                <div className="text-xs text-slate-500">#{transaction.id} • {new Date(transaction.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'credit'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-700'
                                                }`}>
                                                {transaction.type.toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 pt-1">
                                            <div>
                                                <span className="text-xs block">Amount</span>
                                                <span className="font-medium text-gray-900">{parseFloat(transaction.amount).toFixed(2)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs block">Mode</span>
                                                <span className="font-medium text-gray-900 capitalize">{transaction.payment_mode.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="w-[80px] font-semibold text-gray-600 pl-6">ID</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Type</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Amount</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Collected By</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Note</TableHead>
                                            <TableHead className="font-semibold text-gray-600 w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.data.map((transaction) => (
                                            <TableRow key={transaction.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{transaction.id}</TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">{transaction.customer?.name}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'credit'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        {transaction.type.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-900 font-medium">{parseFloat(transaction.amount).toFixed(2)}</TableCell>
                                                <TableCell className="text-slate-600 capitalize">{transaction.payment_mode.replace('_', ' ')}</TableCell>
                                                <TableCell className="text-slate-600">{transaction.collected_by?.name || "-"}</TableCell>
                                                <TableCell className="text-slate-500 text-sm truncate max-w-[200px]" title={transaction.note}>
                                                    {transaction.note || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <EditTransactionModal
                                                        transaction={transaction}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                                                    No transactions found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Pagination
                                    currentPage={data?.current_page || 1}
                                    totalPages={data?.last_page || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
