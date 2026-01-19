import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { Users, Search } from "lucide-react";
import { getCustomers } from "../api/customers";

export default function CustomersListPage() {
    const [page, setPage] = useState(1);
    const [nameFilter, setNameFilter] = useState("");
    const [locationIdFilter, setLocationIdFilter] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ['customers', page, nameFilter, locationIdFilter],
        queryFn: () => getCustomers({
            page,
            per_page: 15,
            name: nameFilter || undefined,
            location_id: locationIdFilter || undefined
        }),
    });

    const customers = data?.data || [];

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 pb-4 border-b border-gray-100 gap-4 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Customers
                        </CardTitle>
                        <p className="text-sm text-gray-500">Manage your customer base.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters Toolbar */}
                    <div className="p-4 flex flex-wrap gap-4 border-b border-gray-100 bg-white">
                        <div className="flex-1 min-w-[200px] max-w-sm flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name..."
                                value={nameFilter}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setNameFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9"
                            />
                        </div>
                        <div className="min-w-[150px] flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Location ID:</span>
                            <Input
                                placeholder="ID"
                                type="number"
                                value={locationIdFilter}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setLocationIdFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 w-20"
                            />
                        </div>

                        {(nameFilter || locationIdFilter) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setNameFilter("");
                                    setLocationIdFilter("");
                                    setPage(1);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Location ID</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">Loading customers...</TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">#{customer.id}</TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-gray-900">{customer.name}</span>
                                            </TableCell>
                                            <TableCell>{customer.phone}</TableCell>
                                            <TableCell>{customer.email || "-"}</TableCell>
                                            <TableCell className="text-center">
                                                {customer.location_id ? (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                                                        #{customer.location_id}
                                                    </span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {customer.outstanding_amount && parseFloat(customer.outstanding_amount) > 0 ? (
                                                    <span className="text-red-600">₹{customer.outstanding_amount}</span>
                                                ) : "₹0.00"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.status && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {customer.status}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading customers...</div>
                        ) : customers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No customers found.</div>
                        ) : (
                            customers.map((customer) => (
                                <div key={customer.id} className="p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-gray-900">{customer.name}</div>
                                            <div className="text-xs text-gray-500">ID: #{customer.id}</div>
                                        </div>
                                        {customer.status && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {customer.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div>
                                            <span className="text-xs text-gray-400 block">Phone</span>
                                            {customer.phone}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block">Location ID</span>
                                            {customer.location_id || "-"}
                                        </div>
                                        {customer.email && (
                                            <div className="col-span-2">
                                                <span className="text-xs text-gray-400 block">Email</span>
                                                {customer.email}
                                            </div>
                                        )}
                                        <div className="col-span-2 pt-2 border-t border-gray-50 mt-1 flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Outstanding</span>
                                            <span className={`font-medium ${customer.outstanding_amount && parseFloat(customer.outstanding_amount) > 0 ? "text-red-600" : "text-gray-900"
                                                }`}>
                                                {customer.outstanding_amount ? `₹${customer.outstanding_amount}` : "₹0.00"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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
        </div>
    );
}
