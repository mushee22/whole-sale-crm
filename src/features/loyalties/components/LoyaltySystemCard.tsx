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
    claimLoyaltyReward,
    type LoyaltySystem
} from "../api/loyalty";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PermissionGuard } from "../../../hooks/usePermission";

interface LoyaltySystemCardProps {
    system: LoyaltySystem;
    customerName: string; // Keeping prop as it might be required by parent, but stripping usage if lint complains about unused prop, or we can just ignore it or use it. Actually wait, let's keep it to say whose card it is?
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

    const claimMutation = useMutation({
        mutationFn: (claimId: number) => claimLoyaltyReward(claimId),
        onSuccess: () => {
            toast.success("Reward claimed successfully");
            queryClient.invalidateQueries({ queryKey: ['loyalty-progress', system.id] });
        },
        onError: () => toast.error("Failed to claim reward")
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

    return (
        <>
            {/* Hidden Premium Card for Export */}
            <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                <div ref={cardRef} className="w-[950px] min-h-[500px] bg-white text-slate-900 p-8 rounded-xl shadow-lg relative font-sans flex flex-col justify-start border border-slate-200">
                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className={system.is_active ? "text-slate-900" : "text-slate-500"}>Active:</span>
                                <span className="text-slate-900">{system.is_active ? 'Yes' : 'No'}</span>
                            </h2>
                            <div className="text-sm text-slate-500 font-medium">
                                Member: <span className="text-slate-900">{customerName}</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Each row: {system.type === 'amount' ? 'spend milestone' : 'target product to buy'}, {system.type === 'amount' ? 'milestone amount' : 'target quantity'} to reach, {system.type === 'amount' ? 'spend achieved' : 'quantity achieved'}, remaining to target, and reward when target is met.
                        </p>

                        {/* Milestones / Targets Table */}
                        <div className="mb-8">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-transparent">{system.type === 'amount' ? 'Milestone' : 'Target product'}</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">{system.type === 'amount' ? 'Target amount' : 'Target qty'}</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">{system.type === 'amount' ? 'Achieved amount' : 'Achieved qty'}</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">Remaining to Target</th>
                                        <th className="px-4 py-3 border-b border-transparent pl-8">Reward Name</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">Earned</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">Claimed</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">Remaining to Claim</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {system.type === 'amount' && system.amount_tiers?.map((tier, idx) => {
                                        const achieved = totalSpend;
                                        const remaining = Math.max(0, tier.threshold_amount - totalSpend);

                                        // Calculate claims based on amount tier
                                        const tierClaims = progressData?.reward_claims?.filter(c => c.loyalty_system_amount_tier_id === tier.id) || [];
                                        const earnedNum = tierClaims.reduce((acc, c) => acc + c.reward_quantity, 0);
                                        const claimedNum = tierClaims.filter(c => c.is_claimed).reduce((acc, c) => acc + c.reward_quantity, 0);
                                        const remainingClaimNum = tierClaims.filter(c => !c.is_claimed).reduce((acc, c) => acc + c.reward_quantity, 0);

                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-4 text-slate-900 font-medium whitespace-nowrap">Spend ₹{tier.threshold_amount.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">₹{tier.threshold_amount.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">₹{achieved.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">₹{remaining.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-slate-900 font-medium pl-8">{tier.reward_product?.name || `Product`}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{earnedNum || '-'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{claimedNum || '-'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{remainingClaimNum || '-'}</td>
                                            </tr>
                                        );
                                    })}

                                    {system.type === 'product' && system.product_targets?.map((target, idx) => {
                                        // Find all progress items for this product
                                        const progressItems = progressData?.product_progress?.filter(p => p.product_id === target.product_id) || [];
                                        const achieved = progressItems.reduce((acc, p) => acc + p.achieved, 0);
                                        const remaining = Math.max(0, target.target_quantity - achieved);

                                        // Calculate claims based on product target
                                        const targetClaims = progressData?.reward_claims?.filter(c => c.loyalty_system_product_target_id === target.id) || [];
                                        const earnedNum = targetClaims.reduce((acc, c) => acc + c.reward_quantity, 0);
                                        const claimedNum = targetClaims.filter(c => c.is_claimed).reduce((acc, c) => acc + c.reward_quantity, 0);
                                        const remainingClaimNum = targetClaims.filter(c => !c.is_claimed).reduce((acc, c) => acc + c.reward_quantity, 0);

                                        // Find corresponding reward product name
                                        // The api returns target.reward_product ? .name or progress?.reward_product?.name
                                        const rewardName = target.reward_product?.name || progressItems[0]?.reward_product?.name || 'Item';

                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-4 text-slate-900 font-medium whitespace-nowrap">{target.product?.name || 'Product'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{target.target_quantity}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{achieved}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{remaining}</td>
                                                <td className="px-4 py-4 text-slate-900 font-medium pl-8">{target.reward_quantity > 0 ? rewardName : '-'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{earnedNum || '-'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{claimedNum || '-'}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{remainingClaimNum || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {/* bottom border matching the image style roughly */}
                            <div className="border-b border-slate-200"></div>
                        </div>

                        {/* Rewards Table */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Rewards</h3>
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-transparent">Reward</th>
                                        <th className="px-4 py-3 border-b border-transparent text-right">Qty</th>
                                        <th className="px-4 py-3 border-b border-transparent pl-8">Status</th>
                                        <th className="px-4 py-3 border-b border-transparent">Claimed at</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {progressData?.reward_claims && progressData.reward_claims.length > 0 ? (
                                        progressData.reward_claims.map((claim, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-4 text-slate-900 font-medium">{claim.reward_product_name || `Product #${claim.reward_product_id}`}</td>
                                                <td className="px-4 py-4 text-slate-900 text-right font-medium">{claim.reward_quantity}</td>
                                                <td className="px-4 py-4 text-slate-900 font-medium pl-8">
                                                    {claim.is_claimed ? 'Claimed' : 'Unlocked (not claimed)'}
                                                </td>
                                                <td className="px-4 py-4 text-slate-900 font-medium">
                                                    {claim.is_claimed && claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-4 text-slate-500 text-center italic">No rewards unlocked yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* bottom border matching the image style roughly */}
                            <div className="border-b border-slate-200"></div>
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
                                                <div key={claim.id} className="bg-green-50 border border-green-200 rounded p-2 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="h-4 w-4 text-green-600 shrink-0" />
                                                        <span className="font-medium text-green-800">
                                                            {claim.reward_quantity} x {claim.reward_product_name || `Product #${claim.reward_product_id}`}
                                                        </span>
                                                    </div>

                                                    {!claim.is_claimed ? (
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white shrink-0"
                                                            onClick={() => claimMutation.mutate(claim.id)}
                                                            disabled={claimMutation.isPending}
                                                        >
                                                            {claimMutation.isPending ? 'Claiming...' : 'Claim Reward'}
                                                        </Button>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 h-5 shrink-0">
                                                            Claimed
                                                        </Badge>
                                                    )}
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
                        <PermissionGuard module="loyalties" action="update">
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
                        </PermissionGuard>
                        <PermissionGuard module="loyalties" action="delete">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDelete(system.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </PermissionGuard>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
