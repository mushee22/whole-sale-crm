import { api } from "../../../lib/api";
import { z } from "zod";

export const createLoyaltySchema = z.object({
    product_id: z.coerce.number().min(1, "Product is required"),
    points: z.coerce.number().min(1, "Points must be positive"),
    is_active: z.boolean().default(true),
    is_show_to_brochure: z.boolean().default(false),
});

export type CreateLoyaltyData = z.infer<typeof createLoyaltySchema>;

export interface Loyalty {
    id: number;
    product_id: number;
    product?: {
        id: number;
        name: string;
        sku: string;
        image_url: string | null;
    };
    points: number;
    is_active: boolean;
    is_show_to_brochure: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoyaltyListResponse {
    current_page: number;
    data: Loyalty[];
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

export interface GetLoyaltiesParams {
    page?: number;
    search?: string;
    is_active?: boolean;
    product_id?: number;
    per_page?: number;
    is_show_to_brochure?: boolean;
}

export const getLoyalties = async (params: GetLoyaltiesParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.product_id) queryParams.append('product_id', params.product_id.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.is_show_to_brochure !== undefined) queryParams.append('is_show_to_brochure', params.is_show_to_brochure.toString());

    const response = await api.get<LoyaltyListResponse>(`admin/loyalties?${queryParams.toString()}`);
    return response.data;
};

export const createLoyalty = async (data: CreateLoyaltyData) => {
    const response = await api.post('admin/loyalties', data);
    return response.data;
};

export const updateLoyalty = async ({ id, data }: { id: number; data: CreateLoyaltyData }) => {
    const response = await api.put(`admin/loyalties/${id}`, data);
    return response.data;
};

export const deleteLoyalty = async (id: number) => {
    const response = await api.delete(`admin/loyalties/${id}`);
    return response.data;
};
