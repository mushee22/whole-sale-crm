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
}

export interface OrderItemProduct {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    price: string;
    sku?: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: string;
    unit_price: string;
    comment: string | null;
    attachment_url: string | null;
    created_at: string;
    product: OrderItemProduct;
}

export interface Order {
    id: number;
    customer_id: number;
    order_number: string;
    order_date: string;
    estimated_delivery_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    customer: OrderUser;
    order_items: OrderItem[];
    deliveries: any[]; // Placeholder for deliveries
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
    const response = await axios.get<OrderDetailsResponse>(`/orders/${id}`);
    return response.data.order;
};

export const deleteOrder = async (id: number) => {
    await axios.delete(`/orders/${id}`);
};

export const updateOrder = async (id: number, data: CreateOrderData) => {
    const response = await axios.put(`/orders/${id}`, data);
    return response.data;
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
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;

export const createOrder = async (data: CreateOrderData) => {
    const response = await axios.post("/orders", data);
    return response.data;
};

export const assignDelivery = async (orderId: number, data: { delivery_boy_id: number; delivery_date: string }) => {
    const response = await axios.post(`/orders/${orderId}/assign-delivery`, data);
    return response.data;
};
