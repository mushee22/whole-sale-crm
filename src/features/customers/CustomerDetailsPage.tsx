import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomer, getCustomerTransactions } from "./api/customers";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, Calendar, Edit, History, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import OrderDetailsModal from "../orders/components/OrderDetailsModal";
import { Pagination } from "../../components/ui/pagination";
import CustomerOrdersList from "./components/CustomerOrdersList";
import { CreateTransactionModal } from "../finance/components/CreateTransactionModal";
import { EditTransactionModal } from "../finance/components/EditTransactionModal";
import { EditCustomerPricesModal } from "./components/EditCustomerPricesModal";
import { PermissionGuard } from "../../hooks/usePermission";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const customerId = Number(id);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
    const [transactionPage, setTransactionPage] = useState(1);
    const { user } = useAuth();

    const { data: customerData, isLoading: isCustomerLoading } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomer(customerId),
        enabled: !!customerId
    });

    const { data: transactionsResponse, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ['customer-transactions', customerId, transactionPage],
        queryFn: () => getCustomerTransactions(customerId, { page: transactionPage, per_page: 10 }),
        enabled: !!customerId
    });

    if (isCustomerLoading || isTransactionsLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!customerData) return <div className="p-8 text-center text-red-500">Customer not found</div>;

    const customer = customerData;
    const transactions = transactionsResponse?.transactions;
    const currentBalance = transactionsResponse?.current_balance || 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 px-4 md:px-6">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-slate-900 w-fit" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Customers
                </Button>
            </div>

            {/* Customer Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-gray-100 shadow-sm bg-white">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {customer.name}
                            {customer.status && (
                                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="ml-2 uppercase text-[10px]">
                                    {customer.status}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-medium">Phone</p>
                                <p className="text-slate-900 font-medium">{customer.phone}</p>
                            </div>
                        </div>

                        {customer.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-medium">Email</p>
                                    <p className="text-slate-900 font-medium">{customer.email}</p>
                                </div>
                            </div>
                        )}

                        {customer.location && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-medium">Location</p>
                                    <p className="text-slate-900 font-medium">{customer.location.name}</p>
                                </div>
                            </div>
                        )}

                        {customer.created_at && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-medium">Joined</p>
                                    <p className="text-slate-900 font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Balance & Stats Card */}
                <Card className="border-gray-100 shadow-sm bg-slate-900 text-white">
                    <CardContent className="p-6 flex flex-col justify-center h-full space-y-6">
                        <div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Current Balance</p>
                            <p className={`text-3xl font-bold ${currentBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {currentBalance.toFixed(2)}
                            </p>
                        </div>
                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Outstanding:</span>
                                <span className="font-medium">{customer.outstanding_amount || '0.00'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Transactions (Takes up 2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-gray-100 shadow-sm flex flex-col">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-500" />
                                <CardTitle className="text-lg font-semibold text-slate-800">Transaction History</CardTitle>
                            </div>
                            <PermissionGuard module="finance" action="add">
                                <CreateTransactionModal
                                    customerId={customerId}
                                    collectedBy={user?.id}
                                    trigger={
                                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8">
                                            <Plus className="mr-2 h-3.5 w-3.5" /> Add Transaction
                                        </Button>
                                    }
                                />
                            </PermissionGuard>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/30">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions?.data && transactions.data.length > 0 ? (
                                            transactions.data.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-gray-600 text-sm">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`capitalize
                                                            ${tx.type === 'credit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                                                        `}>
                                                            {tx.type === 'credit' ? 'Cash Collected' : 'Sale'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="capitalize text-sm text-gray-700">{tx.payment_mode}</TableCell>
                                                    <TableCell className="text-sm text-gray-600">
                                                        {tx.description || '-'}
                                                        {tx.order && <span className="ml-1 text-xs text-indigo-500 cursor-pointer hover:underline" onClick={() => {
                                                            setSelectedOrderId(tx.order!.id);
                                                            setIsOrderModalOpen(true);
                                                        }}>(Order #{tx.order.order_number})</span>}
                                                        {tx.invoice && (
                                                            <span
                                                                className="ml-1 text-xs text-blue-500 cursor-pointer hover:underline"
                                                                onClick={() => navigate(`/accounts/${tx.invoice!.id}`)}
                                                            >
                                                                (Invoice #{tx.invoice.id})
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                                    </TableCell>
                                                    <TableCell>
                                                        <PermissionGuard module="finance" action="update">
                                                            {tx.invoice && tx.invoice.order_id ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                                                    onClick={() => navigate(`/orders/edit/${tx.invoice!.order_id}`)}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            ) : (
                                                                <EditTransactionModal
                                                                    transaction={tx}
                                                                    trigger={
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600">
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                    }
                                                                />
                                                            )}
                                                        </PermissionGuard>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                    No transactions found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="px-4 py-4 border-t border-gray-100">
                                <Pagination
                                    currentPage={transactions?.current_page || 1}
                                    totalPages={transactions?.last_page || 1}
                                    onPageChange={setTransactionPage}
                                />
                            </div>
                        </CardContent>
                    </Card >
                </div >

                {/* Right Column: Special Pricing (Takes up 1 col) */}
                < div className="space-y-6" >
                    <Card className="border-gray-100 shadow-sm flex flex-col h-full">
                        <CardHeader className="border-b border-gray-100 bg-purple-50/30 pb-4 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                    Offers
                                </Badge>
                                <CardTitle className="text-lg font-semibold text-slate-800">Special Pricing</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600" onClick={() => setIsEditPriceModalOpen(true)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto">
                            <div className="divide-y divide-gray-100">
                                {customer.product_prices && customer.product_prices.length > 0 ? (
                                    customer.product_prices.map((pp) => (
                                        <div key={pp.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="font-medium text-slate-900 line-clamp-2 text-sm">{pp.product?.name || `Product #${pp.product_id}`}</div>
                                                <div className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm shrink-0 ml-2">
                                                    {pp.price}
                                                </div>
                                            </div>
                                            {pp.product?.description && (
                                                <div className="text-xs text-gray-500 line-clamp-1">{pp.product.description}</div>
                                            )}
                                            <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                                                <div>Original: <span className="line-through">{pp.product?.price}</span></div>
                                                <div>Set: {new Date(pp.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">No special pricing set</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div >
            </div >

            {/* Orders Section */}
            < CustomerOrdersList customerId={customerId} />

            <OrderDetailsModal
                orderId={selectedOrderId}
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
            />

            <EditCustomerPricesModal
                customerId={customerId}
                isOpen={isEditPriceModalOpen}
                onClose={() => setIsEditPriceModalOpen(false)}
            />
        </div >
    );
}
