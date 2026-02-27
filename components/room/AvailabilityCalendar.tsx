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
                                        ? "bg-blue-700 border-blue-700 text-white shadow-lg ring-2 ring-blue-300"
                                        : "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700"
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
                            {isSelected && hasTimeSlots && (
                                <Clock className="w-3 h-3 mt-1 text-yellow-200" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Time picker — always shown for the active selected date */}
            {activeDate && selectedDates.has(activeDate) && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">
                            <Clock className="w-4 h-4 inline mr-1" />
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
                            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                !use24h ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"
                            }`}
                        >
                            12h
                        </button>
                        <button
                            onClick={() => setUse24h(true)}
                            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                use24h ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"
                            }`}
                        >
                            24h
                        </button>
                    </div>

                    {/* Time picker controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {use24h ? (
                            <>
                                <select
                                    value={picker24Hour}
                                    onChange={(e) => setPicker24Hour(Number(e.target.value))}
                                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                                    ))}
                                </select>
                                <span className="text-slate-500 font-bold">:</span>
                                <select
                                    value={pickerMinute}
                                    onChange={(e) => setPickerMinute(e.target.value)}
                                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
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
                                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {HOURS_12.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                                <span className="text-slate-500 font-bold">:</span>
                                <select
                                    value={pickerMinute}
                                    onChange={(e) => setPickerMinute(e.target.value)}
                                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {MINUTES.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <div className="flex border border-slate-300 rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setPickerPeriod("AM")}
                                        className={`px-2 py-1.5 text-xs font-medium ${
                                            pickerPeriod === "AM" ? "bg-blue-600 text-white" : "bg-white text-slate-600"
                                        }`}
                                    >
                                        AM
                                    </button>
                                    <button
                                        onClick={() => setPickerPeriod("PM")}
                                        className={`px-2 py-1.5 text-xs font-medium ${
                                            pickerPeriod === "PM" ? "bg-blue-600 text-white" : "bg-white text-slate-600"
                                        }`}
                                    >
                                        PM
                                    </button>
                                </div>
                            </>
                        )}
                        <Button size="sm" onClick={() => addTimeSlot(activeDate)} className="ml-1">
                            Add Time
                        </Button>
                    </div>

                    {/* Added time slots */}
                    {(timeSlots[activeDate]?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {timeSlots[activeDate].map(slot => (
                                <span key={slot} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    {slot}
                                    <button
                                        onClick={() => removeTimeSlot(activeDate, slot)}
                                        className="ml-0.5 hover:text-blue-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-slate-400">
                Tap a date to toggle availability. Select a date to set preferred times.
            </p>
        </div>
    );
}
