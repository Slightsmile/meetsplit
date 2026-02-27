"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "../ui/button";

export function HelpToggle() {
    const [open, setOpen] = useState(false);

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
                        <div className="p-5 space-y-4">
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
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-600 mb-1">
                                        Payment Method
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        After adding expenses, use the Payment Method section to track who has paid. Choose between two modes to manage payments.
                                    </p>
                                </div>

                                <div className="pl-3 border-l-2 border-blue-200 space-y-2">
                                    <div>
                                        <h5 className="text-sm font-semibold text-slate-800">
                                            Each
                                        </h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Everyone pays an equal share. Mark each member as &ldquo;Paid&rdquo; once they&apos;ve settled their portion. No manual amount editing — it&apos;s automatically calculated.
                                        </p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-semibold text-slate-800">
                                            Manual Payment
                                        </h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Select one or more payers and enter the exact amount each paid. The total of all payments must match the bill. Non-paying members will see how much they owe to the payers.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-blue-600 mb-1">
                                        Invite Link
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Tap the <strong>Share Invite Link</strong> button at the top to share the room invite. You can also copy the room code directly using the Copy Code button.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
