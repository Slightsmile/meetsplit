"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { DateScore } from "@/lib/utils/calculateBestDate";
import { format } from "date-fns";
import { RoomMemberData } from "@/types/firebase";

interface Props {
    dates: DateScore[];
    members: RoomMemberData[];
}

export function BestDateCard({ dates, members }: Props) {
    if (!dates || dates.length === 0) {
        return (
            <Card className="bg-slate-50 border-dashed">
                <CardContent className="pt-6 text-center text-slate-500">
                    No availability data yet. Add some dates to see the best match!
                </CardContent>
            </Card>
        );
    }

    const best = dates[0];
    const totalMembers = members.length;
    const isPerfectMatch = best.availableCount === totalMembers && totalMembers > 0;

    const formattedDate = format(new Date(best.date), "EEEE, MMMM do, yyyy");

    return (
        <Card className={isPerfectMatch ? "border-green-200 bg-green-50" : ""}>
            <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>{isPerfectMatch ? "🎉 Perfect Match!" : "Top Suggested Date"}</span>
                    <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-full border">
                        {best.availableCount} / {totalMembers} free
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-4 text-slate-900">{formattedDate}</div>

                {!isPerfectMatch && best.missingUsers.length > 0 && (
                    <div className="text-sm text-slate-600 mt-2">
                        <span className="font-semibold text-amber-600">Missing: </span>
                        {best.missingUsers.map(uid => members.find(m => m.userId === uid)?.displayName || "Unknown").join(", ")}
                    </div>
                )}

                {/* Runner ups... optional */}
                {dates.length > 1 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-medium text-slate-500 mb-2">Runner-ups</h4>
                        <div className="space-y-2">
                            {dates.slice(1, 4).map(d => (
                                <div key={d.date} className="flex justify-between items-center text-sm">
                                    <span>{format(new Date(d.date), "MMM do")}</span>
                                    <span className="text-slate-500">{d.availableCount}/{totalMembers} free</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
