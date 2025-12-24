import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { createClaim, createClaimSchema, type CreateClaimData } from "./api/claims";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Trash2, Search, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getCustomers, type Customer } from "../customers/api/customers";
import { getRewards, type Reward } from "../rewards/api/rewards";
import { Badge } from "../../components/ui/badge";

// --- Components ---

interface CustomerSelectProps {
    onSelect: (customer: Customer) => void;
    selectedCustomer: Customer | null;
}

function CustomerSelect({ onSelect, selectedCustomer }: CustomerSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: customersData } = useQuery({
        queryKey: ['customers', 'autocomplete', search],
        queryFn: () => getCustomers({ search, per_page: 5 }),
        enabled: open,
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        setSearch("");
        setOpen(false);
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>
            <Label>Select Customer</Label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by name or phone..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                />

                {open && customersData?.data && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {customersData.data.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">No customers found</div>
                        ) : (
                            <ul className="py-1">
                                {customersData.data.map((customer) => (
                                    <li
                                        key={customer.id}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                        onClick={() => handleSelect(customer)}
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900">{customer.name}</div>
                                            <div className="text-xs text-slate-500">{customer.phone}</div>
                                        </div>
                                        <div className="text-xs font-semibold text-green-600">
                                            {/* Calculate Available Points */}
                                            {(customer.total_earned_points + (customer.total_referral_points || 0) - customer.total_used_points)} pts
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {selectedCustomer && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-slate-900">{selectedCustomer.name}</div>
                        <div className="text-sm text-slate-500">{selectedCustomer.phone}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">Available Balance</div>
                        <div className="text-2xl font-bold text-green-600">
                            {(selectedCustomer.total_earned_points + (selectedCustomer.total_referral_points || 0) - selectedCustomer.total_used_points)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface RewardSelectProps {
    onSelect: (reward: Reward) => void;
    currentPoints: number; // To disable if too expensive? Or just show warning. The requirements say "can only select based on points earned"
    // Actually we will validate globally, but visually showing affordable is good.
    pointsRemaining: number;
}

function RewardSelect({ onSelect, pointsRemaining }: RewardSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: rewardsData } = useQuery({
        queryKey: ['rewards', 'autocomplete', search],
        queryFn: () => getRewards({ search, is_active: true, per_page: 10 }),
        enabled: open,
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search rewards..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                />
            </div>

            {open && rewardsData?.data && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {rewardsData.data.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No rewards found</div>
                    ) : (
                        <ul className="py-1">
                            {rewardsData.data.map((reward) => {
                                const canAfford = reward.required_points <= pointsRemaining;

                                return (
                                    <li
                                        key={reward.id}
                                        className={`px-3 py-2 text-sm flex justify-between items-center border-b border-gray-50 last:border-0 ${canAfford ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-50'
                                            }`}
                                        onClick={() => {
                                            if (canAfford) {
                                                onSelect(reward);
                                                setOpen(false);
                                                setSearch("");
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {reward.product?.image_url || reward.image ? (
                                                    <img src={reward.product?.image_url || reward.image || ""} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-[10px] text-gray-500">N/A</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{reward.reward_name || reward.product?.name}</div>
                                                <div className="text-xs text-slate-500">Points: {reward.required_points}</div>
                                            </div>
                                        </div>
                                        <div>
                                            {!canAfford && <span className="text-xs text-red-500 font-medium mr-2">Insufficient Pts</span>}
                                            <Badge variant={canAfford ? "outline" : "secondary"} className={canAfford ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                                {reward.required_points}
                                            </Badge>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}


export default function CreateClaimPage() {
    const navigate = useNavigate();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateClaimData>({
        resolver: zodResolver(createClaimSchema),
        defaultValues: {
            reward_ids: []
        }
    });

    const mutation = useMutation({
        mutationFn: createClaim,
        onSuccess: () => {
            toast.success("Rewards claimed successfully!");
            navigate(`/customers/${selectedCustomer?.id}`); // Or to claims list if we had one
        },
        onError: (error: any) => {
            toast.error("Failed to claim rewards");
            console.error(error);
        }
    });

    // Helper: Calculate customer balance
    const customerBalance = selectedCustomer
        ? (selectedCustomer.total_earned_points + (selectedCustomer.total_referral_points || 0) - selectedCustomer.total_used_points)
        : 0;

    // Helper: Calculate total cost of selected rewards
    const totalCost = selectedRewards.reduce((sum, r) => sum + r.required_points, 0);

    // Helper: Remaining points
    const remainingPoints = customerBalance - totalCost;

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setValue("customer_id", customer.id);
        // Clear rewards if customer changes? Maybe safer.
        setSelectedRewards([]);
        setValue("reward_ids", []);
    };

    const handleAddReward = (reward: Reward) => {
        const newRewards = [...selectedRewards, reward];
        setSelectedRewards(newRewards);
        setValue("reward_ids", newRewards.map(r => r.id));
    };

    const handleRemoveReward = (index: number) => {
        const newRewards = [...selectedRewards];
        newRewards.splice(index, 1);
        setSelectedRewards(newRewards);
        setValue("reward_ids", newRewards.map(r => r.id));
    };

    const onSubmit = (data: CreateClaimData) => {
        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return;
        }
        if (remainingPoints < 0) {
            toast.error("Insufficient points balance");
            return;
        }
        mutation.mutate(data);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" className="pl-0 hover:bg-transparent -ml-2 mb-2 text-slate-500" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Claim Rewards</h1>
                    <p className="text-slate-500 mt-1">Process a reward redemption for a customer.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">1. Select Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CustomerSelect
                            onSelect={handleCustomerSelect}
                            selectedCustomer={selectedCustomer}
                        />
                        <input type="hidden" {...register("customer_id", { valueAsNumber: true })} />
                        {errors.customer_id && <p className="text-sm text-red-500 mt-1">{errors.customer_id.message}</p>}
                    </CardContent>
                </Card>

                {selectedCustomer && (
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">2. Select Rewards</CardTitle>
                            <div className={`text-sm font-medium ${remainingPoints < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                Remaining Points: <span className="font-bold">{remainingPoints}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RewardSelect
                                onSelect={handleAddReward}
                                pointsRemaining={remainingPoints}
                                currentPoints={customerBalance}
                            />

                            <div className="space-y-2 mt-4">
                                {selectedRewards.map((reward, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {reward.product?.image_url || reward.image ? (
                                                    <img src={reward.product?.image_url || reward.image || ""} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-[10px] text-gray-500">N/A</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{reward.reward_name || reward.product?.name}</div>
                                                <div className="text-xs text-slate-500">Required Points: <span className="font-semibold text-amber-600">{reward.required_points}</span></div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-500"
                                            onClick={() => handleRemoveReward(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {selectedRewards.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                        No rewards selected yet.
                                    </div>
                                )}
                            </div>

                            <div className="border-b border-gray-100 my-4" />

                            <div className="flex justify-between items-center pt-2">
                                <span className="font-medium text-slate-700">Total Points to Redeem</span>
                                <span className="text-xl font-bold text-slate-900">{totalCost} pts</span>
                            </div>
                            <input type="hidden" {...register("reward_ids")} />
                            {errors.reward_ids && <p className="text-sm text-red-500 mt-1">{errors.reward_ids.message}</p>}
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">3. Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="remarks">Optional Remarks</Label>
                            <Input id="remarks" placeholder="Notes about this claim..." {...register("remarks")} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        size="lg"
                        className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px]"
                        disabled={mutation.isPending || (!!selectedCustomer && remainingPoints < 0)}
                    >
                        {mutation.isPending ? "Processing Claim..." : "Confirm & Claim Rewards"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
