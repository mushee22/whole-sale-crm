import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Gift, Medal, Power, Trash2, Zap, Download } from "lucide-react";
import { toPng } from 'html-to-image';
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import {
    activateLoyaltySystem,
    deactivateLoyaltySystem,
    getLoyaltySystemProgress,
    type LoyaltySystem
} from "../api/loyalty";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LoyaltySystemCardProps {
    system: LoyaltySystem;
    customerName: string;
    onEdit: (system: LoyaltySystem) => void;
    onDelete: (id: number) => void;
}

export function LoyaltySystemCard({ system, customerName, onEdit, onDelete }: LoyaltySystemCardProps) {
    const queryClient = useQueryClient();
    const cardRef = useRef<HTMLDivElement>(null);

    const { data: progressData } = useQuery({
        queryKey: ['loyalty-progress', system.id],
        queryFn: () => getLoyaltySystemProgress(system.id),
        enabled: system.is_active
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) =>
            isActive ? deactivateLoyaltySystem(id) : activateLoyaltySystem(id),
        onSuccess: () => {
            toast.success("Status updated");
            queryClient.invalidateQueries({ queryKey: ['loyalty-systems'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty-progress', system.id] });
        },
        onError: () => toast.error("Failed to update status")
    });

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;

        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `loyalty-card-${system.id}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Loyalty card downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download image");
        }
    };

    // Calculated stats for the card
    const totalSpend = progressData?.total_spend || 0;
    const progressPercentage = system.type === 'amount' && system.amount_tiers && system.amount_tiers.length > 0
        ? Math.min((totalSpend / system.amount_tiers[system.amount_tiers.length - 1].threshold_amount) * 100, 100)
        : 0;

    return (
        <>
            {/* Hidden Premium Card for Export */}
            <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                <div ref={cardRef} className="w-[800px] h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-8 rounded-xl shadow-2xl relative overflow-hidden font-sans flex flex-col justify-between">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                    <div>
                        {/* Header */}
                        <div className="flex justify-between items-start relative z-10 mb-8">
                            <div>
                                <div className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Loyalty Member</div>
                                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {customerName}
                                </h2>
                            </div>
                            <div className="text-right">
                                <div className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Company</div>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                    <Medal className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                                    Wholesale Club
                                </div>
                            </div>
                        </div>

                        {/* Main Stats */}
                        <div className="relative z-10 mb-8">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Current Progress</div>
                                    {system.type === 'amount' ? (
                                        <div className="text-6xl font-bold text-white tracking-tight">
                                            ₹{totalSpend.toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="text-5xl font-bold text-white">Product Goal</div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Milestones Grid */}
                        <div className="relative z-10">
                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Milestones & Rewards</div>
                            <div className="grid grid-cols-3 gap-3">
                                {system.type === 'amount' && system.amount_tiers?.map((tier, idx) => {
                                    const isAchieved = (totalSpend >= tier.threshold_amount);
                                    return (
                                        <div key={idx} className={`p-4 rounded-lg border ${isAchieved ? 'bg-white/10 border-green-500/50' : 'bg-white/5 border-white/10'} backdrop-blur-sm relative overflow-hidden group`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-lg font-bold ${isAchieved ? 'text-green-400' : 'text-gray-400'}`}>₹{tier.threshold_amount}</span>
                                                {isAchieved && <Zap className="h-5 w-5 text-green-400 fill-green-400" />}
                                            </div>
                                            <div className={`text-sm ${isAchieved ? 'text-white' : 'text-gray-500'}`}>
                                                {tier.reward_quantity} x {tier.reward_product?.name || `Product`}
                                            </div>
                                            {isAchieved && <div className="absolute inset-0 bg-green-500/10"></div>}
                                        </div>
                                    );
                                })}

                                {system.type === 'product' && system.product_targets?.map((target, idx) => {
                                    const progress = progressData?.product_progress?.find(p => p.product_target_id === target.id || p.product_id === target.product_id);
                                    const currentQty = progress?.achieved || 0;
                                    const isAchieved = currentQty >= target.target_quantity;

                                    return (
                                        <div key={idx} className={`p-4 rounded-lg border ${isAchieved ? 'bg-white/10 border-green-500/50' : 'bg-white/5 border-white/10'} backdrop-blur-sm relative overflow-hidden`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-lg font-bold ${isAchieved ? 'text-green-400' : 'text-gray-400'}`}>{currentQty} / {target.target_quantity}</span>
                                                {isAchieved && <Zap className="h-5 w-5 text-green-400 fill-green-400" />}
                                            </div>
                                            <div className={`text-sm ${isAchieved ? 'text-white' : 'text-gray-500'} truncate`}>
                                                {target.product?.name || `Product`}
                                            </div>
                                            {target.reward_quantity > 0 && (
                                                <div className={`text-xs mt-1 flex items-center gap-1 ${isAchieved ? 'text-green-200' : 'text-gray-600'}`}>
                                                    <Gift className="h-3 w-3" />
                                                    Reward: {target.reward_quantity} × {target.reward_product?.name || 'Item'}
                                                </div>
                                            )}
                                            {isAchieved && <div className="absolute inset-0 bg-green-500/10"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-10 mt-auto">
                        <div className="flex items-center gap-2 opacity-60">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">Valid Until: {system.expires_at ? new Date(system.expires_at).toLocaleDateString() : 'Forever'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Card className={`border-l-4 shadow-sm ${system.is_active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <Badge variant={system.type === 'product' ? 'default' : 'secondary'} className="capitalize">
                            {system.type} Based
                        </Badge>
                        <Badge variant="outline" className={`
                        ${system.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}
                    `}>
                            {system.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg pt-2 flex items-center gap-2">
                        <Medal className="h-5 w-5 text-yellow-500" />
                        {system.type === 'product' ? 'Product Goal' : 'Sales Target'}
                    </CardTitle>
                    <CardDescription className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Duration: {system.duration_days} days
                        </span>
                        {system.activated_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Activated: {new Date(system.activated_at).toLocaleDateString()}
                            </span>
                        )}
                        {system.expires_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-red-400" />
                                Expires: {new Date(system.expires_at).toLocaleDateString()}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-md space-y-4 text-sm">
                        {/* Progress Display */}
                        {system.is_active && progressData && (
                            <div className="border-b border-slate-200 pb-4">
                                {system.type === 'amount' && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spend</span>
                                        <span className="text-2xl font-bold text-slate-900">₹{progressData.total_spend || 0}</span>
                                    </div>
                                )}

                                {/* Show Unlocked Rewards Summary if any */}
                                {progressData.reward_claims && progressData.reward_claims.length > 0 && (
                                    <div className="mt-3">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2 block">Unlocked Rewards</span>
                                        <div className="space-y-2">
                                            {progressData.reward_claims.map((claim) => (
                                                <div key={claim.id} className="bg-green-50 border border-green-200 rounded p-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="h-4 w-4 text-green-600" />
                                                        <span className="font-medium text-green-800">
                                                            {claim.reward_quantity} x {claim.reward_product_name}
                                                        </span>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 h-5">
                                                        Unlocked
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {system.type === 'product' && system.product_targets && (
                            <div>
                                <p className="font-medium text-slate-700 mb-2">Targets:</p>
                                <ul className="space-y-2">
                                    {system.product_targets.map((t, idx) => {
                                        const progress = progressData?.product_progress?.find(p => p.product_target_id === t.id || p.product_id === t.product_id);
                                        const isCompleted = progress && (progress.achieved >= t.target_quantity);

                                        return (
                                            <li key={idx} className={`flex justify-between items-center p-2 rounded border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                                                <div className="flex flex-col">
                                                    <span className={isCompleted ? 'text-green-800 font-medium' : 'text-slate-600'}>
                                                        Buy {t.target_quantity} x {t.product?.name || `Product #${t.product_id}`}
                                                    </span>
                                                    {t.reward_quantity > 0 && (
                                                        <span className="text-xs text-slate-500">
                                                            Reward: {t.reward_quantity} × {t.reward_product?.name || `Item`}
                                                        </span>
                                                    )}
                                                </div>
                                                {system.is_active && progress && (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                            {progress.achieved || 0} / {t.target_quantity}
                                                        </span>
                                                        {isCompleted && <Zap className="h-4 w-4 text-green-500 fill-green-500" />}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {system.type === 'amount' && system.amount_tiers && (
                            <div>
                                <p className="font-medium text-slate-700 mb-2">Milestones:</p>
                                <ul className="space-y-2">
                                    {system.amount_tiers.map((tier, idx) => {
                                        // Check unlock status from progress data tiers
                                        const progressTier = progressData?.tiers?.find(t => t.threshold_amount === tier.threshold_amount);
                                        const isAchieved = progressTier?.unlocked || (progressData?.total_spend || 0) >= tier.threshold_amount;

                                        return (
                                            <li key={idx} className={`relative overflow-hidden flex flex-col p-3 rounded-md border transition-all ${isAchieved ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                <div className="flex justify-between items-center z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isAchieved ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            {isAchieved ? <Zap className="h-3.5 w-3.5 fill-current" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                                        </div>
                                                        <span className={`font-medium ${isAchieved ? 'text-green-800' : 'text-slate-700'}`}>
                                                            Spend ₹{tier.threshold_amount}
                                                        </span>
                                                    </div>
                                                    {isAchieved && (
                                                        <Badge variant="outline" className="bg-white border-green-200 text-green-700">Achieved</Badge>
                                                    )}
                                                </div>

                                                <div className="mt-2 pl-8 flex items-center gap-1.5">
                                                    <Gift className={`h-3.5 w-3.5 ${isAchieved ? 'text-green-600' : 'text-purple-500'}`} />
                                                    <span className={`text-sm ${isAchieved ? 'text-green-700' : 'text-slate-600'}`}>
                                                        Get <strong>{tier.reward_quantity}</strong> x {tier.reward_product?.name || `#${tier.reward_product_id}`}
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={handleDownloadImage}
                        >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({ id: system.id, isActive: system.is_active })}
                            disabled={toggleStatusMutation.isPending}
                        >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {system.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(system)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(system.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
