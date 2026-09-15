import React from 'react';
import { Calendar, Clock, Users, Map, User, Mail, Phone, Hourglass } from 'lucide-react';
import { ReservationState } from '../types';

type Props = {
  state: ReservationState;
  onChange: (updates: Partial<ReservationState>) => void;
  onOpenMap: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ReservationForm({ state, onChange, onOpenMap, onSubmit, isSubmitting }: Props) {
  // Get today's date in YYYY-MM-DD format for the min attribute
  const today = new Date().toISOString().split('T')[0];

  const basicInfoFilled = state.date && state.time && state.duration && state.guests;

  const getAvailableTimeSlots = () => {
    if (!state.date) return [];
    const day = new Date(state.date).getDay();
    let maxH = 24; // Sunday (closes at 24:00/00:00)
    if (day >= 1 && day <= 4) maxH = 25; // Mon-Thu (closes at 01:00)
    if (day === 5 || day === 6) maxH = 26; // Fri-Sat (closes at 02:00)
    
    const slots = [];
    for (let h = 16; h < maxH; h++) {
      const hourStr = (h % 24).toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:30`);
    }
    return slots;
  };

  const availableTimeSlots = getAvailableTimeSlots();
  const isValid = basicInfoFilled;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 w-full max-w-md">
      <h2 className="text-3xl font-serif text-stone-800 mb-8">Book a Table</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              min={today}
              value={state.date}
              onChange={(e) => {
                // If they change the date, clear the time since available slots might change
                onChange({ date: e.target.value, time: '', tableId: null });
              }}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time
            </label>
            <select
              value={state.time}
              disabled={!state.date}
              onChange={(e) => onChange({ time: e.target.value, tableId: null })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {state.date ? 'Select time...' : 'Select date first'}
              </option>
              {availableTimeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Duration Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Hourglass className="w-4 h-4" /> Duration
            </label>
            <select
              value={state.duration}
              onChange={(e) => onChange({ duration: e.target.value, tableId: null })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none appearance-none"
            >
              <option value="" disabled>Select...</option>
              <option value="1 hour">1 hour</option>
              <option value="1.5 hours">1.5 hours</option>
              <option value="2 hours">2 hours</option>
              <option value="2.5 hours">2.5 hours</option>
              <option value="3 hours">3 hours</option>
              <option value="4+ hours">4+ hours</option>
            </select>
          </div>

          {/* Guests Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> Guests
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 2"
              value={state.guests}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                onChange({ guests: val, tableId: null });
              }}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {/* Table Selection Button (Optional) */}
        <div className="pt-2">
          <button
            onClick={onOpenMap}
            disabled={!isValid}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
              !isValid
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : state.tableId
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 shadow-sm'
            }`}
          >
            <Map className="w-5 h-5" />
            {state.tableId ? `Table ${state.tableId} Selected - Change` : 'Choose a specific table (Optional)'}
          </button>
        </div>

        {/* Contact Fields (Show when basic info is filled) */}
        {isValid && (
          <div className="pt-6 mt-6 border-t border-stone-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-medium text-stone-800 mb-4">Contact Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={state.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={state.email}
                onChange={(e) => onChange({ email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={state.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all outline-none"
              />
            </div>

            {state.name && state.email && state.phone && (
              <div className="pt-4">
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 shadow-xl shadow-stone-800/10 hover:shadow-2xl hover:shadow-stone-800/20 transition-all scale-100 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Sending Request...' : 'Request Reservation'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
