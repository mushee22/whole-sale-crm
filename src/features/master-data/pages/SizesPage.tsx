import { MasterDataList } from "../components/MasterDataList";
import { getSizes, createSize, updateSize, deleteSize } from "../api/sizes";

export default function SizesPage() {
    return (
        <MasterDataList
            title="Size"
            queryKey="sizes"
            fetchFn={getSizes}
            createFn={createSize}
            updateFn={updateSize}
            deleteFn={deleteSize}
        />
    );
}
