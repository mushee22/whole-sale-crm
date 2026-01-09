import { api } from "../../../lib/api";
import { type Location, type CreateMasterDataParams, type UpdateMasterDataParams } from "../types";

export const getLocations = async (): Promise<Location[]> => {
    const response = await api.get("/locations");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

export const createLocation = async (data: CreateMasterDataParams): Promise<Location> => {
    const response = await api.post("/locations", data);
    return response.data;
};

export const updateLocation = async (id: number | string, data: UpdateMasterDataParams): Promise<Location> => {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
};

export const deleteLocation = async (id: number | string): Promise<void> => {
    await api.delete(`/locations/${id}`);
};
