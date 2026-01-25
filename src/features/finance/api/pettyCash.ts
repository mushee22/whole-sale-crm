import { api } from "../../../lib/api";

export interface PettyCashAccount {
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
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
        role_id: number;
        status: string;
        email_verified_at: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    };
}

export interface PettyCashAccountsResponse {
    data: PettyCashAccount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface CreatePettyCashAccountParams {
    user_id: number;
    opening_balance: number;
    is_amount_accepted: boolean;
}

export interface PettyCashTransaction {
    id: number;
    from_account_id: number | null;
    to_account_id: number | null;
    amount: string;
    type: 'credit' | 'debit' | 'transfer';
    reference: string;
    description?: string; // Kept as optional if still used in other endpoints, though not in example JSON
    date: string;
    created_at: string;
    updated_at: string;
    from_account: PettyCashAccount | null;
    to_account: PettyCashAccount | null;
    is_moved_to_system?: boolean;
}

export interface PettyCashTransactionsResponse {
    data: PettyCashTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
        page: number | null;
    }[];
}

export const getPettyCashAccounts = async (page = 1) => {
    const response = await api.get<PettyCashAccountsResponse>(`/petty-cash-accounts?page=${page}`);
    return response.data;
};

export const getPettyCashAccount = async (id: number) => {
    const response = await api.get<PettyCashAccount>(`/petty-cash-accounts/${id}`);
    return response.data;
};

export const getPettyCashTransactions = async (accountId: number, params?: {
    type?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
}) => {
    const response = await api.get<PettyCashTransactionsResponse>(`/petty-cash-accounts/${accountId}/transactions`, { params });
    return response.data;
};

export const getAllPettyCashTransactions = async (params?: {
    account_id?: number;
    type?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
    is_moved_to_system?: boolean;
}) => {
    const response = await api.get<PettyCashTransactionsResponse>("/petty-cash-transactions", { params });
    return response.data;
};

export const getPettyCashTransaction = async (id: number) => {
    const response = await api.get<PettyCashTransaction>(`/petty-cash-transactions/${id}`);
    return response.data;
};

export interface TransferPettyCashParams {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    reference: string;
    date: string;
}

export const createPettyCashAccount = async (data: CreatePettyCashAccountParams) => {
    const response = await api.post("/petty-cash-accounts", data);
    return response.data;
};

export const transferPettyCash = async (data: TransferPettyCashParams) => {
    const response = await api.post("/petty-cash/transfer", data);
    return response.data;
};

export const updatePettyCashTransaction = async (id: number, data: { is_moved_to_system?: boolean }) => {
    const response = await api.put(`/petty-cash-transactions/${id}`, data);
    return response.data;
};

export const updatePettyCashAccount = async (id: number, data: { opening_balance?: number; is_amount_accepted?: boolean }) => {
    const response = await api.put(`/petty-cash-accounts/${id}`, data);
    return response.data;
};

export const deletePettyCashAccount = async (id: number) => {
    const response = await api.delete(`/petty-cash-accounts/${id}`);
    return response.data;
};
