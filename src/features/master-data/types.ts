export interface MasterDataItem {
    id: number | string;
    name: string;
}

export interface Color extends MasterDataItem { }
export interface Size extends MasterDataItem { }
export interface Location extends MasterDataItem { }

export interface Product extends MasterDataItem {
    description?: string;
    is_active: boolean;
    image?: string;
    image_url?: string;
    parent_id?: number | string | null;
    color_id?: number | string | null;
    size_id?: number | string | null;
    color?: { name: string;[key: string]: any };
    size?: { name: string;[key: string]: any };
    // price: number; // Removing as per requirement
    // stock: number; // Removing as per requirement
}

export interface CreateMasterDataParams {
    name: string;
    description?: string; // Added for generic support or specific Product usage
    is_active?: boolean;
    price?: number;
    stock?: number;
}

export interface UpdateMasterDataParams extends Partial<CreateMasterDataParams> { }
