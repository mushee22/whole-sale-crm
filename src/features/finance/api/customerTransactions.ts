import { api } from "../../../lib/api";

export interface CreateCustomerTransactionParams {
    customer_id: number;
    amount: number;
    type: 'credit' | 'debit';
    payment_mode: string;
    collected_by: number;
    date: string;
    note: string;
}

export interface CustomerTransaction {
    id: number;
    customer_id: number;
    amount: string;
    type: string;
    payment_mode: string;
    collected_by: number;
    date: string;
    note: string;
    created_at: string;
    updated_at: string;
    customer?: {
        id: number;
        name: string;
    };
    collector?: {
        id: number;
        name: string;
    };
}

export interface CustomerTransactionsResponse {
    data: CustomerTransaction[];
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

export const getCustomerTransactions = async (page = 1) => {
    const response = await api.get<CustomerTransactionsResponse>(`/customer-transactions?page=${page}`);
    return response.data;
};

export const createCustomerTransaction = async (data: CreateCustomerTransactionParams) => {
    const response = await api.post("/customer-transactions", data);
    return response.data;
};
