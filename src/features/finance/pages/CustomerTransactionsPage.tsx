import CustomerTransactionList from "../components/CustomerTransactionList";

interface CustomerTransactionsPageProps {
    isAccountsMode?: boolean;
}

export const CustomerTransactionsPage = ({ isAccountsMode = false }: CustomerTransactionsPageProps) => {
    return (
        <div>
            <CustomerTransactionList isAccountsMode={isAccountsMode} />
        </div>
    );
};
