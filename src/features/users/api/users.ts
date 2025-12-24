import { api } from "../../../lib/api";
import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')), // Optional for update if not changing
    role: z.string().default("staff"),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface GetUsersParams {
    page?: number;
    search?: string;
    per_page?: number;
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

export const getUsers = async (params: GetUsersParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await api.get<UsersListResponse>(`/admin/users?${queryParams.toString()}`);
    return response.data;
};

export const createUser = async (data: CreateUserData) => {
    const response = await api.post("/admin/users", data);
    return response.data;
};

export const updateUser = async (id: number, data: Partial<CreateUserData>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};
