"use client";

import { useState } from "react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { Button } from "../ui/button";
import { updateAvailability } from "@/lib/firebase/firestore";
import { UserAvailability } from "@/types/firebase";
import { Loader2, Clock, X } from "lucide-react";

// Generate hours for the picker
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = ["00", "15", "30", "45"];

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
    const [activeDate, setActiveDate] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Time picker state for the expanded date
    const [pickerHour, setPickerHour] = useState(12);
    const [pickerMinute, setPickerMinute] = useState("00");
    const [pickerPeriod, setPickerPeriod] = useState<"AM" | "PM">("AM");
    const [use24h, setUse24h] = useState(false);
    const [picker24Hour, setPicker24Hour] = useState(0);

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
            if (activeDate === dateStr) setActiveDate(null);
        } else {
            newDates.add(dateStr);
            setActiveDate(dateStr);
        }

        setSelectedDates(newDates);
        setTimeSlots(newSlots);
        await saveAvailability(newDates, newSlots);
    };

    const addTimeSlot = async (dateStr: string) => {
        let timeStr: string;
        if (use24h) {
            timeStr = `${String(picker24Hour).padStart(2, "0")}:${pickerMinute}`;
        } else {
            timeStr = `${pickerHour}:${pickerMinute} ${pickerPeriod}`;
        }

        const current = timeSlots[dateStr] || [];
        if (current.includes(timeStr)) return; // already added

        const updated = [...current, timeStr];
        const newSlots = { ...timeSlots, [dateStr]: updated };
        setTimeSlots(newSlots);
        await saveAvailability(selectedDates, newSlots);
    };

    const removeTimeSlot = async (dateStr: string, slot: string) => {
        const current = timeSlots[dateStr] || [];
        const updated = current.filter(s => s !== slot);
        const newSlots = { ...timeSlots, [dateStr]: updated };
        if (updated.length === 0) delete newSlots[dateStr];
        setTimeSlots(newSlots);
        await saveAvailability(selectedDates, newSlots);
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
                    const isActive = activeDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => {
                                if (isSelected) {
                                    if (isActive) {
                                        // Clicking active selected date deselects it
                                        toggleDate(dateStr);
                                    } else {
                                        // Clicking another selected date switches the time picker
                                        setActiveDate(dateStr);
                                    }
                                } else {
                                    toggleDate(dateStr);
                                }
                            }}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${isSelected
                                ? isActive
                                    ? "bg-gradient-to-br from-[#09d6ba] to-[#017e8c] border-transparent text-white shadow-lg ring-2 ring-teal-300"
                                    : "bg-meet-500 border-meet-500 text-white shadow-md hover:opacity-90"
                                : "bg-white border-slate-200 text-slate-700 hover:border-meet-300 hover:bg-meet-50"
                                }`}
                        >
                            <span className={`text-xs font-medium ${isSelected ? 'text-meet-100' : 'text-slate-500'}`}>
                                {format(day, "EEE")}
                            </span>
                            <span className={`text-xl font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {format(day, "d")}
                            </span>
                            {isToday && (
                                <span className={`text-[10px] mt-1 ${isSelected ? 'text-meet-200' : 'text-meet-600 font-medium'}`}>
                                    Today
                                </span>
                            )}
                            {isSelected && hasTimeSlots && (
                                <Clock className="w-3 h-3 mt-1 text-yellow-200" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Time picker — always shown */}
            <div className="p-4 rounded-xl border border-meet-100 bg-white shadow-sm space-y-4">
                {activeDate && selectedDates.has(activeDate) ? (
                    <>
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">
                                <Clock className="w-4 h-4 inline mr-1 text-meet-500" />
                                Set time for {format(new Date(activeDate), "MMM do")}
                                <span className="text-xs font-normal text-slate-500 ml-2">(optional)</span>
                            </h4>
                            <button onClick={() => toggleDate(activeDate)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                Remove date
                            </button>
                        </div>

                        {/* Format toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Format:</span>
                            <button
                                onClick={() => setUse24h(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${!use24h ? "bg-meet-600 text-white border-meet-600 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                12h
                            </button>
                            <button
                                onClick={() => setUse24h(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${use24h ? "bg-meet-600 text-white border-meet-600 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                24h
                            </button>
                        </div>

                        {/* Time picker controls */}
                        <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit">
                            {use24h ? (
                                <>
                                    <select
                                        value={picker24Hour}
                                        onChange={(e) => setPicker24Hour(Number(e.target.value))}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-meet-500 shadow-sm"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                                        ))}
                                    </select>
                                    <span className="text-slate-400 font-bold">:</span>
                                    <select
                                        value={pickerMinute}
                                        onChange={(e) => setPickerMinute(e.target.value)}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-meet-500 shadow-sm"
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </>
                            ) : (
                                <>
                                    <select
                                        value={pickerHour}
                                        onChange={(e) => setPickerHour(Number(e.target.value))}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-meet-500 shadow-sm"
                                    >
                                        {HOURS_12.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span className="text-slate-400 font-bold">:</span>
                                    <select
                                        value={pickerMinute}
                                        onChange={(e) => setPickerMinute(e.target.value)}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-meet-500 shadow-sm"
                                    >
                                        {MINUTES.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <div className="flex border border-slate-300 rounded-md overflow-hidden ml-1 shadow-sm">
                                        <button
                                            onClick={() => setPickerPeriod("AM")}
                                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${pickerPeriod === "AM" ? "bg-meet-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            onClick={() => setPickerPeriod("PM")}
                                            className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-slate-300 ${pickerPeriod === "PM" ? "bg-meet-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </>
                            )}
                            <Button size="sm" onClick={() => addTimeSlot(activeDate)} className="ml-2 shadow-sm">
                                Add Time
                            </Button>
                        </div>

                        {/* Added time slots */}
                        {(timeSlots[activeDate]?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 mt-2">
                                {timeSlots[activeDate].map(slot => (
                                    <span key={slot} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-meet-100 text-meet-700 rounded-full text-xs font-semibold shadow-sm border border-meet-200">
                                        <Clock className="w-3.5 h-3.5" />
                                        {slot}
                                        <button
                                            onClick={() => removeTimeSlot(activeDate, slot)}
                                            className="ml-1 hover:text-meet-900 focus:outline-none"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Clock className="w-10 h-10 text-slate-200 mb-2" />
                        <h4 className="text-sm font-medium text-slate-600">No Date Selected</h4>
                        <p className="text-xs text-slate-400 max-w-xs mt-1">Select a date from the calendar above to set available times for that specific day.</p>

                        {/* Disabled Placeholder UI for Time Picker */}
                        <div className="flex items-center gap-2 mt-4 opacity-50 grayscale pointer-events-none">
                            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-400">12</div>
                                <span className="text-slate-300 font-bold">:</span>
                                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-400">00</div>
                                <div className="flex border border-slate-200 rounded overflow-hidden ml-1">
                                    <div className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-500">AM</div>
                                </div>
                                <div className="px-3 py-1.5 bg-slate-200 text-slate-400 rounded-md text-sm font-medium ml-2">Add Time</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-400">
                Tap a date to toggle availability. Select a date to set preferred times.
            </p>
        </div>
    );
}
