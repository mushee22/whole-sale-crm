import { MasterDataList } from "../components/MasterDataList";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../api/locations";

export default function LocationsPage() {
    return (
        <MasterDataList
            title="Location"
            module="locations"
            queryKey="locations"
            fetchFn={getLocations}
            createFn={createLocation}
            updateFn={updateLocation}
            deleteFn={deleteLocation}
        />
    );
}
