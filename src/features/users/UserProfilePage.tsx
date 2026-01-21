
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { User, Mail, Phone, Shield, Wallet, History, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPettyCashTransactions } from "../finance/api/pettyCash";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Pagination } from "../../components/ui/pagination";
import { TransferPettyCashModal } from "../finance/components/TransferPettyCashModal";
import { PettyCashTransactionDetailsModal } from "../finance/components/PettyCashTransactionDetailsModal";
import type { PettyCashTransaction } from "../finance/api/pettyCash";
import { getUser } from "../auth/api/auth";

export default function UserProfilePage() {
    const { user: authUser } = useAuth();

    // Fetch fresh user data to ensure we have the latest petty cash balance and details
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: getUser,
        initialData: authUser || undefined, // Use authUser as initial data if available
        enabled: !!authUser,
    });

    const [page, setPage] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState<PettyCashTransaction | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const hasPettyCash = !!user?.petty_cash_account;
    const accountId = user?.petty_cash_account?.id;

    // Fetch transactions if user has petty cash account
    const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['petty-cash-transactions', accountId, page],
        queryFn: () => getPettyCashTransactions(accountId!, { page, per_page: 10 }),
        enabled: !!accountId,
    });

    if (!user) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Details Card */}
                <Card className="md:col-span-1 border-gray-100 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-600" />
                            Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Full Name</span>
                            <span className="font-medium text-slate-900">{user.name}</span>
                        </div>

                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email Address</span>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{user.email}</span>
                            </div>
                        </div>

                        {user.phone && (
                            <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Phone Number</span>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{user.phone}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col space-y-1 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Role</span>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {typeof user.role === 'string' ? user.role : user.role?.name || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Petty Cash & Transactions Section */}
                <div className="md:col-span-2 space-y-6">
                    {/* Petty Cash Account Card */}
                    {hasPettyCash ? (
                        <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-medium text-slate-100 flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-blue-400" />
                                            Petty Cash Account
                                        </CardTitle>
                                        <p className="text-slate-400 text-sm">
                                            {user.petty_cash_account?.account_name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs font-mono uppercase">Current Balance</p>
                                        <p className="text-3xl font-bold tracking-tight mt-1">
                                            ₹{parseFloat(user.petty_cash_account?.current_balance || "0").toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <div className="text-xs text-slate-400 font-mono">
                                        ID: {user.petty_cash_account?.account_id}
                                    </div>
                                    <div className="flex gap-2">
                                        <TransferPettyCashModal
                                            fromAccountId={user.petty_cash_account!.id}
                                            currentBalance={user.petty_cash_account!.current_balance}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2 border-gray-200 shadow-none bg-gray-50">
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">No Petty Cash Account</h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    You do not have a petty cash account assigned to your profile.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Transactions List */}
                    {hasPettyCash && (
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <History className="h-5 w-5 text-gray-500" />
                                    Transaction History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoadingTransactions ? (
                                    <div className="p-8 text-center text-sm text-gray-500">Loading transactions...</div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                        <TableHead className="pl-6">Date</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {transactionsData?.data.map((transaction) => (
                                                        <TableRow key={transaction.id} className="hover:bg-slate-50">
                                                            <TableCell className="pl-6 font-medium text-slate-700">
                                                                {format(new Date(transaction.date), 'MMM dd, yyyy')}
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
                                                            <TableCell className="text-slate-600 max-w-[200px] truncate">
                                                                {transaction.type === 'transfer' ? (
                                                                    <div className="flex flex-col text-xs">
                                                                        {transaction.from_account_id === accountId ? (
                                                                            <span>To: {transaction.to_account?.account_name}</span>
                                                                        ) : (
                                                                            <span>From: {transaction.from_account?.account_name}</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span>{transaction.description || transaction.reference || '-'}</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium text-slate-900">
                                                                <span className={transaction.type === 'credit' || (transaction.type === 'transfer' && transaction.to_account_id === accountId) ? 'text-green-600' : 'text-slate-900'}>
                                                                    {transaction.type === 'credit' || (transaction.type === 'transfer' && transaction.to_account_id === accountId) ? '+' : '-'}
                                                                    ₹{parseFloat(transaction.amount).toFixed(2)}
                                                                </span>
                                                            </TableCell>
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
                                                        </TableRow>
                                                    ))}
                                                    {(!transactionsData?.data || transactionsData.data.length === 0) && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
                    )}
                </div>
            </div>

            <PettyCashTransactionDetailsModal
                transaction={selectedTransaction}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
