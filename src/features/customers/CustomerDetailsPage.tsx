import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "./api/customers";
import { getLoyalties } from "../loyalties/api/loyalties";
import { getRewards } from "../rewards/api/rewards";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, TrendingUp, ShoppingBag, Copy, ExternalLink, History, Eye, MessageCircle, Download } from "lucide-react";
import QRCode from "react-qr-code";
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

    const { data: brochureLoyalties } = useQuery({
        queryKey: ['loyalties', 'brochure'],
        queryFn: () => getLoyalties({ is_active: true, is_show_to_brochure: true, per_page: 6 }),
    });

    const { data: brochureRewards } = useQuery({
        queryKey: ['rewards', 'brochure'],
        queryFn: () => getRewards({ is_active: true, is_show_to_brochure: true, per_page: 6 }),
    });

    // Helper to convert image URL to Base64 (Shared)
    const toDataURL = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
            });

            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn('Failed to convert image to Base64:', url, error);
            return null;
        }
    };

    const generateCardBlob = async () => {
        if (!cardRef.current) return null;

        const images = cardRef.current.querySelectorAll('img');
        const originalState: Map<HTMLImageElement, { src: string; style: string }> = new Map();

        try {
            // 1. Convert all images to Base64
            await Promise.all(Array.from(images).map(async (img) => {
                // Optimization: Skip product images as they are hidden
                if (img.closest('.product-image-wrapper')) return;

                // Save original state
                originalState.set(img, {
                    src: img.src,
                    style: img.getAttribute('style') || ''
                });

                const src = img.src;
                // Only convert if it's a remote URL
                if (src.startsWith('http') || src.startsWith('//')) {
                    const base64 = await toDataURL(src);
                    if (base64) {
                        img.src = base64;
                    } else {
                        // If failed, hide the image to prevent tainting/broken UI
                        img.style.display = 'none';
                    }
                }
            }));

            // 2. Wait for all images to handle (load or error)
            await Promise.all(Array.from(images).map(img => {
                if (img.style.display === 'none') return Promise.resolve();
                if (img.complete && img.naturalHeight !== 0) return Promise.resolve();

                return new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    setTimeout(resolve, 2000);
                });
            }));

            // Small delay for layout strictness
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#1e293b', // Match card bg
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: false,
                windowWidth: 1280,
                onclone: (clonedDoc) => {
                    const clonedWrapper = clonedDoc.getElementById('loyalty-card-wrapper');
                    if (clonedWrapper) {
                        clonedWrapper.style.width = '800px';
                        clonedWrapper.style.maxWidth = 'none';
                        clonedWrapper.style.margin = '0 auto';
                        clonedWrapper.style.transform = 'none';

                        const contentContainer = clonedWrapper.querySelector('.relative.p-5');
                        if (contentContainer instanceof HTMLElement) {
                            contentContainer.style.paddingBottom = '24px';
                        }

                        const content = clonedWrapper.querySelector('.md\\:grid-cols-2');
                        if (content instanceof HTMLElement) {
                            content.classList.remove('grid-cols-1');
                            content.classList.add('grid-cols-2');
                        }
                    }

                    const pointsEl = clonedDoc.getElementById('total-points-display');
                    if (pointsEl) {
                        pointsEl.style.background = 'none';
                        pointsEl.style.webkitTextFillColor = 'initial';
                        pointsEl.style.color = '#fbbf24';
                    }


                    // Hide product images in the screenshot
                    const productWrappers = clonedDoc.querySelectorAll('.product-image-wrapper');
                    productWrappers.forEach(el => {
                        if (el instanceof HTMLElement) el.style.display = 'none';
                    });

                    // Improve styling for loyalty cards in download (since images are gone)
                    // TRANSFORMATION: Make "Earn Points" look like "Redeem Points"
                    const earnGrid = clonedDoc.getElementById('earn-points-grid');
                    if (earnGrid) {
                        // Change Grid to List
                        earnGrid.classList.remove('grid', 'grid-cols-2', 'gap-2', 'md:gap-3');
                        earnGrid.style.display = 'flex';
                        earnGrid.style.flexDirection = 'column';
                        earnGrid.style.gap = '12px'; // space-y-3 equivalent

                        const cards = earnGrid.querySelectorAll('.loyalty-item-card');
                        cards.forEach((card) => {
                            if (card instanceof HTMLElement) {
                                let name = '';
                                let points = '';

                                const children = Array.from(card.children) as HTMLElement[];
                                children.forEach(child => {
                                    const text = child.textContent?.trim() || '';
                                    if (text.includes('POINTS')) {
                                        points = text.replace(/\D/g, '');
                                    } else if (text && !child.classList.contains('product-image-wrapper')) {
                                        name = text;
                                    }
                                });

                                // Reset Card Styling
                                card.className = '';
                                card.style.cssText = `
                                        display: flex;
                                        align-items: center;
                                        padding: 8px;
                                        border-radius: 12px;
                                        background-color: rgba(255, 255, 255, 0.05);
                                        border: 1px solid rgba(255, 255, 255, 0.1);
                                        width: 100%;
                                        box-sizing: border-box;
                                    `;

                                // Reconstruct HTML Content
                                card.innerHTML = `
                                        <div style="
                                            background-color: white;
                                            border-radius: 8px;
                                            padding: 8px 12px;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            justify-content: center;
                                            min-width: 70px;
                                            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                                        ">
                                            <div style="
                                                color: #16a34a; /* green-600 */
                                                font-weight: 900;
                                                font-size: 18px;
                                                line-height: 1;
                                            ">${points}</div>
                                            <div style="
                                                font-size: 8px;
                                                color: rgba(22, 163, 74, 0.8);
                                                font-weight: 700;
                                                text-transform: uppercase;
                                                letter-spacing: 0.05em;
                                                margin-top: 2px;
                                            ">POINTS</div>
                                        </div>
                                        <div style="
                                            margin-left: 16px;
                                            flex: 1;
                                        ">
                                            <div style="
                                                color: white;
                                                font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
                                                font-size: 18px;
                                                font-weight: 500;
                                                letter-spacing: 0.025em;
                                                line-height: 1.25;
                                            ">${name}</div>
                                        </div>
                                    `;
                            }
                        });
                    }
                }
            });

            return new Promise<Blob | null>((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });

        } catch (error) {
            console.error('Failed to generate image:', error);
            return null;
        } finally {
            // Restore original image sources and styles
            originalState.forEach((state, img) => {
                img.src = state.src;
                if (state.style) {
                    img.setAttribute('style', state.style);
                } else {
                    img.removeAttribute('style');
                }
            });
        }
    };





    const copyPublicLink = () => {
        if (customerData?.customer?.unique_id) {
            const url = `${window.location.origin}/c/${customerData.customer.unique_id}`;
            navigator.clipboard.writeText(url);
            toast.success("Public profile link copied to clipboard");
        }
    };

    const sendToWhatsapp = async () => {
        if (customerData?.customer?.unique_id) {
            const customer = customerData.customer;
            // Use whatsapp_no if available, otherwise phone
            const phoneNumber = customer.whatsapp_no || customer.phone;

            if (!phoneNumber) {
                toast.error("No phone number available for this customer");
                return;
            }

            toast.info("Generating card image...");

            // Generate and copy image
            const blob = await generateCardBlob();
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    toast.success("Card image copied! PASTE it in WhatsApp (Ctrl+V)");
                } catch (err) {
                    console.error('Failed to copy image to clipboard:', err);
                    toast.warning("Could not copy image automatically. Please download it manually.");
                }
            }

            const url = `${window.location.origin}/c/${customer.unique_id}`;
            const message = `Hi ${customer.name},\n\nHere is your loyalty card link: ${url}`;
            const encodedMessage = encodeURIComponent(message);
            // Remove any non-numeric characters from the phone number
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            // Small delay to ensure clipboard operation completes and toast is visible
            setTimeout(() => {
                window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
            }, 500);
        } else {
            toast.error("Customer data not loaded yet");
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
                        className="gap-2 bg-white text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                        onClick={sendToWhatsapp}
                    >
                        <MessageCircle className="h-4 w-4" />
                        Send on WhatsApp
                    </Button>
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
                        variant="outline"
                        className="gap-2 bg-white"
                        onClick={async () => {
                            toast.info("Generating card image...");
                            const blob = await generateCardBlob();
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `loyalty-card-${customerData.customer.unique_id}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                toast.success("Card downloaded successfully");
                            } else {
                                toast.error("Failed to generate card image");
                            }
                        }}
                    >
                        <Download className="h-4 w-4" />
                        Download Image
                    </Button>


                </div>
            </div>

            <div className="space-y-10">
                {/* Top Section: Loyalty Card */}
                <div className="flex justify-center">
                    <div id="loyalty-card-wrapper" ref={cardRef} className="w-full max-w-3xl relative transform transition-transform hover:scale-[1.01] duration-300">
                        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                            <CardContent className="p-0">
                                {/* Decorative Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                                </div>

                                <div className="relative p-5 md:p-10">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between mb-6 md:mb-8">
                                        <div>
                                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{customer.name}</h1>
                                            <p className="text-white/90 text-sm md:text-base mt-1 font-mono tracking-wide">{customer.phone}</p>
                                            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Loyalty Member</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="bg-white p-1.5 md:p-2 rounded-lg">
                                                <QRCode
                                                    value={`${window.location.origin}/c/${customer.unique_id}`}
                                                    size={64}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    viewBox={`0 0 256 256`}
                                                />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Member ID</div>
                                                <div className="text-sm md:text-lg font-mono font-bold text-white">{customer.unique_id}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Points Display */}
                                    <div className="mb-6 md:mb-8">
                                        <div className="text-center mb-6 md:mb-8">
                                            <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-2">Total Available Points</div>
                                            <div
                                                id="total-points-display"
                                                className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
                                            >
                                                {/* @ts-ignore */}
                                                {customer.available_points ?? totalPoints}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto">
                                            <div className="text-center p-2 md:p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                                <div className="text-xl md:text-2xl font-bold text-green-400">{customer.total_earned_points}</div>
                                                <div className="text-[10px] md:text-xs text-slate-400 mt-1">Earned</div>
                                            </div>
                                            <div className="text-center p-2 md:p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                                <div className="text-xl md:text-2xl font-bold text-blue-400">{customer.total_referral_points}</div>
                                                <div className="text-[10px] md:text-xs text-slate-400 mt-1">Referral</div>
                                            </div>
                                            <div className="text-center p-2 md:p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                <div className="text-xl md:text-2xl font-bold text-amber-400">{customer.total_used_points}</div>
                                                <div className="text-[10px] md:text-xs text-slate-400 mt-1">Used</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brochure Section */}
                                    {((brochureLoyalties?.data && brochureLoyalties.data.length > 0) || (brochureRewards?.data && brochureRewards.data.length > 0)) && (
                                        <div className="mb-0 border-t border-white/10 pt-4 md:pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                                {/* Loyalties - Earn Points (Grid Layout) */}
                                                {brochureLoyalties?.data && brochureLoyalties.data.length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] md:text-xs text-green-400 uppercase tracking-wider mb-3 md:mb-4 font-semibold flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                                            Earn Points
                                                        </div>
                                                        <div id="earn-points-grid" className="grid grid-cols-2 gap-2 md:gap-3">
                                                            {brochureLoyalties.data.map((loyalty) => (
                                                                <div key={loyalty.id} className="loyalty-item-card flex flex-col items-center p-2 bg-white rounded-xl shadow-sm text-center h-full">
                                                                    <div className="product-image-wrapper h-16 md:h-20 w-full mb-2 flex items-center justify-center bg-gray-50 rounded-lg p-1 overflow-hidden">
                                                                        {loyalty.product?.image_url ? (
                                                                            <img
                                                                                src={loyalty.product.image_url}
                                                                                alt={loyalty.product.name}
                                                                                className="h-full w-full object-contain"
                                                                            />
                                                                        ) : (
                                                                            <ShoppingBag className="h-6 md:h-8 w-6 md:w-8 text-gray-300" />
                                                                        )}
                                                                    </div>
                                                                    <div className="text-slate-900 font-extrabold uppercase text-[9px] md:text-[10px] leading-tight mb-1 line-clamp-2 px-1">
                                                                        {loyalty.product?.name}
                                                                    </div>
                                                                    <div className="text-slate-900 font-bold text-[10px] md:text-xs mt-auto">
                                                                        {loyalty.points} POINTS
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rewards - Redeem Points (List Layout) */}
                                                {brochureRewards?.data && brochureRewards.data.length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] md:text-xs text-amber-400 uppercase tracking-wider mb-3 md:mb-4 font-semibold flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                                                            Redeem Points
                                                        </div>
                                                        <div className="space-y-2 md:space-y-3">
                                                            {brochureRewards.data.map((reward) => (
                                                                <div key={reward.id} className="flex items-center p-2 rounded-xl bg-white/5 border border-white/10">
                                                                    {/* Points Badge */}
                                                                    <div className="bg-white rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex flex-col items-center justify-center min-w-[60px] md:min-w-[70px] shadow-sm">
                                                                        <div className="text-amber-600 font-black text-base md:text-lg leading-none">
                                                                            {reward.required_points}
                                                                        </div>
                                                                        <div className="text-[7px] md:text-[8px] text-amber-600/80 font-bold uppercase tracking-wider mt-0.5">
                                                                            POINTS
                                                                        </div>
                                                                    </div>
                                                                    {/* Reward Name */}
                                                                    <div className="ml-3 md:ml-4 flex-1">
                                                                        <div className="text-white font-serif text-base md:text-lg font-medium tracking-wide leading-tight">
                                                                            {reward.reward_name || reward.product?.name || "Reward"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="pt-4 md:pt-6 mt-2 md:mt-3 border-t border-white/10 flex justify-between items-end">
                                        {/* <div>
                                            <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Phone</div>
                                            <div className="text-white text-sm md:text-base font-medium">{customer.phone}</div>
                                        </div> */}
                                        {customer.whatsapp_no && (
                                            <div className="text-center">
                                                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">WhatsApp</div>
                                                <div className="text-white text-sm md:text-base font-medium">{customer.whatsapp_no}</div>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Joined</div>
                                            <div className="text-white text-sm md:text-base font-medium">{new Date(customer.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Middle Grid: Stats */}
                < div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full" >
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Total Orders</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{orders_count}</p>
                            </div>
                            <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Total Spent</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{total_orders_amount}</p>
                            </div>
                            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div >

                {/* Bottom Grid: Tables */}
                < div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
                    {/* Points Ledger */}
                    < Card className="border-gray-100 shadow-sm flex flex-col h-full" >
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-500" />
                                <CardTitle className="text-lg font-semibold text-slate-800">Points History</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto">
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {points_ledger.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No points history available
                                    </div>
                                ) : (
                                    points_ledger.map((item) => (
                                        <div key={item.id} className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className={`
                                                    ${item.type === 'earn' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                    ${item.type === 'referral' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                    ${item.type === 'use' || item.type === 'redeem' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                `}>
                                                    {item.type}
                                                </Badge>
                                                <span className={`font-bold ${item.points > 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                                    {item.points > 0 ? '+' : ''}{item.points}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                {item.description}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
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
                            </div>
                        </CardContent>
                    </Card >

                    {/* Recent Orders */}
                    < Card className="border-gray-100 shadow-sm flex flex-col h-full" >
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-slate-500" />
                                    <CardTitle className="text-lg font-semibold text-slate-800">Recent Orders</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto">
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {orders.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No orders found
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-4 space-y-2 cursor-pointer active:bg-gray-50"
                                            onClick={() => {
                                                setSelectedOrderId(order.id);
                                                setIsOrderModalOpen(true);
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="font-medium text-slate-900">#{order.order_number}</div>
                                                <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-gray-600">
                                                    Amount: <span className="font-medium text-slate-900">{order.total_amount}</span>
                                                </div>
                                                <div className="text-right">
                                                    {order.total_points_earned > 0 ? (
                                                        <span className="text-green-600 font-bold">+{order.total_points_earned} pts</span>
                                                    ) : (
                                                        <span className="text-gray-400">0 pts</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
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
                            </div>
                        </CardContent>
                    </Card >
                </div >
            </div >

            <OrderDetailsModal
                orderId={selectedOrderId}
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
            />
        </div >
    );
}
