"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "../ui/button";

interface HelpToggleProps {
    currentPage?: "overview" | "availability" | "expenses";
}

const helpContent: Record<string, { title: string; description: string }[]> = {
    overview: [
        {
            title: "Room Overview",
            description:
                "This is your room dashboard. You can see a quick summary of members, best dates, and expenses at a glance.",
        },
        {
            title: "Members",
            description:
                "View all room members. The admin can remove members and lock the room to prevent new people from joining.",
        },
        {
            title: "Announcement",
            description:
                "The admin can post announcements with notices, place, time, and menu details that all members can see.",
        },
        {
            title: "Event Mode",
            description:
                "Toggle event mode to restrict non-admin members from seeing Availability and Expenses tabs. Useful for finalized events.",
        },
        {
            title: "Share & Invite",
            description:
                "Use the Share button in the header to send the invite link. The Copy button copies the room URL to your clipboard.",
        },
    ],
    availability: [
        {
            title: "Select Your Dates",
            description:
                "Tap on calendar dates when you're available. Selected dates are highlighted. Tap again to deselect.",
        },
        {
            title: "Best Date",
            description:
                "The app automatically finds dates where the most members are available and highlights the best option.",
        },
        {
            title: "Navigation",
            description:
                "Use the arrow buttons to move between months. Your selections are saved automatically.",
        },
    ],
    expenses: [
        {
            title: "Add an Expense",
            description:
                "Enter a description, choose equal or manual split, and add the amount. The expense is automatically split among all members.",
        },
        {
            title: "Equal Split",
            description:
                "Enter the total amount and it will be divided equally among all room members.",
        },
        {
            title: "Manual Split",
            description:
                "Add individual food items and prices for each member. You can also add VAT/tax as a percentage or fixed amount.",
        },
        {
            title: "Currency",
            description:
                "Change the currency using the currency button at the top of the Expenses page. Supports BDT, USD, EUR, GBP, INR, and JPY.",
        },
        {
            title: "Payment Method",
            description:
                'After adding expenses, use the Payment Method section to track who has paid. Choose between "Each" (equal shares) or "Manual Payment" mode.',
        },
        {
            title: "Each Mode",
            description:
                "Everyone pays an equal share. Mark each member as \"Paid\" once they've settled their portion.",
        },
        {
            title: "Manual Payment",
            description:
                "Select one or more payers and enter the exact amount each paid. The total must match the bill.",
        },
    ],
};

export function HelpToggle({ currentPage = "overview" }: HelpToggleProps) {
    const [open, setOpen] = useState(false);

    const items = helpContent[currentPage] || helpContent.overview;

    return (
        <>
            {/* Help button anchored bottom-right */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    variant="default"
                    size="icon"
                    onClick={() => setOpen(!open)}
                    className="w-12 h-12 rounded-full shadow-lg shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 text-white"
                    aria-label={open ? "Close help" : "Open help"}
                    aria-expanded={open}
                >
                    {open ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <HelpCircle className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {/* Help panel */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        className="fixed bottom-20 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Help panel"
                    >
                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Help</h3>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label="Dismiss help"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, i) => (
                                    <div key={i} className={i === 0 ? "" : "pl-3 border-l-2 border-blue-200"}>
                                        <h4 className="text-sm font-semibold text-blue-600 mb-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
