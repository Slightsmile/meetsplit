import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
    const faqs = [
        {
            question: "What is MeetSplit?",
            answer: "MeetSplit is the easiest way to find a date that works for everyone and split trip expenses without the headache. No signup required — it uses anonymous, device-based sessions."
        },
        {
            question: "How do I create or join a room?",
            answer: "To create a room, enter your name and a room name on the home page. You'll get a 6-digit code to share with friends. They can join by entering that code along with their name."
        },
        {
            question: "What are the Meet and Split tabs?",
            answer: "Meet is the availability tab — pick calendar dates when you're free and the app finds the best overlap. Split is for expenses — add bills, choose equal or manual split, and track who paid."
        },
        {
            question: "How does the Meet tab work?",
            answer: "Open the Meet tab and tap on dates you're available. MeetSplit automatically highlights the date(s) that work for the most people in your group. Use arrows to navigate between months."
        },
        {
            question: "How does expense splitting work?",
            answer: "In the Split tab, add an expense with a description and amount. Choose equal split (divided evenly) or manual split (individual items per person). You can also add VAT/tax. The app calculates who owes whom."
        },
        {
            question: "What currencies are supported?",
            answer: "MeetSplit supports BDT (৳), USD ($), EUR (€), GBP (£), INR (₹), and JPY (¥). Change the currency using the button at the top of the Split tab."
        },
        {
            question: "What is Event Mode?",
            answer: "Admins can turn on Event Mode to hide the Meet and Split tabs from regular members. Members will only see the Overview with the final event date and any announcements."
        },
        {
            question: "Do I need an account?",
            answer: "No signup required! MeetSplit uses anonymous device-based sessions. Your identity is tied to your browser — no email or password needed."
        },
        {
            question: "What if I lose my session?",
            answer: "If you clear your browser data or switch devices, go to the home page and enter your original name along with the room code. MeetSplit will match you back to your previous identity with all your data (availability, expenses) intact."
        },
        {
            question: "Who can edit room settings?",
            answer: "The person who creates the room is the Admin. The Admin can lock the room, remove members, toggle Event Mode, set the final Event Date, and post announcements."
        },
        {
            question: "How long do rooms last?",
            answer: "Rooms and anonymous user accounts are automatically deleted after 30 days of inactivity to keep things clean. Make sure to finalize your plans before then!"
        },
        {
            question: "How do I track payments?",
            answer: "After adding expenses in the Split tab, use the Payment Method section at the bottom. Choose 'Each' mode for equal shares, or 'Manual Payment' to enter exact amounts each person paid."
        },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-meet-100 via-sky-50 to-emerald-50 p-4 sm:p-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed top-0 right-0 -m-32 w-96 h-96 bg-meet-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -m-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply border-none pointer-events-none"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white/50 hover:bg-white px-4 py-2 rounded-full border border-slate-200">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-meet-100 rounded-full mb-6 text-meet-600 shadow-inner">
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
                        <Card key={index} className="border-0 ring-1 ring-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl shadow-meet-900/5 hover:-translate-y-1 transition-transform duration-300">
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
