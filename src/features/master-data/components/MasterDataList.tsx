// Fixed import source
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "../../../components/ui/card";
import { MasterDataForm } from "./MasterDataForm";
import { type MasterDataItem } from "../types";
import { toast } from "sonner";


export interface Column {
    header: string;
    accessorKey?: string;
    cell?: (item: any) => React.ReactNode;
    className?: string;
}

interface MasterDataListProps {
    title: string;
    queryKey: string;
    fetchFn: () => Promise<MasterDataItem[]>;
    createFn: (data: any) => Promise<MasterDataItem>;
    updateFn: (id: number | string, data: any) => Promise<MasterDataItem>;
    deleteFn: (id: number | string) => Promise<void>;
    FormComponent?: React.ComponentType<any>;
    columns?: Column[];
}

export function MasterDataList({ title, queryKey, fetchFn, createFn, updateFn, deleteFn, FormComponent = MasterDataForm, columns }: MasterDataListProps) {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: [queryKey],
        queryFn: fetchFn
    });

    const createMutation = useMutation({
        mutationFn: createFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setIsFormOpen(false);
            toast.success(`${title} created successfully`);
        },
        onError: () => toast.error(`Failed to create ${title.toLowerCase()}`),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: any }) => updateFn(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setIsFormOpen(false);
            setEditingItem(null);
            toast.success(`${title} updated successfully`);
        },
        onError: () => toast.error(`Failed to update ${title.toLowerCase()}`),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setDeleteId(null);
            toast.success(`${title} deleted successfully`);
        },
        onError: () => toast.error(`Failed to delete ${title.toLowerCase()}`),
    });

    const handleSubmit = (data: any) => {
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const openEdit = (item: MasterDataItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-4">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <CardTitle className="text-lg font-bold">{title}</CardTitle>
                    <Button size="sm" onClick={openCreate} className="bg-slate-900 text-white hover:bg-slate-800">
                        <Plus className="mr-2 h-4 w-4" /> Add {title}
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        {columns ? (
                                            columns.map((col, index) => (
                                                <TableHead key={index} className={col.className}>{col.header}</TableHead>
                                            ))
                                        ) : (
                                            <>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Name</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50">
                                            {columns ? (
                                                columns.map((col, index) => (
                                                    <TableCell key={index} className={col.className}>
                                                        {col.cell ? col.cell(item) : (col.accessorKey ? item[col.accessorKey as keyof typeof item] : null)}
                                                    </TableCell>
                                                ))
                                            ) : (
                                                <>
                                                    <TableCell className="font-mono text-xs text-gray-500">#{item.id}</TableCell>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => openEdit(item)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => setDeleteId(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={columns ? columns.length + 1 : 3} className="h-24 text-center text-gray-400">
                                                No {title.toLowerCase()}s found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingItem ? `Edit ${title}` : `Add New ${title}`}
            >
                <FormComponent
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    initialData={editingItem}
                    onCancel={() => setIsFormOpen(false)}
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
                        Are you sure you want to delete this {title.toLowerCase()}?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
