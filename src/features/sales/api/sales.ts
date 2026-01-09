import { api } from "../../../lib/api";

export interface CreateSalesCustomerParams {
    name: string;
    phone: string;
    location_id: number;
}

// ... existing code ...

export interface CreatePreOrderParams {
    customer_id: number;
    items: {
        product_id: number;
        quantity: number;
        price: number;
    }[];
}

export const createSalesCustomer = async (data: CreateSalesCustomerParams) => {
    const response = await api.post("/customers", data);
    return response.data;
};

export const createPreOrder = async (data: CreatePreOrderParams) => {
    const response = await api.post("/pre-orders", data);
    return response.data;
};

export interface PreOrderItem {
    id: number;
    pre_order_id: number;
    product_id: number;
    quantity: number;
    price: string; // The API returns price as string
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        name: string;
        image_url?: string;
    };
}

export interface PreOrder {
    id: number;
    customer_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    customer?: {
        id: number;
        name: string;
        phone: string;
        location_id?: number;
    };
    items?: PreOrderItem[];
    // total_amount is not in the response, so we will remove it or keep it optional if api changes
    total_amount?: number;
}

export interface PreOrdersResponse {
    data: PreOrder[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export const getPreOrders = async (params?: { customer_id?: number; status?: string; per_page?: number; page?: number }) => {
    const response = await api.get<PreOrdersResponse>("/pre-orders", { params });
    return response.data;
};

export const getPreOrder = async (id: number) => {
    const response = await api.get<PreOrder>(`/pre-orders/${id}`);
    return response.data;
};

export const confirmPreOrder = async (id: number) => {
    const response = await api.post(`/pre-orders/${id}/confirm`);
    return response.data;
};
