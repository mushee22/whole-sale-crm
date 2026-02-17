import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomer } from "../api/customers";
import {
    getCustomerLoyaltySystems,
    deleteLoyaltySystem,
    type LoyaltySystem
} from "../../loyalties/api/loyalty";
import { LoyaltySystemForm } from "../../loyalties/components/LoyaltySystemForm";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { toast } from "sonner";
import { ArrowLeft, Plus, Medal } from "lucide-react";
import { PermissionGuard } from "../../../hooks/usePermission";
import { LoyaltySystemCard } from "../../loyalties/components/LoyaltySystemCard";

export default function CustomerLoyaltyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const customerId = Number(id);
    const queryClient = useQueryClient();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSystem, setEditingSystem] = useState<LoyaltySystem | undefined>(undefined);

    const { data: customer } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomer(customerId),
        enabled: !!customerId
    });

    const { data: loyaltySystems, isLoading } = useQuery({
        queryKey: ['loyalty-systems', customerId],
        queryFn: () => getCustomerLoyaltySystems(customerId),
        enabled: !!customerId
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLoyaltySystem,
        onSuccess: () => {
            toast.success("Loyalty system deleted");
            queryClient.invalidateQueries({ queryKey: ['loyalty-systems', customerId] });
        },
        onError: () => toast.error("Failed to delete system")
    });

    if (!customer) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <PermissionGuard module="loyalties" action="view" showMessage>
            <div className="max-w-5xl mx-auto space-y-6 pb-10 px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-slate-900 w-fit" onClick={() => navigate(`/customers/${customerId}`)}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Customer
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Loyalty Systems</h1>
                        <p className="text-gray-500">Manage reward programs for {customer.name}</p>
                    </div>
                    <PermissionGuard module="loyalties" action="add">
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                            <Plus className="h-4 w-4 mr-2" /> Add System
                        </Button>
                    </PermissionGuard>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading loyalty systems...</div>
                ) : loyaltySystems && loyaltySystems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loyaltySystems.map((system) => (
                            <LoyaltySystemCard
                                key={system.id}
                                system={system}
                                customerName={customer.name}
                                onEdit={(sys) => {
                                    setEditingSystem(sys);
                                    setIsCreateModalOpen(true);
                                }}
                                onDelete={(id) => {
                                    if (confirm("Are you sure you want to delete this system?")) {
                                        deleteMutation.mutate(id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <Medal className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Loyalty Systems</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create a reward program to incentivize {customer.name} to purchase more.</p>
                        <PermissionGuard module="loyalties" action="add">
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white">
                                <Plus className="h-4 w-4 mr-2" /> Create First System
                            </Button>
                        </PermissionGuard>
                    </div>
                )}

                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingSystem(undefined);
                    }}
                    title={editingSystem ? "Edit Loyalty System" : "Create Loyalty System"}
                >
                    <LoyaltySystemForm
                        customerId={customerId}
                        initialData={editingSystem}
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            setEditingSystem(undefined);
                            queryClient.invalidateQueries({ queryKey: ['loyalty-systems', customerId] });
                        }}
                        onCancel={() => {
                            setIsCreateModalOpen(false);
                            setEditingSystem(undefined);
                        }}
                    />
                </Modal>
            </div>
        </PermissionGuard>
    );
}
