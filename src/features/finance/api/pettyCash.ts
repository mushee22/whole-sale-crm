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
    account_id: number;
    amount: string;
    type: 'credit' | 'debit';
    description: string;
    date: string;
    created_at: string;
    updated_at: string;
}

export interface PettyCashTransactionsResponse {
    data: PettyCashTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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
