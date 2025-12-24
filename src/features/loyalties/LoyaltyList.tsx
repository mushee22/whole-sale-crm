import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Pagination } from "../../components/ui/pagination";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { createLoyalty, getLoyalties, updateLoyalty, deleteLoyalty, type CreateLoyaltyData, type Loyalty } from "./api/loyalties";
import { LoyaltyForm } from "./components/LoyaltyForm";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

export default function LoyaltyList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLoyalty, setEditingLoyalty] = useState<Loyalty | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: loyaltyData, isLoading } = useQuery({
        queryKey: ['loyalties', page, search],
        queryFn: () => getLoyalties({ page, search, per_page: 15 }),
        placeholderData: (previousData) => previousData,
    });

    const createMutation = useMutation({
        mutationFn: createLoyalty,
        onSuccess: () => {
            setIsFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['loyalties'] });
            toast.success("Loyalty rule created!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to create loyalty rule");
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateLoyalty,
        onSuccess: () => {
            setIsFormOpen(false);
            setEditingLoyalty(null);
            queryClient.invalidateQueries({ queryKey: ['loyalties'] });
            toast.success("Loyalty rule updated!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to update loyalty rule");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLoyalty,
        onSuccess: () => {
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['loyalties'] });
            toast.success("Loyalty rule deleted!");
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to delete loyalty rule");
        }
    });

    const handleSubmit = (formData: CreateLoyaltyData) => {
        if (editingLoyalty) {
            updateMutation.mutate({ id: editingLoyalty.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const openEdit = (loyalty: Loyalty) => {
        setEditingLoyalty(loyalty);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingLoyalty(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Points Rules</CardTitle>
                        <p className="text-sm text-gray-500">Manage point earning rules for products.</p>
                    </div>
                </CardHeader>

                <CardContent className="p-0 border-t border-gray-100">
                    <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                        <div className="relative w-full sm:w-72">
                            <Input
                                placeholder="Search by product..."
                                className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-all"
                                value={search}
                                onChange={handleSearch}
                            />
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        {user?.role !== 'staff' && (
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all" onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Add Rule
                            </Button>
                        )}
                    </div>

                    {isLoading && !loyaltyData ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading rules...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="w-[100px] uppercase tracking-wider text-xs font-semibold text-gray-500 pl-6">ID</TableHead>
                                            <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Product</TableHead>
                                            <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Points</TableHead>
                                            <TableHead className="uppercase tracking-wider text-xs font-semibold text-gray-500">Status</TableHead>
                                            <TableHead className="text-right uppercase tracking-wider text-xs font-semibold text-gray-500 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loyaltyData?.data.map((loyalty) => (
                                            <TableRow key={loyalty.id} className="group hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{loyalty.id}</TableCell>
                                                <TableCell className="font-medium text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span>{loyalty.product ? loyalty.product.name : `Product #${loyalty.product_id}`}</span>
                                                        {loyalty.product && <span className="text-xs text-gray-400 font-normal">{loyalty.product.sku}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                                        {loyalty.points} pts
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${loyalty.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}>
                                                        {loyalty.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1">
                                                        {user?.role !== 'staff' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => openEdit(loyalty)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => setDeleteId(loyalty.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {loyaltyData?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                                    No loyalty rules found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Pagination
                                    currentPage={loyaltyData?.current_page || 1}
                                    totalPages={loyaltyData?.last_page || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingLoyalty(null);
                }}
                title={editingLoyalty ? "Edit Points Rule" : "Add Points Rule"}
            >
                <LoyaltyForm
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    initialData={editingLoyalty}
                />
            </Modal>

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm font-medium">This action cannot be undone.</p>
                    </div>
                    <p className="text-gray-600">
                        Are you sure you want to delete this loyalty rule?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Rule"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
