"use client";

import { RoomMemberData } from "@/types/firebase";
import { UserCircle2 } from "lucide-react";

export function MemberList({ members }: { members: RoomMemberData[] }) {
    return (
        <div className="flex -space-x-2 overflow-hidden py-2">
            {members.map((m) => (
                <div
                    key={m.userId}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs"
                    title={m.displayName}
                >
                    {m.displayName.substring(0, 2).toUpperCase()}
                </div>
            ))}
            <span className="inline-flex h-8 items-center justify-center pl-4 text-xs font-medium text-slate-500">
                {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
        </div>
    );
}
