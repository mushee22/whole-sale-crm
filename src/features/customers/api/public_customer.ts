import { api as axios } from "../../../lib/api";

export interface PublicCustomerSummary {
    customer_name: string;
    phone: string;
    unique_id: string;
    available_points: number;
    referral_points: number;
    used_points: number;
    total_earned_points: number;
}

export interface PublicLedgerItem {
    id: number;
    customer_id: number;
    order_id: number | null;
    claim_id: number | null;
    type: string;
    points: number;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface PublicLedgerResponse {
    customer: any; // We might not need this detailed customer info again since we have summary
    points_ledger: PublicLedgerItem[];
}

export interface PublicProduct {
    id: number;
    name: string;
    image: string | null;
}

export interface PublicOrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    points_earned: number;
    product: PublicProduct;
}

export interface PublicOrder {
    id: number;
    order_number: string;
    total_amount: string;
    total_points_earned: number;
    created_at: string;
    status?: string;
    order_items: PublicOrderItem[];
}

export interface PublicOrdersResponse {
    customer: {
        id: number;
        name: string;
        phone: string;
        email: string | null;
    };
    orders: {
        data: PublicOrder[];
        current_page: number;
        last_page: number;
        total: number;
    };
    orders_count: number;
    total_orders_amount: string;
}

export const getPublicCustomerSummary = async (uniqueId: string) => {
    const response = await axios.get<PublicCustomerSummary>(`/customer/${uniqueId}/summary`);
    return response.data;
};

export const getPublicCustomerLedger = async (uniqueId: string) => {
    const response = await axios.get<PublicLedgerResponse>(`/customer/${uniqueId}/ledger`);
    return response.data;
};

export const getPublicCustomerOrders = async (uniqueId: string) => {
    const response = await axios.get<PublicOrdersResponse>(`/customer/${uniqueId}/orders`);
    return response.data;
};
