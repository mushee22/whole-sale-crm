import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicCustomerSummary, getPublicCustomerLedger, getPublicCustomerOrders } from "../features/customers/api/public_customer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Award, ShoppingBag, History, User, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../components/ui/badge";

export default function PublicCustomerPage() {
    const { uniqueId } = useParams<{ uniqueId: string }>();
    const [activeTab, setActiveTab] = useState("summary");
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const toggleOrder = (orderId: number) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(orderId);
        }
    };

    if (!uniqueId) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Invalid Customer ID</div>;
    }

    const summaryQuery = useQuery({
        queryKey: ["public-customer-summary", uniqueId],
        queryFn: () => getPublicCustomerSummary(uniqueId),
    });

    const ledgerQuery = useQuery({
        queryKey: ["public-customer-ledger", uniqueId],
        queryFn: () => getPublicCustomerLedger(uniqueId),
        enabled: activeTab === "ledger",
    });

    const ordersQuery = useQuery({
        queryKey: ["public-customer-orders", uniqueId],
        queryFn: () => getPublicCustomerOrders(uniqueId),
        enabled: activeTab === "orders",
    });

    if (summaryQuery.isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading profile...</div>;
    }

    if (summaryQuery.isError || !summaryQuery.data) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Customer not found</div>;
    }

    const customer = summaryQuery.data;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            {/* Header / Banner */}
            <div className="bg-slate-900 text-white pb-20 pt-16 px-4 shadow-xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
                    <div className="h-20 w-20 bg-white/10 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center border-2 border-white/20 shadow-xl">
                        <User className="h-10 w-10 text-white/90" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{customer.customer_name}</h1>
                        <p className="text-slate-400 font-medium mt-1">{customer.phone}</p>
                        <Badge variant="outline" className="mt-3 border-slate-700 text-slate-300 bg-slate-800/50 backdrop-blur-sm">
                            {customer.unique_id}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8 pt-8 border-t border-white/10 max-w-2xl mx-auto">
                        <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-md transition-all hover:bg-white/10 border border-white/10">
                            <div className="text-xl md:text-2xl font-bold text-green-400">{customer.available_points}</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">Available</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 md:p-3 backdrop-blur-sm transition-transform active:scale-95">
                            <div className="text-xl md:text-2xl font-bold text-blue-400">{customer.total_earned_points}</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">Earned</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 md:p-3 backdrop-blur-sm transition-transform active:scale-95">
                            <div className="text-xl md:text-2xl font-bold text-amber-400">{customer.used_points}</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">Used</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content using Shadcn Tabs */}
            <div className="max-w-3xl mx-auto -mt-10 px-4 relative z-20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="shadow-xl border-white/50 bg-white/80 backdrop-blur-xl">
                        <CardHeader className="pb-2 pt-4 px-2">
                            <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100/50 p-1 rounded-lg">
                                <TabsTrigger
                                    value="summary"
                                    className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                                >
                                    Summary
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ledger"
                                    className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                                >
                                    History
                                </TabsTrigger>
                                <TabsTrigger
                                    value="orders"
                                    className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                                >
                                    Orders
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-4 min-h-[300px] px-4 pb-6">
                            <TabsContent value="summary" className="mt-0 space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4">
                                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100/50 shadow-sm overflow-hidden">
                                        <div className="h-1 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-indigo-900/60 uppercase tracking-wide">Referral Points</p>
                                                <h3 className="text-3xl font-bold text-indigo-700 mt-1">{customer.referral_points}</h3>
                                            </div>
                                            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                                                <Award className="h-6 w-6 text-indigo-600" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4 text-gray-500" />
                                            Membership Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-gray-200/60 last:border-0 hover:bg-white px-2 rounded-lg transition-colors">
                                                <span className="text-gray-500">Status</span>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200/60 last:border-0 hover:bg-white px-2 rounded-lg transition-colors">
                                                <span className="text-gray-500">Member ID</span>
                                                <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{customer.unique_id}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200/60 last:border-0 hover:bg-white px-2 rounded-lg transition-colors">
                                                <span className="text-gray-500">Total Orders</span>
                                                {/* If we had total orders count in summary, interpret it here, otherwise just a placeholder or remove */}
                                                <span className="font-medium text-gray-900">--</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="ledger" className="mt-0 space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                {ledgerQuery.isLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading history...</div>
                                ) : ledgerQuery.data?.points_ledger?.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                                        <History className="h-8 w-8 opacity-20" />
                                        <p>No points history yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {ledgerQuery.data?.points_ledger.map((item) => (
                                            <div key={item.id} className="group relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${item.type === 'earn'
                                                        ? 'bg-green-50 text-green-700 group-hover:bg-green-100'
                                                        : 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 text-sm font-medium mt-2 leading-relaxed">{item.description}</p>
                                                <div className={`text-lg font-bold mt-2 flex items-center gap-1 ${item.type === 'earn' ? 'text-green-600' : 'text-amber-600'
                                                    }`}>
                                                    {item.type === 'earn' ? '+' : '-'}{item.points}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="orders" className="mt-0 space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                {ordersQuery.isLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading orders...</div>
                                ) : !ordersQuery.data?.orders?.data || ordersQuery.data.orders.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                                        <ShoppingBag className="h-8 w-8 opacity-20" />
                                        <p>No orders found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {ordersQuery.data.orders.data.map((order) => (
                                            <div key={order.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                                <div
                                                    className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                                    onClick={() => toggleOrder(order.id)}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">#{order.order_number}</div>
                                                            {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                                        <span className="text-gray-500 text-sm">Total Amount</span>
                                                        <span className="font-bold text-slate-900">₹{order.total_amount}</span>
                                                    </div>
                                                    {order.total_points_earned > 0 && (
                                                        <div className="flex justify-between items-center mt-2 pt-2 border-dashed border-t border-gray-100">
                                                            <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                                                <Award className="h-3 w-3" /> Points Earned
                                                            </span>
                                                            <span className="font-bold text-green-600 text-sm">+{order.total_points_earned}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedOrderId === order.id && (
                                                    <div className="bg-gray-50/50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Items</h4>
                                                        <div className="space-y-2">
                                                            {order.order_items.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-100">
                                                                    <div className="flex items-center gap-3">
                                                                        {item.product.image ? (
                                                                            <div className="h-8 w-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                                                                <img src={`${import.meta.env.VITE_API_URL || 'https://api.traceflowtech.com/api'}/${item.product.image}`} alt={item.product.name} className="h-full w-full object-cover" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                                                <ShoppingBag className="h-4 w-4" />
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <p className="font-medium text-gray-900">{item.product.name}</p>
                                                                            <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unit_price}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-medium text-gray-900">₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</p>
                                                                        {item.points_earned > 0 && (
                                                                            <p className="text-[10px] text-green-600 font-medium">+{item.points_earned} pts</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>

            <div className="text-center mt-12 text-slate-400 text-sm font-medium">
                <p>&copy; {new Date().getFullYear()} Customer Portal</p>
            </div>
        </div>
    );
}
