import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics, getProductSales } from "./api/dashboard";
import { getProducts } from "../products/api/products";
import { getUsers } from "../users/api/users";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DollarSign, Package, Users } from "lucide-react";

export default function DashboardPage() {
    // const [selectedProductId, setSelectedProductId] = useState<string>("");
    // const [selectedUserId, setSelectedUserId] = useState<string>("");

    // const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    //     queryKey: ['admin', 'dashboard'],
    //     queryFn: getDashboardMetrics,
    // });

    // const { data: products } = useQuery({
    //     queryKey: ['products', 'list'],
    //     queryFn: () => getProducts({ per_page: 100, is_active: true }),
    // });

    // const { data: users } = useQuery({
    //     queryKey: ['users', 'staff'],
    //     queryFn: () => getUsers({ per_page: 100 }),
    // });

    // // Set default user to the first one when users are loaded
    // useEffect(() => {
    //     if (!selectedUserId && users?.data && users.data.length > 0) {
    //         setSelectedUserId(users.data[0].id.toString());
    //     }
    // }, [users?.data, selectedUserId]);

    // const { data: productSales, isLoading: isLoadingSales } = useQuery({
    //     queryKey: ['admin', 'dashboard', 'sales', selectedProductId, selectedUserId],
    //     queryFn: () => getProductSales({
    //         product_id: selectedProductId,
    //         user_id: selectedUserId,
    //     }),
    //     enabled: !!selectedUserId || !!selectedProductId // Only fetch if we have filters, though now we enforce user_id
    // });

    // if (isLoadingMetrics) {
    //     return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    // }

    // if (metricsError) {
    //     return (
    //         <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
    //             <p>Error loading dashboard: {(metricsError as Error).message}</p>
    //         </div>
    //     );
    // }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>

            {/* Stats Cards */}
            {/* <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Order Amount
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics ? "..." : (metrics?.total_amount ? `₹${metrics.total_amount}` : '₹0')}
                        </div>
                       
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Products
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics ? "..." : (metrics?.product_count || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active products
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Customers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics ? "..." : (metrics?.customer_count || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Registered customers
                        </p>
                    </CardContent>
                </Card>
            </div> */}

            {/* Product Sales Section */}
            <div className="space-y-4">
                {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Sales
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                className="h-10 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                            >
                                <option value="">All Products</option>
                                {products?.data.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                className="h-10 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                {users?.data.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div> */}

                {/* Product Sales Stats */}
                {/* <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Quantity Sold
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isLoadingSales ? "..." : (productSales?.total_quantity_sold || 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Sales Amount
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isLoadingSales ? "..." : (productSales?.total_amount_sold ? `₹${productSales.total_amount_sold.toLocaleString()}` : '₹0')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Unique Customers
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isLoadingSales ? "..." : (productSales?.customers_count || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div> */}
            </div>
        </div>
    );
}
