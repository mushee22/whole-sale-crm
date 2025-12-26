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

export interface ProductSalesStats {
    product_id: number | null;
    user_id: number | null;
    total_quantity_sold: number;
    total_amount_sold: number;
    customers_count: number;
}

export const getProductSales = async (params: { product_id?: string; user_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.user_id) queryParams.append('user_id', params.user_id);

    const response = await api.get<ProductSalesStats>(`/admin/dashboard/product-sales?${queryParams.toString()}`);
    return response.data;
};
