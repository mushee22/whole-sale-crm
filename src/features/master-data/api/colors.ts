import { api } from "../../../lib/api";
import { type Color, type CreateMasterDataParams, type UpdateMasterDataParams } from "../types";

export const getColors = async (): Promise<Color[]> => {
    const response = await api.get("/colors");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

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
