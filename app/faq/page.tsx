import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
    const faqs = [
        {
            question: "What is MeetSplit?",
            answer: "MeetSplit is the easiest way to find a date that works for everyone and split trip expenses without the headache. It requires no signup and uses anonymous sessions."
        },
        {
            question: "How do I create or join a room?",
            answer: "To create a room, just enter your name and the room's name on the home page. You'll get a 6-digit code to share with friends. They can join by entering that code on the home page."
        },
        {
            question: "How do we find the best date?",
            answer: "In the room, click on 'Dates' to add your availability. MeetSplit automatically highlights the date(s) that work for the most people in your group."
        },
        {
            question: "How does expense splitting work?",
            answer: "Click on 'Spent' to add an expense. Enter who paid and who was involved. The app automatically calculates a simplified 'Who Owes Whom' summary so everyone can settle up easily."
        },
        {
            question: "What is Event Mode?",
            answer: "Admins can turn on Event Mode to hide availability and expenses boards from members. Members will only see the final event date and any announcements."
        },
        {
            question: "Do I need an account to use MeetSplit?",
            answer: "No signup required! We use anonymous device-based sessions. Keep in mind that clearing your browser data or using incognito mode might result in losing access to your created rooms."
        },
        {
            question: "Who can edit room settings?",
            answer: "The person who creates the room is the Admin. The Admin can lock the room, remove members, toggle Event Mode, and set the final Event Date."
        }
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 p-4 sm:p-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed top-0 right-0 -m-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -m-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white/50 hover:bg-white px-4 py-2 rounded-full border border-slate-200">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-violet-100 rounded-full mb-6 text-violet-600 shadow-inner">
                        <HelpCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                        Help & FAQ
                    </h1>
                    <p className="text-lg text-slate-600">
                        Everything you need to know about using MeetSplit.
                    </p>
                </div>

                <div className="space-y-4 pb-12">
                    {faqs.map((faq, index) => (
                        <Card key={index} className="border-0 ring-1 ring-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-transform duration-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold text-slate-800">
                                    {faq.question}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    {faq.answer}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
}
