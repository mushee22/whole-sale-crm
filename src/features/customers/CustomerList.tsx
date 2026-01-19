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
        queryFn: () => getCustomers({ page, per_page: 15 }),
    });

    const openEdit = (customer: any) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

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

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {data?.data.map((customer) => (
                            <div key={customer.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900">{customer.name}</div>
                                        <div className="text-xs text-gray-500">ID: {customer.unique_id || `#${customer.id}`}</div>
                                        <div className="text-sm text-gray-600 mt-1">{customer.phone}</div>
                                        {customer.whatsapp_no && (
                                            <div className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                                <span>WA:</span> {customer.whatsapp_no}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => navigate(`/customers/${customer.id}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                                        <div className="text-xs text-green-700 font-medium uppercase">Earned</div>
                                        <div className="font-bold text-green-800">{customer.total_earned_points || 0}</div>
                                    </div>
                                    <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="text-xs text-blue-700 font-medium uppercase">Referral</div>
                                        <div className="font-bold text-blue-800">{customer.total_referral_points || 0}</div>
                                    </div>
                                    <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                                        <div className="text-xs text-amber-700 font-medium uppercase">Used</div>
                                        <div className="font-bold text-amber-800">{customer.total_used_points || 0}</div>
                                    </div>
                                </div>

                                {user?.role !== 'staff' && (
                                    <div className="pt-2 border-t border-gray-50 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full"
                                            onClick={() => openEdit(customer)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" /> Edit Customer
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
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
                                            <div className="text-xs text-gray-500">ID: {customer.unique_id || `#${customer.id}`}</div>
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
                                                {customer.total_earned_points || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                                                <Award className="h-3.5 w-3.5" />
                                                {customer.total_referral_points || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                                                <Award className="h-3.5 w-3.5" />
                                                {customer.total_used_points || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {user?.role !== 'staff' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEdit(customer)}
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
