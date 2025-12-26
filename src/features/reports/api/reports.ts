import { api } from "../../../lib/api";

export interface ExportOrdersParams {
    search?: string;
    user_id?: string;
    product_id?: string;
    start_date?: string;
    end_date?: string;
    format: 'xlsx';
}

export const exportOrders = async (params: ExportOrdersParams) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    queryParams.append('format', params.format);

    const response = await api.get(`/admin/reports/orders/export?${queryParams.toString()}`, {
        responseType: 'blob',
    });
    return response.data;
};
