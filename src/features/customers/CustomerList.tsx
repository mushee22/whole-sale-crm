import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Eye, Search, Pencil, Medal } from "lucide-react";
import { getCustomers } from "./api/customers";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/ui/modal";
import CustomerForm from "./components/CustomerForm";
import { useAuth } from "../../context/AuthContext";
import { PermissionGuard } from "../../hooks/usePermission";
import { useDebounce } from "../../hooks/useDebounce";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { getLocations } from "../master-data/api/locations";
import { getUsers } from "../users/api/users";

export default function CustomerList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [locationId, setLocationId] = useState("all");
    const [referenceId, setReferenceId] = useState("all");
    const [perPage] = useState("15");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const debouncedSearch = useDebounce(search, 500);
    const debouncedLocationId = useDebounce(locationId, 500);
    const debouncedReferenceId = useDebounce(referenceId, 500);

    const { data, isLoading } = useQuery({
        queryKey: ['customers', page, debouncedSearch, debouncedLocationId, debouncedReferenceId, perPage],
        queryFn: () => getCustomers({
            page,
            per_page: parseInt(perPage),
            name: debouncedSearch,
            location_id: debouncedLocationId === "all" ? undefined : debouncedLocationId,
            reference_id: debouncedReferenceId === "all" ? undefined : debouncedReferenceId
        }),
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => getLocations(),
    });

    const { data: usersData } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => getUsers({ per_page: 100 }),
    });

    const users = usersData?.data || [];

    const openEdit = (customer: any) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const { user } = useAuth();

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading customers...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-lg md:text-3xl font-bold">All Customers</CardTitle>
                        <p className="text-sm text-gray-500">Manage your customer base and loyalty points.</p>
                    </div>
                    {user?.role !== 'staff' && (
                        <PermissionGuard module="customers" action="add">
                            <Button
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                                onClick={() => setIsModalOpen(true)}
                            >
                                + Add Customer
                            </Button>
                        </PermissionGuard>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <PermissionGuard module="customers" action="view" showMessage>
                        <div className="p-4 border-b border-gray-100 bg-white space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1 md:max-w-[300px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search customers..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
                                    <Select value={locationId} onValueChange={(val) => {
                                        setLocationId(val);
                                        setPage(1);
                                    }}>
                                        <SelectTrigger className="w-[140px] flex-shrink-0">
                                            <SelectValue placeholder="Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Locations</SelectItem>
                                            {locations?.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={referenceId} onValueChange={(val) => {
                                        setReferenceId(val);
                                        setPage(1);
                                    }}>
                                        <SelectTrigger className="w-[140px] flex-shrink-0">
                                            <SelectValue placeholder="Reference" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>


                                </div>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {data?.data.map((customer) => (
                                <div key={customer.id} className="p-4 space-y-3 bg-white">
                                    <div className="flex  justify-between items-start">
                                        <div className="flex flex-col">
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
                                            <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                                                {customer.location && (
                                                    <div>
                                                        <span className="text-gray-400 text-xs">Location:</span>
                                                        <div className="font-medium">{customer.location.name}</div>
                                                    </div>
                                                )}
                                                {customer.referred_by && (
                                                    <div>
                                                        <span className="text-gray-400 text-xs">Referred By:</span>
                                                        <div className="font-medium">{customer.referred_by.name}</div>
                                                    </div>
                                                )}
                                            </div>
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
                                            <PermissionGuard module="loyalties" action="view">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-yellow-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/customers/${customer.id}/loyalty`);
                                                    }}
                                                    title="Manage Loyalty"
                                                >
                                                    <Medal className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </div>



                                    {user?.role !== 'staff' && (
                                        <div className="pt-2 border-t border-gray-50 flex justify-end">
                                            <PermissionGuard module="customers" action="update">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full"
                                                    onClick={() => openEdit(customer)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit Customer
                                                </Button>
                                            </PermissionGuard>
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
                                        <TableHead className="font-semibold text-gray-600">Location</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Referred By</TableHead>
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
                                            <TableCell>
                                                <div className="text-sm text-gray-900">{customer.location?.name || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-900">{customer.referred_by?.name || '-'}</div>
                                            </TableCell>

                                            <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">

                                                    <PermissionGuard module="customers" action="update">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => openEdit(customer)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGuard>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => navigate(`/customers/${customer.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <PermissionGuard module="loyalties" action="view">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-yellow-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/customers/${customer.id}/loyalty`);
                                                            }}
                                                            title="Manage Loyalty"
                                                        >
                                                            <Medal className="h-4 w-4" />
                                                        </Button>
                                                    </PermissionGuard>
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
                    </PermissionGuard>
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
