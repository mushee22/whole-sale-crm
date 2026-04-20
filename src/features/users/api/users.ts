import { api } from "../../../lib/api";
import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone is required"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
    role_id: z.coerce.number().min(1, "Role is required"),
    status: z.string().default("active"),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    role?: {
        id: number;
        name: string;
        permissions: string[];
    };
}

export interface OrderLog {
    id: number;
    order_id: number;
    user_id: number;
    action: string;
    user_role: string;
    user_name: string;
    description: string;
    created_at: string;
    updated_at: string;
    order: {
        id: number;
        customer_id: number;
        order_number: string;
        total_amount: string;
        total_points_earned: number;
        created_at: string;
    } | null;
    user: User;
}

export interface OrderLogsResponse {
    current_page: number;
    data: OrderLog[];
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

export interface GetUsersParams {
    page?: number;
    search?: string;
    per_page?: number;
    role_id?: number;
    is_active?: string;
}

export interface UsersListResponse {
    current_page: number;
    data: User[];
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

export const getUser = async (id: number) => {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data.user;
};

export const getUsers = async (params: GetUsersParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.role_id) queryParams.append('role_id', params.role_id.toString());
    if (params.is_active) queryParams.append('status', params.is_active);

    const response = await api.get<UsersListResponse>(`/users?${queryParams.toString()}`);
    return response.data;
};

export const createUser = async (data: CreateUserData) => {
    const response = await api.post("/users", data);
    return response.data;
};

export const updateUser = async (id: number, data: Partial<CreateUserData>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

export const getUserOrderLogs = async (userId: number, params: { page?: number; per_page?: number } = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', userId.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    // Using the same OrdersResponse type logic but the endpoint is different
    // Assuming the response structure aligns with standard paginated list
    const response = await api.get<OrderLogsResponse>(`/admin/order-logs?${queryParams.toString()}`);
    return response.data;
};

export interface StaffProductCommission {
    id: number;
    user_id: number;
    product_id: number;
    commission_rate: string | number;
    created_at: string;
    updated_at: string;
}

export interface StaffProductCommissionPayload {
    commissions: {
        user_id: number;
        product_id: number;
        commission_rate: number;
    }[];
}

export const getStaffProductCommissions = async (userId: number) => {
    const response = await api.get<{ data: StaffProductCommission[] }>(`/staff-product-commissions?user_id=${userId}&per_page=200`);
    return response.data;
};

export const saveStaffProductCommissions = async (payload: StaffProductCommissionPayload) => {
    const response = await api.post("/staff-product-commissions", payload);
    return response.data;
};

export interface StaffCommissionReportParams {
    user_id: number;
    start_date?: string;
    end_date?: string;
    product_id?: number;
}

export const getStaffCommissionReport = async (params: StaffCommissionReportParams) => {
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', params.user_id.toString());
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.product_id) queryParams.append('product_id', params.product_id.toString());

    const response = await api.get<{ data: any[], total_commission: number }>(`/staff-product-commissions/report?${queryParams.toString()}`);
    return response.data;
};
