import { api } from "../../../lib/api";

export interface DashboardMetrics {
    total_amount: number;
    product_count: number;
    customer_count: number;
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>('/admin/dashboard');
    return response.data;
};

export interface ProductSalesItem {
    product_id: number;
    quantity_sold: number;
    quantity_returned: number;
    net_quantity: number;
    revenue: number;
    return_amount: number;
    net_revenue: number;
    product: {
        id: number;
        parent_id: number | null;
        name: string;
        description: string | null;
        image_url: string | null;
        color_id: number | null;
        size_id: number | null;
        stock: number;
        price: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
        color?: { id: number; name: string } | null;
        size?: { id: number; name: string } | null;
        parent?: any | null;
    };
}

export interface ProductSalesResponse {
    current_page: number;
    data: ProductSalesItem[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        page: number | null;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export const getProductSales = async (params: { product_id?: string; user_id?: string; date_from?: string; date_to?: string; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.page) queryParams.append('page', params.page.toString());

    const response = await api.get<ProductSalesResponse>(`/dashboard/product-sales?${queryParams.toString()}`);
    return response.data;
};
