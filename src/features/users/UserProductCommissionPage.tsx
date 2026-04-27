import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUser, getStaffProductCommissions, saveStaffProductCommissions, type StaffProductCommissionPayload } from "./api/users";
import { getProducts } from "../master-data/api/products";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Save, Loader2, Search, Coins, AlertCircle, FileText, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { toast } from "sonner";

export default function UserProductCommissionPage() {
    const { id } = useParams<{ id: string }>();
    const userId = Number(id);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [commissions, setCommissions] = useState<{ [productId: number]: number }>({});
    const [isDirty, setIsDirty] = useState(false);
    const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => getUser(userId),
    });

    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products-all-commissions'],
        queryFn: () => getProducts({ per_page: 200 }),
    });

    const { data: commissionData, isLoading: isLoadingCommissions } = useQuery({
        queryKey: ['staff-commissions', userId],
        queryFn: () => getStaffProductCommissions(userId),
    });

    useEffect(() => {
        if (commissionData) {
            const initialCommissions: { [productId: number]: number } = {};
            const commissionList = Array.isArray(commissionData) ? commissionData : (commissionData as any).data || [];

            commissionList.forEach((comm: any) => {
                initialCommissions[comm.product_id] = Number(comm.commission_rate);
            });
            setCommissions(initialCommissions);
        }
    }, [commissionData]);

    const saveMutation = useMutation({
        mutationFn: saveStaffProductCommissions,
        onSuccess: () => {
            toast.success("Commissions saved successfully!");
            setIsDirty(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to save commissions");
        }
    });

    const handleCommissionChange = (productId: number, value: string, isMainProduct: boolean = false) => {
        setIsDirty(true);
        const numValue = parseFloat(value);
        const newCommissionRate = isNaN(numValue) ? 0 : numValue;
        
        setCommissions(prev => {
            const next = { ...prev, [productId]: newCommissionRate };
            if (isMainProduct && products) {
                const variants = products.filter(p => p.parent_id === productId);
                variants.forEach(v => {
                    next[v.id as number] = newCommissionRate;
                });
            }
            return next;
        });
    };

    const handleSave = () => {
        const payload: StaffProductCommissionPayload = {
            commissions: Object.entries(commissions)
                .filter(([_, rate]) => rate >= 0)
                .map(([productId, rate]) => ({
                    user_id: userId,
                    product_id: Number(productId),
                    commission_rate: rate
                }))
        };
        saveMutation.mutate(payload);
    };

    const mainProducts = products?.filter(p => !p.parent_id) || [];
    
    const filteredMainProducts = mainProducts.filter(mainProduct => {
        const matchesName = mainProduct.name.toLowerCase().includes(searchTerm.toLowerCase());
        const variants = products?.filter(p => p.parent_id === mainProduct.id) || [];
        const variantMatches = variants.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesName || variantMatches;
    });

    const toggleAccordion = (id: number) => {
        setOpenAccordionId(openAccordionId === id ? null : id);
    };

    const isLoading = isLoadingUser || isLoadingProducts || isLoadingCommissions;

    if (isLoading) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading commissions dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/users')}
                            className="h-9 w-9 text-slate-500"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold">Product Commissions</CardTitle>
                                {isDirty && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">
                                        Unsaved
                                    </span>
                                )}
                            </div>
                            <CardDescription>
                                Set individual commission rates for <span className="font-semibold text-slate-900">{user?.name}</span>
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/users/${userId}/commission-report`)}
                            className="flex-1 sm:flex-none"
                        >
                            <FileText className="h-4 w-4 mr-2" /> View Report
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saveMutation.isPending || !isDirty}
                            className="bg-slate-900 hover:bg-slate-800 text-white flex-1 sm:flex-none"
                        >
                            {saveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                className="pl-9 h-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                    <TableHead className="pl-6 py-3 font-semibold text-gray-600">Product Details</TableHead>
                                    <TableHead className="py-3 font-semibold text-gray-600 text-right pr-6 w-[200px]">Commission %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMainProducts.map((mainProduct) => {
                                    const isExpanded = openAccordionId === mainProduct.id;
                                    const variants = products?.filter(p => p.parent_id === mainProduct.id) || [];
                                    const hasVariants = variants.length > 0;

                                    return (
                                        <React.Fragment key={mainProduct.id}>
                                            <TableRow 
                                                className={`transition-colors border-gray-100 ${hasVariants ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                                                onClick={() => hasVariants && toggleAccordion(mainProduct.id as number)}
                                            >
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 flex justify-center">
                                                            {hasVariants ? (
                                                                isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-500" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                                                            ) : null}
                                                        </div>
                                                        {mainProduct.image_url ? (
                                                            <img src={mainProduct.image_url} alt="" className="h-10 w-10 rounded bg-white object-cover border border-slate-200" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                                                                <Coins className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-slate-900">{mainProduct.name}</div>
                                                            <div className={`text-[10px] flex items-center gap-2 mt-0.5 uppercase tracking-wider font-semibold ${isExpanded ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                                Main Product {hasVariants && `• ${variants.length} Variants`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end items-center gap-3">
                                                        {hasVariants && isExpanded && (
                                                            <span className="text-xs text-indigo-500 font-medium whitespace-nowrap bg-indigo-100/50 px-2 py-1 rounded hidden sm:inline-block">
                                                                Applies to variants
                                                            </span>
                                                        )}
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            className={`w-24 h-9 text-right font-medium ${isExpanded ? 'border-indigo-200 focus-visible:ring-indigo-500' : ''}`}
                                                            value={commissions[mainProduct.id as number] ?? ""}
                                                            onChange={(e) => handleCommissionChange(mainProduct.id as number, e.target.value, true)}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && variants.map((variant) => (
                                                <TableRow key={variant.id} className="bg-slate-50/30 hover:bg-slate-50/80 transition-colors border-gray-100">
                                                    <TableCell className="py-3 pl-10">
                                                        <div className="flex items-start gap-2">
                                                            <CornerDownRight className="h-4 w-4 text-slate-300 mt-2 shrink-0" />
                                                            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-md border border-slate-100 shadow-sm w-full">
                                                                {variant.image_url ? (
                                                                    <img src={variant.image_url} alt="" className="h-8 w-8 rounded bg-slate-50 object-cover border border-slate-100" />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center text-slate-300">
                                                                        <Coins className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="text-sm font-medium text-slate-800">{variant.name}</div>
                                                                    <div className="text-[10px] flex items-center gap-2 mt-0.5 uppercase tracking-wider font-semibold">
                                                                        <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Variant</span>
                                                                        {variant.color?.name && (
                                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Color: {variant.color.name}</span>
                                                                        )}
                                                                        {variant.size?.name && (
                                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Size: {variant.size.name}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                className="w-24 h-8 text-right text-sm"
                                                                value={commissions[variant.id as number] ?? ""}
                                                                onChange={(e) => handleCommissionChange(variant.id as number, e.target.value, false)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                                {filteredMainProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-32 text-center text-gray-400">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="text-sm text-blue-700">
                    <span className="font-bold">Note:</span> Commissions will be applied to future sales. Enter <span className="font-bold">0</span> to remove a commission.
                </div>
            </div>
        </div>
    );
}
