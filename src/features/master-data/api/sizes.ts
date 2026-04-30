import { api } from "../../../lib/api";
import { type Size, type CreateMasterDataParams, type UpdateMasterDataParams, type PaginatedResponse } from "../types";

export async function getSizes(params?: { search?: string, per_page?: number }): Promise<Size[]>;
export async function getSizes(params: { search?: string, page: number, per_page?: number }): Promise<PaginatedResponse<Size>>;
export async function getSizes(params?: any): Promise<Size[] | PaginatedResponse<Size>> {
    const hasPage = params && typeof params === 'object' && 'page' in params;
    
    const response = await api.get("/sizes", { params });
    const data = response.data;
    
    const isPaginatedResponse = data && Array.isArray(data.data) && 'current_page' in data;

    if (hasPage && isPaginatedResponse) {
        return data as PaginatedResponse<Size>;
    }
    
    if (isPaginatedResponse) return data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}




export const createSize = async (data: CreateMasterDataParams): Promise<Size> => {
    const response = await api.post("/sizes", data);
    return response.data;
};

export const updateSize = async (id: number | string, data: UpdateMasterDataParams): Promise<Size> => {
    const response = await api.put(`/sizes/${id}`, data);
    return response.data;
};

export const deleteSize = async (id: number | string): Promise<void> => {
    await api.delete(`/sizes/${id}`);
};
