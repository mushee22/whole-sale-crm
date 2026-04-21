import { Modal } from "../../../components/ui/modal";
import CustomerForm from "../../customers/components/CustomerForm";

interface CreateCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCustomerCreated: (customer: any) => void;
}

export function CreateCustomerModal({ isOpen, onClose, onCustomerCreated }: CreateCustomerModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Customer">
            <CustomerForm
                onSuccess={onCustomerCreated}
                onCancel={onClose}
            />
        </Modal>
    );
}
