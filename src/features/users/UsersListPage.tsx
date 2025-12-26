import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser, type User, type CreateUserData } from "./api/users";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { AlertDialog } from "../../components/ui/alert-dialog";
import { Pagination } from "../../components/ui/pagination";
import { Plus, Pencil, Trash2, User as UserIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import UserForm from "./components/UserForm";

export default function UsersListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users', page],
        queryFn: () => getUsers({ page, per_page: 15 }),
    });

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsFormOpen(false);
            toast.success("Staff member added successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add staff member");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserData> }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsFormOpen(false);
            setEditingUser(null);
            toast.success("Staff member updated successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update staff member");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteId(null);
            toast.success("Staff member deleted successfully!");
        },
        onError: () => {
            toast.error("Failed to delete staff member");
        }
    });

    const handleSubmit = (data: CreateUserData) => {
        // If password is empty string during update, undefined it so it's not sent or handled by API logic if needed
        // But our schema handles it.
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Staff Management</CardTitle>
                        <p className="text-sm text-gray-500">Manage system users and access.</p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Staff
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading staff...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {usersData?.data.map((user) => (
                                    <div key={user.id} className="p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <UserIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-slate-500">#{user.id} • {user.email}</div>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                                {user.role}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm text-gray-500 pt-1">
                                            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-slate-600 border-slate-200 hover:bg-slate-50"
                                                onClick={() => navigate(`/staff/${user.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> Details
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => openEdit(user)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => setDeleteId(user.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="w-[80px] font-semibold text-gray-600 pl-6">ID</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Email</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Role</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Joined Date</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersData?.data.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{user.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <UserIcon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium text-slate-900">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">{user.email}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => navigate(`/staff/${user.id}`)}
                                                            title="View Staff Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => openEdit(user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeleteId(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {usersData?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                    No staff members found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Pagination
                                    currentPage={usersData?.current_page || 1}
                                    totalPages={usersData?.last_page || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingUser ? "Edit Staff Member" : "Add Staff Member"}
            >
                <UserForm
                    onSubmit={handleSubmit}
                    initialData={editingUser}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    onCancel={() => setIsFormOpen(false)}
                />
            </Modal>

            <AlertDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete User"
                description="Are you sure you want to delete this staff member? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
