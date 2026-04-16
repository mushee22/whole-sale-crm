import { api } from "../../../lib/api";
import { type Location, type CreateMasterDataParams, type UpdateMasterDataParams, type PaginatedResponse } from "../types";

export interface GetLocationsParams {
    page?: number;
    per_page?: number;
    search?: string;
}

export async function getLocations(params: GetLocationsParams & { page: number }): Promise<PaginatedResponse<Location>>;
export async function getLocations(params?: GetLocationsParams): Promise<Location[]>;
export async function getLocations(params: any = {}): Promise<Location[] | PaginatedResponse<Location>> {
    // Standardize params to avoid react-query context issues
    const cleanParams: any = {};
    if (params.page) cleanParams.page = params.page;
    if (params.per_page) cleanParams.per_page = params.per_page;
    if (params.search) cleanParams.search = params.search;

    const response = await api.get("/locations", { params: cleanParams });
    const data = response.data;
    
    const isPaginatedResponse = data && Array.isArray(data.data) && 'current_page' in data;

    // If the caller explicitly provided a page, return the full paginated response
    if (params.page && isPaginatedResponse) {
        return data as PaginatedResponse<Location>;
    }
    
    // Otherwise, return just the items array
    if (isPaginatedResponse) return data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    
    return [];
}

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
