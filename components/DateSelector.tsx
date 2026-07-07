"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useTaskStore } from '@/lib/task-store';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function addDays(dateStr: string, n: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

function toDisplayDate(dateStr: string): { day: number; dayLabel: string; month: string; year: number } {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.getDate(),
        dayLabel: DAY_LABELS[d.getDay()],
        month: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
    };
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
}

export default function DateSelector() {
    const { selectedDate, setSelectedDate } = useTaskStore();

    // Build a 7-day window centred on selected date: [-3 ... 0 ... +3]
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

    const { day, dayLabel, month, year } = toDisplayDate(selectedDate);

    const prevDay = () => setSelectedDate(addDays(selectedDate, -1));
    const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
    const goToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

    return (
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 mb-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <CalendarDays className="w-7 h-7" strokeWidth={2.5} />
                    <h2 className="text-3xl font-black uppercase tracking-tight">
                        {dayLabel}, {month} {day}, {year}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {!isToday(selectedDate) && (
                        <button
                            onClick={goToday}
                            className="border-4 border-black bg-yellow-300 px-3 py-1 font-black text-sm uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            Today
                        </button>
                    )}
                    <button
                        onClick={prevDay}
                        aria-label="Previous day"
                        className="border-4 border-black bg-white p-2 hover:bg-black hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                    </button>
                    <button
                        onClick={nextDay}
                        aria-label="Next day"
                        className="border-4 border-black bg-white p-2 hover:bg-black hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <ChevronRight className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* 7-day strip */}
            <div className="grid grid-cols-7 gap-2">
                {weekDays.map((dateStr) => {
                    const { day: d, dayLabel: dl } = toDisplayDate(dateStr);
                    const isSelected = dateStr === selectedDate;
                    const isT = isToday(dateStr);
                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center py-2 px-1 border-4 border-black font-black transition-all
                                ${isSelected
                                    ? 'bg-black text-white shadow-none translate-x-0.5 translate-y-0.5'
                                    : isT
                                        ? 'bg-cyan-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                                        : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                                }`}
                        >
                            <span className="text-xs uppercase">{dl}</span>
                            <span className="text-xl">{d}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
