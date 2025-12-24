
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRewards, createReward, updateReward, deleteReward, type Reward, type RewardFormData } from "./api/rewards";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import { AlertDialog } from "../../components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import RewardForm from "./components/RewardForm";
import { useAuth } from "../../context/AuthContext";

export default function RewardList() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { user } = useAuth();

    // Fetch rewards
    const { data: rewardsData, isLoading } = useQuery({
        queryKey: ["rewards"],
        queryFn: () => getRewards(),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createReward,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rewards"] });
            setIsFormOpen(false);
            toast.success("Reward created successfully!");
        },
        onError: () => {
            toast.error("Failed to create reward");
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: RewardFormData }) => updateReward(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rewards"] });
            setIsFormOpen(false);
            setEditingReward(null);
            toast.success("Reward updated successfully!");
        },
        onError: () => {
            toast.error("Failed to update reward");
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteReward,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rewards"] });
            setDeleteId(null);
            toast.success("Reward deleted successfully!");
        },
        onError: () => {
            toast.error("Failed to delete reward");
        },
    });

    const handleSubmit = (data: RewardFormData) => {
        if (editingReward) {
            updateMutation.mutate({ id: editingReward.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const openEdit = (reward: Reward) => {
        setEditingReward(reward);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingReward(null);
        setIsFormOpen(true);
    };


    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Rewards</CardTitle>
                        <p className="text-sm text-gray-500">Manage customer rewards and redemption options.</p>
                    </div>
                    {user?.role !== 'staff' && (
                        <Button onClick={openCreate} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Reward
                        </Button>
                    )}
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-500">Loading rewards...</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead className="font-semibold text-gray-600 pl-6">ID</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Reward Name</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Required Points</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rewardsData?.data.map((reward) => (
                                        <TableRow key={reward.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-mono text-xs text-gray-400 pl-6">#{reward.id}</TableCell>
                                            <TableCell className="font-medium text-gray-900">
                                                {reward.reward_name || reward.product?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {reward.required_points} pts
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-xs truncate">
                                                {reward.description || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium ${reward.is_active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                        } `}
                                                >
                                                    {reward.is_active ? "Active" : "Inactive"}
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
                                                                onClick={() => openEdit(reward)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setDeleteId(reward.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {rewardsData?.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                No rewards found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingReward(null);
                }}
                title={editingReward ? "Edit Reward" : "Add Reward"}
            >
                <RewardForm
                    onSubmit={handleSubmit}
                    initialData={editingReward}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingReward(null);
                    }}
                />
            </Modal>

            {/* Delete Confirmation */}
            <AlertDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete Reward"
                description="Are you sure you want to delete this reward? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
