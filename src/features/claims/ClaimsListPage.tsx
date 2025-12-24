import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClaims } from "./api/claims";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Pagination } from "../../components/ui/pagination";
import { Plus, Search, Calendar, User, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/badge";

export default function ClaimsListPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // Status filter state (though not requested in UI sketch, user mentioned it in API request: status=&...)
    // const [status, setStatus] = useState("");

    const { data: claimsData, isLoading } = useQuery({
        queryKey: ['claims', page, search],
        queryFn: () => getClaims({ page, search, per_page: 15 }),
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Claims History</CardTitle>
                        <p className="text-sm text-gray-500">Manage reward redemptions.</p>
                    </div>
                    <Button
                        onClick={() => navigate("/claims/new")}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Claim
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="p-5 flex items-center gap-4 bg-white border-b border-gray-100">
                        <div className="relative w-full max-w-sm">
                            <Input
                                placeholder="Search by customer name or phone..."
                                className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-all"
                                value={search}
                                onChange={handleSearch}
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading claims...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-100">
                                            <TableHead className="w-[80px] font-semibold text-gray-600 pl-6">ID</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Rewards Items</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-600">Total Points</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-600 pr-6">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claimsData?.data.map((claim) => (
                                            <TableRow key={claim.id} className="hover:bg-slate-50 transition-colors border-gray-100">
                                                <TableCell className="font-mono text-xs text-gray-400 pl-6">#{claim.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 flex items-center gap-2">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                            {claim.customer.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 pl-5">{claim.customer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {claim.rewards.map((reward, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                                                <Gift className="h-3 w-3 text-slate-400" />
                                                                <span>{reward.reward_name || reward.product?.name || "Reward"}</span>
                                                                <span className="text-xs text-slate-400">({reward.pivot.points_used} pts)</span>
                                                            </div>
                                                        ))}
                                                        {claim.remarks && (
                                                            <div className="text-xs text-slate-500 italic mt-1">
                                                                "{claim.remarks}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                                        -{claim.points_used} pts
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="capitalize" variant={claim.status === 'completed' ? 'default' : 'secondary'}>
                                                        {claim.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(claim.created_at).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {claimsData?.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                    No claims found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Pagination
                                    currentPage={claimsData?.current_page || 1}
                                    totalPages={claimsData?.last_page || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
