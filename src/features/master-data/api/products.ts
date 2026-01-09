import { api } from "../../../lib/api";
import { type Product } from "../types";

export const getProducts = async (params?: any): Promise<Product[]> => {
    const response = await api.get("/products", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

export const getProductVariants = async (params: any): Promise<Product[]> => {
    const response = await api.get("/products/variants/list", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

export const createProduct = async (data: any): Promise<Product> => {
    const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
    const response = await api.post("/products", data, config);
    return response.data;
};

export const updateProduct = async (id: number | string, data: any): Promise<Product> => {
    // If data is FormData, we need to handle PUT method spoofing as standard browsers don't support PUT with FormData
    if (data instanceof FormData) {
        data.append("_method", "PUT");
        // Use POST for FormData updates with _method spoofing
        const response = await api.post(`/products/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    }

    // Fallback for JSON
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};

export const deleteProduct = async (id: number | string): Promise<void> => {
    await api.delete(`/products/${id}`);
};
