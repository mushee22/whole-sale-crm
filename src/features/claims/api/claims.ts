import { api } from "../../../lib/api";
import { z } from "zod";

export const createClaimSchema = z.object({
    customer_id: z.number().min(1, "Customer is required"),
    reward_ids: z.array(z.number()).min(1, "At least one reward is required"),
    remarks: z.string().optional(),
});

export type CreateClaimData = z.infer<typeof createClaimSchema>;

export interface Claim {
    id: number;
    customer_id: number;
    customer: {
        id: number;
        name: string;
        phone: string;
        unique_id: string;
        total_earned_points: number;
        total_referral_points: number;
        total_used_points: number;
    };
    points_used: number;
    remarks: string | null;
    status: string;
    rewards: {
        id: number;
        reward_name?: string;
        required_points: number;
        product_id: number;
        product?: {
            name: string;
            image: string | null; // API response seems to have 'image' here based on user input
        };
        pivot: {
            points_used: number;
        }
    }[];
    created_at: string;
}

export interface ClaimsListResponse {
    current_page: number;
    data: Claim[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface GetClaimsParams {
    page?: number;
    search?: string;
    status?: string;
    per_page?: number;
}

export const getClaims = async (params: GetClaimsParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await api.get<ClaimsListResponse>(`/admin/claims?${queryParams.toString()}`);
    return response.data;
};

export const createClaim = async (data: CreateClaimData) => {
    const response = await api.post("/admin/claims", data);
    return response.data;
};
