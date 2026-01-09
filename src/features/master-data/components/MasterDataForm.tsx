import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { type CreateMasterDataParams, type MasterDataItem } from "../types";

interface MasterDataFormProps {
    onSubmit: (data: CreateMasterDataParams) => void;
    isLoading: boolean;
    initialData: MasterDataItem | null;
    onCancel: () => void;
}

export function MasterDataForm({ onSubmit, isLoading, initialData, onCancel }: MasterDataFormProps) {
    const [name, setName] = useState("");

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
        } else {
            setName("");
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
                </Button>
            </div>
        </form>
    );
}
