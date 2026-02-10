import { api } from "../../../lib/api";

export interface ProductTarget {
    product_id: number;
    target_quantity: number;
    product?: {
        id: number;
        name: string;
    };
}

export interface AmountTier {
    threshold_amount: number;
    reward_product_id: number;
    reward_quantity: number;
    reward_product?: {
        id: number;
        name: string;
    };
}

export interface LoyaltySystem {
    id: number;
    customer_id: number;
    type: 'product' | 'amount';
    duration_days: number;
    is_active: boolean;
    activated_at?: string | null;
    expires_at?: string | null;
    start_date?: string;
    end_date?: string;
    created_at: string;

    // Product based fields
    product_targets?: ProductTarget[];
    reward_product_id?: number | null;
    reward_quantity?: number | null;
    reward_product?: { // For display
        id: number;
        name: string;
    };

    // Amount based fields
    amount_tiers?: AmountTier[];
}

export interface CreateProductLoyaltyParams {
    customer_id: number;
    duration_days: number;
    product_targets: { product_id: number; target_quantity: number }[];
    reward_product_id: number;
    reward_quantity: number;
}

export interface UpdateProductLoyaltyParams {
    duration_days: number;
    product_targets: { product_id: number; target_quantity: number }[];
    reward_product_id: number;
    reward_quantity: number;
}

export interface CreateAmountLoyaltyParams {
    customer_id: number;
    duration_days: number;
    tiers: { threshold_amount: number; reward_product_id: number; reward_quantity: number }[];
}

export interface UpdateAmountLoyaltyParams {
    duration_days: number;
    tiers: { threshold_amount: number; reward_product_id: number; reward_quantity: number }[];
}

// Progress Types
export interface LoyaltyProgressTier {
    id: number;
    threshold_amount: number;
    reward_product_id: number;
    reward_product_name: string;
    reward_quantity: number;
    unlocked: boolean;
}

export interface LoyaltyProgress {
    type: 'product' | 'amount';
    is_active: boolean;
    activated_at: string;
    expires_at?: string;
    reward_claims: any[];
    total_spend: number;
    tiers: LoyaltyProgressTier[];
    // Product specific fields (inferred or needed later)
    percentage?: number;
    product_progress?: { product_id: number; current_quantity: number; target_quantity: number }[];
}

export const getCustomerLoyaltySystems = async (customerId: number) => {
    const response = await api.get<{ data: LoyaltySystem[] }>(`/customers/${customerId}/loyalty-systems`);
    return response.data.data;
};

export const createProductLoyaltySystem = async (data: CreateProductLoyaltyParams) => {
    const response = await api.post(`/loyalty-systems/product`, data);
    return response.data;
};

export const updateProductLoyaltySystem = async (id: number, data: UpdateProductLoyaltyParams) => {
    const response = await api.put(`/loyalty-systems/${id}/product`, data);
    return response.data;
};

export const createAmountLoyaltySystem = async (data: CreateAmountLoyaltyParams) => {
    const response = await api.post(`/loyalty-systems/amount`, data);
    return response.data;
};

export const updateAmountLoyaltySystem = async (id: number, data: UpdateAmountLoyaltyParams) => {
    const response = await api.put(`/loyalty-systems/${id}/amount`, data);
    return response.data;
};

export const deleteLoyaltySystem = async (id: number) => {
    await api.delete(`/loyalty-systems/${id}`);
};

export const activateLoyaltySystem = async (id: number) => {
    const response = await api.post(`/loyalty-systems/${id}/activate`);
    return response.data;
};

export const deactivateLoyaltySystem = async (id: number) => {
    const response = await api.post(`/loyalty-systems/${id}/deactivate`);
    return response.data;
};

export const getLoyaltySystemProgress = async (id: number) => {
    const response = await api.get<LoyaltyProgress>(`/loyalty-systems/${id}/progress`);
    return response.data;
};
