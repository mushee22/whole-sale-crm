import { api } from "../../../lib/api";
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export const loginWithEmail = async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('auth/login', data);
    return response.data;
};

export const getUser = async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('auth/me');
    return response.data;
};
