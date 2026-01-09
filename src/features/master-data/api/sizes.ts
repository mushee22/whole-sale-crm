import { api } from "../../../lib/api";
import { type Size, type CreateMasterDataParams, type UpdateMasterDataParams } from "../types";

export const getSizes = async (): Promise<Size[]> => {
    const response = await api.get("/sizes");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

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
