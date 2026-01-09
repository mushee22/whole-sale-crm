import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../api/roles";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Pagination } from "../../../components/ui/pagination";
import { Plus, Shield } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function RolesListPage() {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    // Hardcoded per_page as per user request example url showing per_page=15
    const { data, isLoading } = useQuery({
        queryKey: ['roles', page],
        queryFn: () => getRoles({ page, per_page: 15 }),
    });

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Roles & Permissions
                        </CardTitle>
                        <p className="text-sm text-gray-500">Manage system roles and their access levels.</p>
                    </div>
                    <Button
                        onClick={() => navigate("/roles/create")}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Role
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading roles...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {data?.data.map((role) => (
                                    <div key={role.id} className="p-4 space-y-2 bg-white">
                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-gray-900">{role.name}</div>
                                            <div className="text-xs text-slate-500">ID: {role.id}</div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {Array.isArray(role.permissions)
                                                ? `${role.permissions.length} permissions`
                                                : 'No permissions'}
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
                                            <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Permissions Count</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Created At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.data.map((role) => (
                                            <TableRow key={role.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{role.id}</TableCell>
                                                <TableCell className="font-medium text-slate-900">{role.name}</TableCell>
                                                <TableCell className="text-slate-600">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-sm">
                                                    {new Date(role.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-gray-400">
                                                    No roles found.
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
