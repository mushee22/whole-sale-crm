import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import InvoicesListPage from "./InvoicesListPage";
import PettyCashTransactionsPage from "../../finance/pages/PettyCashTransactionsPage";
import { CustomerTransactionsPage } from "../../finance/pages/CustomerTransactionsPage";

export default function AccountsPage() {
    return (
        <div className="space-y-6 lg:p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-lg md:text-2xl font-bold">Accounts</h1>
            </div>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="bg-slate-100 p-1 w-full overflow-x-auto flex justify-start md:justify-center">
                    <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 md:flex-none">Invoices</TabsTrigger>
                    <TabsTrigger value="petty-cash" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 md:flex-none">
                        <span className="md:hidden">Petty Cash</span>
                        <span className="hidden md:inline">Petty Cash Transactions</span>
                    </TabsTrigger>
                    <TabsTrigger value="customer-transactions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 md:flex-none">
                        <span className="md:hidden">Transactions</span>
                        <span className="hidden md:inline">Customer Transactions</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="mt-6">
                    <InvoicesListPage />
                </TabsContent>

                <TabsContent value="petty-cash" className="mt-6">
                    <PettyCashTransactionsPage isAccountsMode={true} />
                </TabsContent>

                <TabsContent value="customer-transactions" className="mt-6">
                    <CustomerTransactionsPage isAccountsMode={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
