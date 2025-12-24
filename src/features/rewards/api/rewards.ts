import { z } from "zod";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://13.62.76.231/api";

// Zod Schema
// Zod Schema
export const rewardSchema = z.object({
    reward_name: z.string().min(1, "Reward name is required"),
    product_id: z.number().min(1, "Product is required"),
    required_points: z.number().min(0, "Points must be at least 0"),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    is_show_to_brochure: z.boolean().optional(),
});

export type RewardFormData = z.infer<typeof rewardSchema>;

// Interfaces
export interface Reward {
    id: number;
    reward_name?: string; // Optional as per API response
    product_id: number | null;
    required_points: number;
    description: string | null;
    is_active: boolean;
    is_show_to_brochure: boolean;
    whatsapp_no: string | null;
    image: string | null;
    created_at: string;
    updated_at: string;
    product: {
        id: number;
        name: string;
        sku: string;
        price: number;
        discount_price: number;
        stock: number;
        image_url: string | null;
        is_active: boolean;
        is_show_to_brochure: boolean;
    } | null;
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
    is_show_to_brochure?: boolean;
}): Promise<RewardsResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/admin/rewards`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            search: params?.search || "",
            is_active: params?.is_active,
            per_page: params?.per_page || 15,
            page: params?.page || 1,
            is_show_to_brochure: params?.is_show_to_brochure,
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
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value.toString());
            }
        }
    });

    const response = await axios.post(`${API_URL}admin/rewards`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        },
    });
    return response.data;
}

export async function updateReward(id: number, data: RewardFormData): Promise<Reward> {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value.toString());
            }
        }
    });
    formData.append('_method', 'PUT');

    const response = await axios.post(`${API_URL}admin/rewards/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        },
    });
    return response.data;
}

export async function deleteReward(id: number): Promise<void> {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}admin/rewards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}
