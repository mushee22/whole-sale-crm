import { api as axios } from "../../../lib/api";
import { z } from "zod";

export interface Customer {
    id: number;
    unique_id: string; // Added unique_id
    name: string;
    phone: string;
    email: string | null;
    total_earned_points: number;
    total_referral_points: number;
    total_used_points: number;
    created_at: string;
    updated_at: string;
}

export interface CustomersResponse {
    current_page: number;
    data: Customer[];
    last_page: number;
    total: number;
    per_page: number;
}

export interface LedgerItem {
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

export interface CustomerOrder {
    id: number;
    customer_id: number;
    order_number: string;
    total_amount: string;
    total_points_earned: number;
    created_at: string;
    updated_at: string;
}

export interface CustomerDetailsResponse {
    customer: Customer;
    points_ledger: LedgerItem[];
    orders: CustomerOrder[];
    orders_count: number;
    total_orders_amount: string;
}

export const createCustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
    total_earned_points: z.number().optional(),
    total_referral_points: z.number().optional(),
    total_used_points: z.number().optional(),
});

export type CreateCustomerData = z.infer<typeof createCustomerSchema>;

export const getCustomers = async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await axios.get<CustomersResponse>("/admin/customers", { params });
    return response.data;
};

export const getCustomer = async (id: number) => {
    const response = await axios.get<CustomerDetailsResponse>(`/admin/customers/${id}`);
    return response.data; // Return the full response object
};

export const createCustomer = async (data: CreateCustomerData) => {
    // The API will check if customer exists by phone and update if exists, create if not
    const response = await axios.post("/admin/customers", data);
    return response.data;
};
