import { api } from "../../../lib/api";
import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    discount_price: z.coerce.number().min(0, "Discount price must be positive").optional(),
    stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
    image: z.any().optional().nullable(),
    is_active: z.boolean().default(true),
});

export type CreateProductData = z.infer<typeof createProductSchema>;

// Types based on User Response
export interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    discount_price: number | null;
    stock: number;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    color?: { name: string; id: number };
    size?: { name: string; id: number };
}

export interface ProductListResponse {
    current_page: number;
    data: Product[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface GetProductsParams {
    page?: number;
    search?: string;
    is_active?: boolean;
    per_page?: number;
}

export const getProducts = async (params: GetProductsParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await api.get<ProductListResponse>(`products?${queryParams.toString()}`);
    return response.data;
};

export const createProduct = async (data: CreateProductData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Convert boolean to 1/0 for backend compatibility
            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value as any);
            }
        }
    });

    const response = await api.post('admin/products', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const updateProduct = async ({ id, data }: { id: number; data: CreateProductData }) => {
    const formData = new FormData();
    // For update, we might need to handle _method for some backends, but assuming standard PUT/POST with FormData
    // Since axios PUT with FormData works, but sometimes backends prefer POST with _method=PUT
    // Sticking to direct update for now.

    // NOTE: Many backends (like Laravel) struggle with PUT and FormData. 
    // It is safer to use POST with _method="PUT" if the backend is Laravel/PHP.
    // However, sticking to standard PUT as per existing code structure first.
    // If issues arise, we can switch to POST + _method.

    // Actually, to be safe with standard FormData + PUT issues, let's keep it simple first
    // If 'image' is just a string (existing URL), we might not need FormData?
    // But consistency is better.

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Convert boolean to 1/0 for backend compatibility
            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value as any);
            }
        }
    });
    // Add method spoofing just in case, typical for PHP/Laravel backends
    formData.append('_method', 'PUT');

    const response = await api.post(`admin/products/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteProduct = async (id: number) => {
    const response = await api.delete(`admin/products/${id}`);
    return response.data;
};
