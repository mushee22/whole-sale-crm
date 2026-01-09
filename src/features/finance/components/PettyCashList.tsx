import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPettyCashAccounts } from "../api/pettyCash";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Plus, User as UserIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CreatePettyCashModal } from "./CreatePettyCashModal";

export default function PettyCashList() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useQuery({
        queryKey: ['petty-cash-accounts', page],
        queryFn: () => getPettyCashAccounts(page),
    });

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Petty Cash Accounts</CardTitle>
                        <p className="text-sm text-gray-500">Manage petty cash accounts for users.</p>
                    </div>
                    <CreatePettyCashModal
                        trigger={
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                                <Plus className="mr-2 h-4 w-4" /> Create Account
                            </Button>
                        }
                    />
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading accounts...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {data?.data.map((account) => (
                                    <div key={account.id} className="p-4 space-y-3 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{account.account_name}</div>
                                                <div className="text-xs text-slate-500">{account.account_id}</div>
                                                <div className="text-xs text-slate-500 mt-1">User: {account.user.name}</div>
                                            </div>
                                        </div>


                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 pt-1">
                                            <div>
                                                <span className="text-xs block">Opening Balance</span>
                                                <span className="font-medium text-gray-900">{parseFloat(account.opening_balance).toFixed(2)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs block">Current Balance</span>
                                                <span className="font-medium text-gray-900">{parseFloat(account.current_balance).toFixed(2)}</span>
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
                                            <TableHead className="font-semibold text-gray-600">Account ID</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Account Name</TableHead>
                                            <TableHead className="font-semibold text-gray-600">User</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Opening Balance</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Current Balance</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Created At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.data.map((account) => (
                                            <TableRow key={account.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{account.id}</TableCell>
                                                <TableCell className="text-slate-600 text-sm">{account.account_id}</TableCell>
                                                <TableCell className="text-slate-900 font-medium">{account.account_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <UserIcon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-900">{account.user.name}</div>
                                                            <div className="text-xs text-slate-400">{account.user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">{parseFloat(account.opening_balance).toFixed(2)}</TableCell>
                                                <TableCell className="text-slate-600">{parseFloat(account.current_balance).toFixed(2)}</TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {new Date(account.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                                                    No petty cash accounts found.
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
        </div >
    );
}
