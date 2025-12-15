import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rewardSchema, type RewardFormData, type Reward } from "../api/rewards";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";

interface RewardFormProps {
    onSubmit: (data: RewardFormData) => void;
    initialData?: Reward | null;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function RewardForm({ onSubmit, initialData, isLoading, onCancel }: RewardFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<RewardFormData>({
        resolver: zodResolver(rewardSchema),
        defaultValues: {
            reward_name: initialData?.reward_name || "",
            required_points: initialData?.required_points || 0,
            description: initialData?.description || "",
            is_active: initialData?.is_active ?? true,
        },
    });

    const isActive = watch("is_active");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="reward_name">Reward Name *</Label>
                <Input
                    id="reward_name"
                    {...register("reward_name")}
                    placeholder="e.g., Free Coffee"
                />
                {errors.reward_name && (
                    <p className="text-sm text-red-500">{errors.reward_name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="required_points">Required Points *</Label>
                <Input
                    id="required_points"
                    type="number"
                    min="0"
                    {...register("required_points", { valueAsNumber: true })}
                    placeholder="e.g., 500"
                />
                {errors.required_points && (
                    <p className="text-sm text-red-500">{errors.required_points.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe the reward..."
                    rows={3}
                />
                {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_active"
                    checked={isActive}
                    onCheckedChange={(checked: boolean) => setValue("is_active", checked)}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white">
                    {isLoading ? "Saving..." : initialData ? "Update Reward" : "Create Reward"}
                </Button>
            </div>
        </form>
    );
}
