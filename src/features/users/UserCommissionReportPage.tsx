import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUser, getStaffCommissionReport } from "./api/users";
import { getProducts } from "../master-data/api/products";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SearchableSelect } from "../../components/ui/searchable-select";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { format, isValid } from "date-fns";

export default function UserCommissionReportPage() {
    const { id } = useParams<{ id: string }>();
    const userId = Number(id);
    const navigate = useNavigate();

    // Safe date formatting helper
    const formatDateSafe = (dateValue: any, formatStr: string, fallback = '...') => {
        if (!dateValue) return fallback;
        const date = new Date(dateValue);
        if (!isValid(date)) return fallback;
        return format(date, formatStr);
    };

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        product_id: "",
    });

    // Handle month selection - sets first and last day of month
    const handleMonthChange = (monthValue: string) => {
        setSelectedMonth(monthValue);

        if (!monthValue) {
            setFilters(prev => ({ ...prev, start_date: "", end_date: "" }));
            return;
        }

        const [year, month] = monthValue.split('-');
        const firstDay = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDayFormatted = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

        setFilters(prev => ({ ...prev, start_date: firstDay, end_date: lastDayFormatted }));
    };

    // Set default month on mount
    useEffect(() => {
        handleMonthChange(getCurrentMonth());
    }, []);

    const { data: user } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => getUser(userId),
    });

    const { data: products } = useQuery({
        queryKey: ['products-all-for-report-filter'],
        queryFn: () => getProducts({ per_page: 500 }),
    });

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['commission-report', userId, filters],
        queryFn: () => getStaffCommissionReport({
            user_id: userId,
            start_date: filters.start_date || undefined,
            end_date: filters.end_date || undefined,
            product_id: (filters.product_id && filters.product_id !== "all") ? Number(filters.product_id) : undefined,
        }),
        enabled: !!filters.start_date && !!filters.end_date,
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        handleMonthChange(getCurrentMonth());
        setFilters(prev => ({ ...prev, product_id: "" }));
    };

    const productOptions = [
        { value: "all", label: "All Product" },
        ...(products?.map(p => {
            let label = p.name;
            if (p.color?.name || p.size?.name) {
                label += ` (${p.color?.name || ''}) [${p.size?.name || ''}]`;
            }
            return {
                value: p.id.toString(),
                label: label
            };
        }) || [])
    ];

    const reportItems = reportData?.data || [];
    const totalCommission = reportData?.total_commission || 0;

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/users/${userId}/commissions`)}
                            className="h-9 w-9 text-slate-500"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Commission Report</CardTitle>
                            <CardDescription>
                                Earnings summary for <span className="font-semibold text-slate-900">{user?.name}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Filters Bar */}
                    <div className="p-4 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Month Filter</label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
                            <Input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">End Date</label>
                            <Input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Product</label>
                            <SearchableSelect
                                options={productOptions}
                                value={filters.product_id}
                                onChange={(val) => handleFilterChange("product_id", val)}
                                placeholder="Select Product"
                                className="h-9"
                            />
                        </div>
                        <div className="lg:col-span-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-slate-500 hover:text-slate-700 h-8"
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset Filters
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-gray-100 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        <div className="p-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Commission</div>
                            <div className="text-3xl font-bold text-slate-900">₹{totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Items Tracked</div>
                            <div className="text-3xl font-bold text-slate-900">{reportItems.length || '0'}</div>
                        </div>
                        <div className="p-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Period</div>
                            <div className="text-lg font-bold text-slate-700 mt-1">
                                {formatDateSafe(filters.start_date, 'MMM dd')} - {formatDateSafe(filters.end_date, 'MMM dd, yyyy')}
                            </div>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="relative">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                                <p className="text-gray-500">Generating report...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="pl-6 py-3 font-semibold text-gray-600">Product</TableHead>
                                            <TableHead className="py-3 font-semibold text-gray-600 text-center">Commission</TableHead>
                                            <TableHead className="py-3 font-semibold text-gray-600 text-center">Sold</TableHead>
                                            <TableHead className="py-3 font-semibold text-gray-600 text-center">Ret.</TableHead>
                                            <TableHead className="py-3 font-semibold text-gray-600 text-center">Net Qty</TableHead>
                                            <TableHead className="py-3 font-semibold text-gray-600 text-right pr-6">Commission</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportItems.map((item: any, index: number) => (
                                            <TableRow key={index} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="pl-6 py-4 font-medium text-slate-900">
                                                    <div>{item.product?.name || item.product_name}</div>
                                                    {(item.product?.color?.name || item.product?.size?.name) && (
                                                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                                                            {item.product?.color?.name} {item.product?.size?.name && `• ${item.product?.size?.name}`}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4 text-center text-slate-600">
                                                    {item.commission_rate}
                                                </TableCell>
                                                <TableCell className="py-4 text-center font-medium">
                                                    {item.sold_quantity || 0}
                                                </TableCell>
                                                <TableCell className="py-4 text-center text-red-500">
                                                    {item.returned_quantity || 0}
                                                </TableCell>
                                                <TableCell className="py-4 text-center font-bold">
                                                    {item.net_quantity || 0}
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-6">
                                                    <span className="font-bold text-emerald-600">
                                                        ₹{parseFloat(item.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {reportItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                    No commission data found for this period.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
