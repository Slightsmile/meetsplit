"use client";

import { useState } from "react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { Button } from "../ui/button";
import { updateAvailability } from "@/lib/firebase/firestore";
import { UserAvailability } from "@/types/firebase";
import { Loader2, Clock, X } from "lucide-react";

const TIME_OPTIONS = [
    "Morning (8-12)",
    "Afternoon (12-17)",
    "Evening (17-21)",
    "Night (21+)",
];

interface Props {
    roomId: string;
    userId: string;
    myAvailability: UserAvailability | undefined;
}

export function AvailabilityCalendar({ roomId, userId, myAvailability }: Props) {
    // Extract initial dates and time slots
    const initialDates = new Set<string>();
    const initialTimeSlots: Record<string, string[]> = {};
    if (myAvailability?.dates) {
        Object.entries(myAvailability.dates).forEach(([date, details]) => {
            if (details.isAvailable) {
                initialDates.add(date);
                if (details.timeSlots?.length) {
                    initialTimeSlots[date] = details.timeSlots;
                }
            }
        });
    }

    const [selectedDates, setSelectedDates] = useState<Set<string>>(initialDates);
    const [timeSlots, setTimeSlots] = useState<Record<string, string[]>>(initialTimeSlots);
    const [expandedDate, setExpandedDate] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Generate next 14 days for a simple MVP
    const today = startOfToday();
    const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

    const saveAvailability = async (dates: Set<string>, slots: Record<string, string[]>) => {
        setIsSaving(true);
        await updateAvailability(roomId, userId, Array.from(dates), slots);
        setIsSaving(false);
    };

    const toggleDate = async (dateStr: string) => {
        const newDates = new Set(selectedDates);
        const newSlots = { ...timeSlots };
        if (newDates.has(dateStr)) {
            newDates.delete(dateStr);
            delete newSlots[dateStr];
            if (expandedDate === dateStr) setExpandedDate(null);
        } else {
            newDates.add(dateStr);
        }

        setSelectedDates(newDates);
        setTimeSlots(newSlots);
        await saveAvailability(newDates, newSlots);
    };

    const toggleTimeSlot = async (dateStr: string, slot: string) => {
        const current = timeSlots[dateStr] || [];
        let updated: string[];
        if (current.includes(slot)) {
            updated = current.filter(s => s !== slot);
        } else {
            updated = [...current, slot];
        }
        const newSlots = { ...timeSlots, [dateStr]: updated };
        if (updated.length === 0) delete newSlots[dateStr];
        setTimeSlots(newSlots);
        await saveAvailability(selectedDates, newSlots);
    };

    const handleExpandTime = (e: React.MouseEvent, dateStr: string) => {
        e.stopPropagation();
        setExpandedDate(expandedDate === dateStr ? null : dateStr);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-slate-900">Your Availability</h3>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isSelected = selectedDates.has(dateStr);
                    const isToday = isSameDay(day, today);
                    const hasTimeSlots = (timeSlots[dateStr]?.length ?? 0) > 0;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => toggleDate(dateStr)}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                                }`}
                        >
                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                {format(day, "EEE")}
                            </span>
                            <span className={`text-xl font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {format(day, "d")}
                            </span>
                            {isToday && (
                                <span className={`text-[10px] mt-1 ${isSelected ? 'text-blue-200' : 'text-blue-600 font-medium'}`}>
                                    Today
                                </span>
                            )}
                            {isSelected && (
                                <button
                                    onClick={(e) => handleExpandTime(e, dateStr)}
                                    className={`mt-1 p-0.5 rounded ${hasTimeSlots ? 'text-yellow-200' : 'text-blue-200'} hover:text-white`}
                                    title="Set time preference"
                                >
                                    <Clock className="w-3 h-3" />
                                </button>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Time slot picker for expanded date */}
            {expandedDate && selectedDates.has(expandedDate) && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">
                            Time preference for {format(new Date(expandedDate), "MMM do")}
                            <span className="text-xs font-normal text-slate-500 ml-2">(optional)</span>
                        </h4>
                        <button onClick={() => setExpandedDate(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TIME_OPTIONS.map(slot => {
                            const isActive = timeSlots[expandedDate]?.includes(slot);
                            return (
                                <button
                                    key={slot}
                                    onClick={() => toggleTimeSlot(expandedDate, slot)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                        isActive
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                                    }`}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-400">
                Tap a date to toggle availability. Use the clock icon to optionally set preferred time ranges.
            </p>
        </div>
    );
}
