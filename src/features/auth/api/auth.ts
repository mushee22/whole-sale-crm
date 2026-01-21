import { api } from "../../../lib/api";
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface Role {
    id: number;
    name: string;
    permissions: string[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string | Role; // Handle both string (if legacy) and object
    petty_cash_account?: {
        id: number;
        account_id: string;
        account_name: string;
        user_id: number;
        opening_balance: string;
        current_balance: string;
        is_amount_accepted: boolean;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    };
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export const loginWithEmail = async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('login', data);
    return response.data;
};

export const getUser = async (): Promise<User> => {
    const response = await api.get<User>('me');
    return response.data;
};
