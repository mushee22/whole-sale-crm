import { api as axios } from "../../../lib/api";
import { z } from "zod";

// --- Types based on API Response ---
export interface OrderUser {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    whatsapp_no?: string | null;
}

export interface OrderItemProduct {
    id: number;
    name: string;
    sku: string;
    price: string;
    image: string | null;
}

export interface OrderItem {
    id: number;
    quantity: number;
    unit_price: string;
    product: OrderItemProduct;
}

export interface PointsLedger {
    id: number;
    customer_id: number;
    order_id: number | null;
    claim_id: number | null;
    type: string;
    points: number;
    description: string;
    created_at: string;
}

export interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    created_at: string;
    // status: string; // Field not in provided JSON, removing or mocking if needed
    customer: OrderUser;
    order_items: OrderItem[];
    // Additional fields from details view
    points_ledger?: PointsLedger[];
    referral_customer?: OrderUser | null;
    referral_phone?: string | null;
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

export const getOrders = async (params?: { page?: number; per_page?: number; search?: string; start_date?: string; end_date?: string; user_id?: string | number }) => {
    const response = await axios.get<OrdersResponse>("/admin/orders", { params });
    return response.data;
};

export const getOrder = async (id: number) => {
    const response = await axios.get<OrderDetailsResponse>(`/admin/orders/${id}`);
    return response.data.order;
};

export const deleteOrder = async (id: number) => {
    await axios.delete(`/admin/orders/${id}`);
};

export const updateOrder = async (id: number, data: CreateOrderData) => {
    const response = await axios.put(`/admin/orders/${id}`, data);
    return response.data;
};


// --- Types for Creation ---

export const orderItemSchema = z.object({
    product_id: z.number().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0),
});

export const createOrderSchema = z.object({
    customer_name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    whatsapp_no: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    referral_phone: z.string().optional().nullable(),
    claim_reward_id: z.number().optional().nullable(),
    total_amount: z.number().optional().nullable(), // Allow passing total amount explicitly
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;

export const createOrder = async (data: CreateOrderData) => {
    const response = await axios.post("/admin/orders", data);
    return response.data;
};
