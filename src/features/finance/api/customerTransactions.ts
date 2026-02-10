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
    invoice_id: number | null;
    amount: string;
    type: string;
    payment_mode: string;
    collected_by: {
        id: number;
        name: string;
        email?: string;
    } | null;
    date: string;
    note: string;
    created_at: string;
    updated_at: string;
    customer: {
        id: number;
        name: string;
        phone: string;
        location_id: number;
        outstanding_amount: string;
    };
    invoice: {
        id: number;
        order_id: number;
        invoice_date: string;
        total_amount: string;
        pdf_path: string;
    } | null;
    is_moved_to_system?: boolean;
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

export const getCustomerTransactions = async (page = 1, is_moved_to_system?: boolean, date_from?: string, date_to?: string, type?: 'credit' | 'debit') => {
    const params: any = { page };
    if (is_moved_to_system !== undefined) params.is_moved_to_system = is_moved_to_system;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;
    if (type) params.type = type;
    const response = await api.get<CustomerTransactionsResponse>(`/customer-transactions`, { params });
    return response.data;
};

export const createCustomerTransaction = async (data: CreateCustomerTransactionParams) => {
    const response = await api.post("/customer-transactions", data);
    return response.data;
};

export const updateCustomerTransaction = async (id: number, data: { amount?: number; note?: string; is_moved_to_system?: boolean }) => {
    const response = await api.put(`/customer-transactions/${id}`, data);
    return response.data;
};
