import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Modal } from "../../../components/ui/modal";
import { createSalesCustomer } from "../api/sales";
import { toast } from "sonner";
import { getLocations } from "../../master-data/api/locations";
import { useQuery } from "@tanstack/react-query";

interface CreateCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCustomerCreated: (customer: any) => void;
}

export function CreateCustomerModal({ isOpen, onClose, onCustomerCreated }: CreateCustomerModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [locationId, setLocationId] = useState<string>("");

    const { data: locations } = useQuery({
        queryKey: ["locations"],
        queryFn: getLocations
    });

    const createMutation = useMutation({
        mutationFn: createSalesCustomer,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Customer created successfully");
            onCustomerCreated(data);
            handleClose();
        },
        onError: () => toast.error("Failed to create customer"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !locationId) {
            toast.error("Please fill all fields");
            return;
        }

        createMutation.mutate({
            name,
            phone,
            location_id: parseInt(locationId),
        });
    };

    const handleClose = () => {
        setName("");
        setPhone("");
        setLocationId("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Customer">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="cust-name">Name</Label>
                    <Input
                        id="cust-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter customer name"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cust-phone">Phone</Label>
                    <Input
                        id="cust-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cust-location">Location</Label>
                    <Select value={locationId} onValueChange={setLocationId}>
                        <SelectTrigger id="cust-location">
                            <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations?.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                    {loc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creating..." : "Create Customer"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
