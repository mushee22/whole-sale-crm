import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Eye, Search, Award, Pencil } from "lucide-react";
import { getCustomers } from "./api/customers";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/ui/modal";
import CustomerForm from "./components/CustomerForm";

import { useAuth } from "../../context/AuthContext";

export default function CustomerList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['customers', page, search],
        queryFn: () => getCustomers({ page, per_page: 15, search }),
    });

    const { user } = useAuth();

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading customers...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">All Customers</CardTitle>
                        <p className="text-sm text-gray-500">Manage your customer base and loyalty points.</p>
                    </div>
                    {user?.role !== 'staff' && (
                        <Button
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + Add Customer
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 flex gap-2 border-b border-gray-100 bg-white">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Points Earned</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Referral Points</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Points Used</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Joined Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-xs text-gray-500">ID: {customer.unique_id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-900">{customer.phone}</div>
                                            {customer.whatsapp_no && (
                                                <div className="text-xs text-green-600 flex items-center gap-1">
                                                    <span>WA:</span> {customer.whatsapp_no}
                                                </div>
                                            )}
                                            {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                                                <Award className="h-3.5 w-3.5" />
                                                {customer.total_earned_points}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                                                <Award className="h-3.5 w-3.5" />
                                                {customer.total_referral_points}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                                                <Award className="h-3.5 w-3.5" />
                                                {customer.total_used_points}
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {user?.role !== 'staff' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setEditingCustomer(customer);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="px-4 py-4 border-t border-gray-100">
                        <Pagination
                            currentPage={data?.current_page || 1}
                            totalPages={data?.last_page || 1}
                            onPageChange={setPage}
                        />
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                }}
                title={editingCustomer ? "Edit Customer" : "Add New Customer"}
            >
                <CustomerForm
                    initialData={editingCustomer}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingCustomer(null);
                    }}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingCustomer(null);
                    }}
                />
            </Modal>
        </div >
    );
}
