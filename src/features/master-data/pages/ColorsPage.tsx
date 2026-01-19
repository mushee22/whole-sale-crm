import { MasterDataList } from "../components/MasterDataList";
import { getColors, createColor, updateColor, deleteColor } from "../api/colors";

export default function ColorsPage() {
    return (
        <MasterDataList
            title="Color"
            module="colors"
            queryKey="colors"
            fetchFn={getColors}
            createFn={createColor}
            updateFn={updateColor}
            deleteFn={deleteColor}
        />
    );
}
