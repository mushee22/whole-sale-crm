import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPettyCashAccount, getPettyCashTransactions } from "../api/pettyCash";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, User, Wallet, Calendar } from "lucide-react";
import { TransferPettyCashModal } from "../components/TransferPettyCashModal";
import { PermissionGuard } from "../../../hooks/usePermission";

export const PettyCashDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: account, isLoading, error } = useQuery({
        queryKey: ["petty-cash-account", id],
        queryFn: () => getPettyCashAccount(Number(id)),
        enabled: !!id
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading account details...</div>;
    if (error || !account) return <div className="p-8 text-center text-red-500">Account not found</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-slate-900" onClick={() => navigate("/petty-cash-accounts")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Accounts
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{account.account_name}</h1>
                    <p className="text-slate-500 mt-1">Account ID: {account.account_id}</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-slate-900 text-white border-none shadow-lg min-w-[200px]">
                        <CardContent className="p-6">
                            <p className="text-slate-400 text-sm font-medium">Current Balance</p>
                            <p className="text-2xl font-bold mt-1">₹{parseFloat(account.current_balance).toFixed(2)}</p>
                            <div className="mt-4">
                                <PermissionGuard module="finance" action="update">
                                    <TransferPettyCashModal
                                        fromAccountId={account.id}
                                        currentBalance={account.current_balance}
                                    />
                                </PermissionGuard>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-500" />
                            Account Holder
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                {account.user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">{account.user.name}</p>
                                <p className="text-sm text-slate-500">User ID: #{account.user.id}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-sm text-slate-900">{account.user.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="text-sm text-slate-900">{account.user.phone}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-emerald-500" />
                            Account Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Opening Balance</p>
                                <p className="text-lg font-bold text-slate-900">₹{parseFloat(account.opening_balance).toFixed(2)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">Status</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${account.is_amount_accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {account.is_amount_accepted ? 'Active' : 'Pending'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                            <Calendar className="h-3 w-3" />
                            Created on {new Date(account.created_at).toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Section placeholder - could be added later if API supports it */}
            <Card className="shadow-sm border-gray-100">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <PettyCashTransactionsList accountId={Number(id)} />
                </CardContent>
            </Card>
        </div>
    );
};

function PettyCashTransactionsList({ accountId }: { accountId: number }) {
    const [page] = useState(1);
    const [type, setType] = useState<string>("");

    // Default dates or similar could be handled here

    const { data, isLoading } = useQuery({
        queryKey: ["petty-cash-transactions", accountId, page, type],
        queryFn: () => getPettyCashTransactions(accountId, {
            page,
            per_page: 15,
            type: type || undefined
        }),
    });

    if (isLoading) return <div className="py-8 text-center text-gray-500">Loading transactions...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
                <select
                    className="h-9 rounded-md border border-gray-200 text-sm p-2 w-32 bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                </select>
            </div>

            <div className="rounded-md border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Description</th>
                            <th className="py-3 px-4 text-left">Type</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data?.data.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50">
                                <td className="py-3 px-4 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="py-3 px-4 text-slate-900">{tx.description}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'
                                    }`}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {data?.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400">No transactions found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
