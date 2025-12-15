import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "./api/customers";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, Download, TrendingUp, ShoppingBag, Copy, ExternalLink, History, Eye } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import OrderDetailsModal from "../orders/components/OrderDetailsModal";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);
    const customerId = Number(id);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const { data: customerData, isLoading } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomer(customerId),
        enabled: !!customerId
    });

    const handleDownload = async () => {
        if (!cardRef.current) {
            toast.error("Card element not found");
            return;
        }

        try {
            toast.info("Generating image...");
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: true,
                useCORS: true,
            });

            const link = document.createElement('a');
            link.download = `${customerData?.customer?.name || 'customer'}-loyalty-card.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success("Card downloaded successfully!");
        } catch (error) {
            console.error('Failed to download image:', error);
            toast.error("Failed to download card. Check console for details.");
        }
    };

    const copyPublicLink = () => {
        if (customerData?.customer?.unique_id) {
            const url = `${window.location.origin}/c/${customerData.customer.unique_id}`;
            navigator.clipboard.writeText(url);
            toast.success("Public profile link copied to clipboard");
        }
    };

    const openPublicPage = () => {
        if (customerData?.customer?.unique_id) {
            window.open(`/c/${customerData.customer.unique_id}`, '_blank');
        }
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading customer details...</div>;
    if (!customerData) return <div className="p-8 text-center text-red-500">Customer not found</div>;

    const { customer, points_ledger, orders, orders_count, total_orders_amount } = customerData;
    // @ts-ignore
    const totalPoints = customer.total_earned_points + customer.total_referral_points - customer.total_used_points;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10 px-4 md:px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-slate-900 w-fit" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Customers
                </Button>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 bg-white"
                        onClick={copyPublicLink}
                    >
                        <Copy className="h-4 w-4" />
                        Copy Public Link
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 bg-white"
                        onClick={openPublicPage}
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Public Page
                    </Button>
                    <Button
                        className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={handleDownload}
                    >
                        <Download className="h-4 w-4" />
                        Download Card
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Loyalty Card & Stats */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Loyalty Card */}
                    <div ref={cardRef} className="relative transform transition-transform hover:scale-[1.02] duration-300">
                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                            <CardContent className="p-0">
                                {/* Decorative Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                                </div>

                                <div className="relative p-6">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold text-white tracking-tight">{customer.name}</h1>
                                            <p className="text-slate-300 text-xs">Loyalty Member</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Member ID</div>
                                            <div className="text-sm font-mono font-bold text-white">{customer.unique_id}</div>
                                        </div>
                                    </div>

                                    {/* Points Display */}
                                    <div className="mb-6">
                                        <div className="text-center mb-4">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Available Points</div>
                                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                                                {/* @ts-ignore */}
                                                {customer.available_points ?? totalPoints}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                                <div className="text-lg font-bold text-green-400">{customer.total_earned_points}</div>
                                                <div className="text-[10px] text-slate-400">Earned</div>
                                            </div>
                                            <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <div className="text-lg font-bold text-blue-400">{customer.total_referral_points}</div>
                                                <div className="text-[10px] text-slate-400">Referral</div>
                                            </div>
                                            <div className="text-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                                <div className="text-lg font-bold text-amber-400">{customer.total_used_points}</div>
                                                <div className="text-[10px] text-slate-400">Used</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</div>
                                            <div className="text-white text-sm font-medium">{customer.phone}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Joined</div>
                                            <div className="text-white text-sm font-medium">{new Date(customer.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Total Orders</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{orders_count}</p>
                                </div>
                                <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="h-5 w-5 text-indigo-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-gray-100 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Total Spent</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{total_orders_amount}</p>
                                </div>
                                <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Tables */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Points Ledger */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-500" />
                                <CardTitle className="text-lg font-semibold text-slate-800">Points History</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/30">
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                        <TableHead className="text-right w-[120px]">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {points_ledger.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                No points history available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        points_ledger.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium capitalize">
                                                    <Badge variant="outline" className={`
                                                        ${item.type === 'earn' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                        ${item.type === 'referral' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                        ${item.type === 'use' || item.type === 'redeem' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                    `}>
                                                        {item.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600 text-sm">{item.description}</TableCell>
                                                <TableCell className={`text-right font-bold ${item.points > 0 ? 'text-green-600' : 'text-slate-600'
                                                    }`}>
                                                    {item.points > 0 ? '+' : ''}{item.points}
                                                </TableCell>
                                                <TableCell className="text-right text-gray-500 text-sm">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-slate-500" />
                                    <CardTitle className="text-lg font-semibold text-slate-800">Recent Orders</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/30">
                                        <TableHead>Order #</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Points Earned</TableHead>
                                        <TableHead className="text-right w-[120px]">Date</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No orders found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.map((order) => (
                                            <TableRow
                                                key={order.id}
                                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => {
                                                    setSelectedOrderId(order.id);
                                                    setIsOrderModalOpen(true);
                                                }}
                                            >
                                                <TableCell className="font-medium text-slate-900">
                                                    #{order.order_number}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {order.total_amount}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {order.total_points_earned > 0 ? (
                                                        <span className="text-green-600 font-bold">+{order.total_points_earned}</span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-gray-500 text-sm">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <OrderDetailsModal
                orderId={selectedOrderId}
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
            />
        </div>
    );
}
