import { api } from "../../../lib/api";
import { type Color, type CreateMasterDataParams, type UpdateMasterDataParams, type PaginatedResponse } from "../types";

export async function getColors(params?: { search?: string, per_page?: number }): Promise<Color[]>;
export async function getColors(params: { search?: string, page: number, per_page?: number }): Promise<PaginatedResponse<Color>>;
export async function getColors(params?: any): Promise<Color[] | PaginatedResponse<Color>> {
    const hasPage = params && typeof params === 'object' && 'page' in params;
    
    const response = await api.get("/colors", { params });
    const data = response.data;
    
    const isPaginatedResponse = data && Array.isArray(data.data) && 'current_page' in data;

    if (hasPage && isPaginatedResponse) {
        return data as PaginatedResponse<Color>;
    }
    
    if (isPaginatedResponse) return data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}




export const createColor = async (data: CreateMasterDataParams): Promise<Color> => {
    const response = await api.post("/colors", data);
    return response.data;
};

export const updateColor = async (id: number | string, data: UpdateMasterDataParams): Promise<Color> => {
    const response = await api.put(`/colors/${id}`, data);
    return response.data;
};

export const deleteColor = async (id: number | string): Promise<void> => {
    await api.delete(`/colors/${id}`);
};
