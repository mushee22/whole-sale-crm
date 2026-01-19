import { api as axios } from "../../../lib/api";
import { z } from "zod";


export interface Product {
    id: number;
    parent_id: number | null;
    name: string;
    description: string | null;
    image_url: string | null;
    color_id: number | null;
    size_id: number | null;
    stock: number;
    price: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface ProductPrice {
    id: number;
    customer_id: number;
    product_id: number;
    price: string;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    location_id?: number | null;
    outstanding_amount?: string;
    created_at?: string;
    email_verified_at?: string | null;
    status?: string;
    updated_at?: string;
    deleted_at?: string | null;
    // Location object from API response
    location?: {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    };
    // Fields used in UI but possibly missing in partial response (kept as optional/required based on UI usage)
    unique_id?: string;
    whatsapp_no?: string | null;
    total_earned_points?: number;
    total_referral_points?: number;
    total_used_points?: number;
    product_prices?: ProductPrice[];
}

export interface CustomersResponse {
    current_page: number;
    data: Customer[];
    last_page: number;
    total: number;
    per_page: number;
}

export const getCustomers = async (params?: {
    page?: number;
    per_page?: number;
    name?: string;
    location_id?: number | string;
}) => {
    const response = await axios.get<CustomersResponse>("/customers", { params });
    return response.data;
};


export const getCustomer = async (id: number) => {
    const response = await axios.get<Customer>(`/customers/${id}`);
    return response.data;
};

// Form Schema & Types
export const createCustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    location_id: z.coerce.number().min(1, "Location is required"),
});

export type CreateCustomerData = z.infer<typeof createCustomerSchema>;

export const createCustomer = async (data: CreateCustomerData) => {
    const response = await axios.post("/customers", data);
    return response.data;
};

export const updateCustomer = async (id: number, data: Partial<CreateCustomerData>) => {
    const response = await axios.put(`/customers/${id}`, data);
    return response.data;
};

export interface CustomerTransaction {
    id: number;
    customer_id: number;
    order_id: number | null;
    amount: string;
    type: string; // 'credit', 'debit'
    payment_mode: string; // 'cash', 'upi', etc.
    description: string | null;
    created_at: string;
    updated_at: string;
    order?: {
        id: number;
        order_number: string;
    } | null;
}

export interface CustomerTransactionsResponse {
    customer: Customer;
    current_balance: number;
    transactions: {
        current_page: number;
        data: CustomerTransaction[];
        last_page: number;
        total: number;
        per_page: number;
    };
}

export const getCustomerTransactions = async (customerId: number, params?: {
    page?: number;
    per_page?: number;
    type?: string;
    payment_mode?: string;
    date_from?: string;
    date_to?: string;
}) => {
    const response = await axios.get<CustomerTransactionsResponse>(`/customers/${customerId}/transactions`, { params });
    return response.data;
};
