import { api } from "../../../lib/api";

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: string[]; // Usually returns names or permission objects. User input implied string names in 'create'.
    created_at: string;
    updated_at: string;
}

export interface RolesResponse {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface CreateRoleParams {
    name: string;
    permissions: string[];
}

export const getRoles = async (params?: { page?: number; per_page?: number; name?: string }) => {
    const response = await api.get<RolesResponse>("/roles", { params });
    return response.data;
};

export const createRole = async (data: CreateRoleParams) => {
    const response = await api.post("/roles", data);
    return response.data;
};
