import { z } from "zod";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://13.62.76.231/api";

// Zod Schema
export const rewardSchema = z.object({
    reward_name: z.string().min(1, "Reward name is required"),
    required_points: z.number().min(0, "Points must be at least 0"),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

export type RewardFormData = z.infer<typeof rewardSchema>;

// Interfaces
export interface Reward {
    id: number;
    reward_name: string;
    required_points: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RewardsResponse {
    current_page: number;
    data: Reward[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

// API Functions
export async function getRewards(params?: {
    search?: string;
    is_active?: boolean;
    per_page?: number;
    page?: number;
}): Promise<RewardsResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/admin/rewards`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            search: params?.search || "",
            is_active: params?.is_active,
            per_page: params?.per_page || 15,
            page: params?.page || 1,
        },
    });
    return response.data;
}

export async function getReward(id: number): Promise<Reward> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/admin/rewards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function createReward(data: RewardFormData): Promise<Reward> {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/admin/rewards`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function updateReward(id: number, data: RewardFormData): Promise<Reward> {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/admin/rewards/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function deleteReward(id: number): Promise<void> {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/admin/rewards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}
