
import { api } from "../../../lib/api";

export interface Invoice {
    id: number;
    order_id: number;
    invoice_date: string;
    total_amount: string;
    pdf_path: string | null;
    created_at: string;
    order?: {
        id: number;
        unique_id: string;
        customer_id: number;
        order_date: string;
        status: string;
        customer?: {
            id: number;
            name: string;
            phone: string;
        };
        items?: {
            id: number;
            product_id: number;
            quantity: number;
            price: number | string;
            product?: {
                name: string;
            };
        }[];
    };
    is_moved_to_system?: boolean;
}

export interface InvoicesResponse {
    current_page: number;
    data: Invoice[];
    last_page: number;
    total: number;
    per_page: number;
}

export const getInvoices = async (params?: {
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
    is_moved_to_system?: boolean;
}) => {
    const response = await api.get<InvoicesResponse>("/invoices", { params });
    return response.data;
};

export const getInvoice = async (id: number) => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
};

export const updateInvoice = async (id: number, data: Partial<Invoice>) => {
    const response = await api.put<Invoice>(`/invoices/${id}`, data);
    return response.data;
};

export const downloadInvoice = async (id: number) => {
    const response = await api.get(`/invoices/${id}/download-pdf`, {
        responseType: 'blob'
    });
    return response.data;
};
