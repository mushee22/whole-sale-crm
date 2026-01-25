import { api as axios } from "../../../lib/api";
import { z } from "zod";

// --- Types based on API Response ---
export interface OrderUser {
    id: number;
    name: string;
    phone: string;
    location_id?: number | null;
    outstanding_amount?: string;
    created_at?: string;
    email?: string;
    // Added based on JSON
    role_id?: number;
    status?: string;
    email_verified_at?: string | null;
    whatsapp_no?: string | null; // Added to fix TS error
    location?: { // Added location object structure
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    } | null;
}

export interface OrderItemProduct {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    price: string;
    // Added based on JSON
    parent_id?: number | null;
    color_id?: number | null;
    size_id?: number | null;
    stock?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    sku?: string; // Added to fix TS error, though might be null in JSON
}

export interface DispatchCheck {
    id: number;
    order_item_id: number;
    is_checked: boolean;
    checked_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: string;
    // unit_price: string; // Not in JSON, strictly using price
    comment: string | null;
    attachment_url: string | null;
    created_at: string;
    updated_at: string;
    product: OrderItemProduct;
    dispatch_check?: DispatchCheck | null;
}

export interface Order {
    id: number;
    customer_id: number;
    unique_id?: string; // Added based on JSON
    created_by: number; // Added based on JSON
    // order_number: string; // Not in JSON sample, maybe check if needed or optional
    order_date: string;
    estimated_delivery_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    customer: OrderUser;
    items: OrderItem[]; // Renamed from order_items
    deliveries: any[];
    delivery_checks: any[]; // Added based on JSON
    invoice: {
        id: number;
        pdf_path: string | null;
        total_amount: string;
        invoice_date: string;
    } | null;
    creator: OrderUser; // Added based on JSON (using OrderUser as structure seems similar)
    rewards: any[];
    referral_phone?: string; // Added to fix TS error
    order_number?: string; // Re-adding as optional/string to fix TS error in components that display it

    // Kept optional for compatibility if used elsewhere or calculated
    total_amount?: number;
    points_ledger?: {
        id: number;
        description: string;
        points: number;
        type: 'earn' | 'redeem';
        created_at: string;
    }[];
    total_points_earned?: number;
    total_points_used_for_claims?: number;
}

export interface OrdersResponse {
    current_page: number;
    data: Order[];
    last_page: number;
    total: number;
    per_page: number;
}

export interface OrderDetailsResponse {
    order: Order;
}

export const getOrders = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    customer_id?: number;
    user_id?: string | number; // Added user_id
    status?: string;
    order_date_from?: string;
    order_date_to?: string;
}) => {
    const response = await axios.get<OrdersResponse>("/orders", { params });
    return response.data;
};

export const getOrder = async (id: number) => {
    const response = await axios.get<Order>(`/orders/${id}`);
    return response.data;
};

export const deleteOrder = async (id: number) => {
    await axios.delete(`/orders/${id}`);
};




// --- Types for Creation ---

export const orderItemSchema = z.object({
    product_id: z.number().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    // unit_price: z.number().min(0), // User payload uses 'price' not 'unit_price', making it optional or alias if needed
    price: z.number().optional(),
    unit_price: z.number().optional(),
    comment: z.string().optional(),
    attachment_url: z.string().optional(),
    attachment: z.any().optional(),
});

export const createOrderSchema = z.object({
    customer_id: z.number().optional(), // Added customer_id
    customer_name: z.string().optional(), // Kept optional for backward compatibility if needed
    phone: z.string().optional(),
    whatsapp_no: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    referral_phone: z.string().optional().nullable(),
    claim_reward_id: z.number().optional().nullable(),
    total_amount: z.number().optional().nullable(),
    order_date: z.string(),
    estimated_delivery_date: z.string().optional(), // Added estimated_delivery_date
    items_to_delete: z.array(z.number()).optional(),
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;

export const createOrder = async (data: any) => {
    // If data is FormData, axios handles headers automatically
    const response = await axios.post("/orders", data);
    return response.data;
};

export const assignDelivery = async (orderId: number, data: { delivery_boy_id: number; delivery_date: string }) => {
    const response = await axios.post(`/orders/${orderId}/assign-delivery`, data);
    return response.data;
};

export const dispatchCheck = async (orderId: number, data: { order_item_id: number; is_checked: boolean }) => {
    const response = await axios.post(`/orders/${orderId}/dispatch-check`, data);
    return response.data;
};

export const deliveryCheck = async (orderId: number, data: { order_item_id: number; is_delivered: boolean }) => {
    const response = await axios.post(`/deliveries/${orderId}/check`, data);
    return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
    const response = await axios.put(`/orders/${orderId}`, { status });
    return response.data;
};

// Updated updateOrder to support FormData (POST with _method=PUT is safer for files in some frameworks, but user asked for update)
// We will try PUT. If backend is PHP/Laravel, it might need POST + _method: PUT for files.
// For now, let's stick to standard PUT, unless we encounter issues.
// Actually, safely, we can check if it's FormData.
export const updateOrder = async (id: number, data: any) => {
    const response = await axios.post(`/orders/${id}`, data, {
        params: {
            _method: 'PUT'
        }
    });
    return response.data;
};



export const getDeliveryOrders = async (userId: number, params?: {
    status?: string;
    order_date_from?: string;
    per_page?: number;
    page?: number;
}) => {
    const response = await axios.get<OrdersResponse>(`/deliveries/${userId}/orders`, { params });
    return response.data;
};

export const getMyDeliveryOrders = async (params?: { status?: string }) => {
    const response = await axios.get<OrdersResponse>("/deliveries/my-orders", { params });
    return response.data;
};
