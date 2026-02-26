"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRoomData } from "@/lib/hooks/useRoomData";
import { ExpenseForm } from "@/components/room/ExpenseForm";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

export default function SplitPage({ params }: { params: { roomId: string } }) {
    const { user } = useAuth();
    const { room, members, expenses } = useRoomData(params.roomId);

    if (!room || !user) return null;

    return (
        <div className="space-y-8">
            <section>
                <ExpenseForm roomId={room.roomId} members={members} currentUserId={user.uid} />
            </section>

            <section>
                <h3 className="font-semibold text-slate-900 mb-4">Expense History</h3>
                {expenses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 border border-dashed rounded-xl">
                        No expenses recorded yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(exp => {
                            const payer = members.find(m => m.userId === exp.paidByUserId)?.displayName || "Unknown";
                            const date = format(new Date(exp.createdAt), "MMM do");

                            return (
                                <Card key={exp.expenseId} className="shadow-sm">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-900">{exp.description}</p>
                                            <p className="text-xs text-slate-500">Paid by {payer} on {date}</p>
                                        </div>
                                        <div className="font-bold text-slate-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: room.currency }).format(exp.totalAmount)}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
