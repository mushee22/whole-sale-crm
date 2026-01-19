import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import type { PettyCashTransaction } from "../api/pettyCash";
import { format } from "date-fns";
import { Badge } from "../../../components/ui/badge";

interface PettyCashTransactionDetailsModalProps {
    transaction: PettyCashTransaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PettyCashTransactionDetailsModal({
    transaction,
    open,
    onOpenChange,
}: PettyCashTransactionDetailsModalProps) {
    if (!transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transaction Details #{transaction.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm font-medium text-slate-500">Date</span>
                        <span className="text-sm text-slate-900">
                            {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm font-medium text-slate-500">Amount</span>
                        <span className="text-sm font-bold text-slate-900">
                            {transaction.amount}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm font-medium text-slate-500">Type</span>
                        <Badge
                            variant={
                                transaction.type === 'credit'
                                    ? 'default'
                                    : transaction.type === 'debit'
                                        ? 'destructive'
                                        : 'outline'
                            }
                            className={
                                transaction.type === 'credit'
                                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                    : transaction.type === 'transfer'
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                                        : ""
                            }
                        >
                            {transaction.type}
                        </Badge>
                    </div>

                    <div className="space-y-1 border-b pb-2">
                        <span className="text-sm font-medium text-slate-500 block">Account Details</span>
                        {transaction.type === 'transfer' ? (
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">From:</span>
                                    <span className="font-medium">{transaction.from_account?.account_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">To:</span>
                                    <span className="font-medium">{transaction.to_account?.account_name || 'N/A'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Account:</span>
                                <span className="font-medium">
                                    {transaction.to_account?.account_name || transaction.from_account?.account_name || 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <span className="text-sm font-medium text-slate-500 block">Description / Reference</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                            {transaction.description || transaction.reference || 'No details provided.'}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
