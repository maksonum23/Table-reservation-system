/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReservationState } from './types';
import { ReservationForm } from './components/ReservationForm';
import { TableMapModal } from './components/TableMapModal';
import { Utensils, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<ReservationState>({
    date: '',
    time: '',
    duration: '',
    guests: '',
    tableId: null,
    name: '',
    email: '',
    phone: '',
  });
  
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{guest?: string, owner?: string, confirmLink?: string}>({});
  const [bookedTables, setBookedTables] = useState<number[]>([]);

  // Fetch booked tables when date, time, duration change
  useEffect(() => {
    if (state.date && state.time && state.duration) {
      const fetchBookedTables = async () => {
        try {
          const res = await fetch(`/api/booked-tables?date=${state.date}&time=${state.time}&duration=${state.duration}`);
          const data = await res.json();
          if (data.bookedTables) {
            setBookedTables(data.bookedTables);
            // If currently selected table is booked, clear it
            if (state.tableId && data.bookedTables.includes(state.tableId)) {
              setState(prev => ({ ...prev, tableId: null }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch booked tables", error);
        }
      };
      fetchBookedTables();
    } else {
      setBookedTables([]);
    }
  }, [state.date, state.time, state.duration]);

  // Check URL for confirmation token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('confirm');
    if (token) {
      confirmReservation(token);
    }
  }, []);

  const confirmReservation = async (token: string) => {
    try {
      const response = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, ...data.reservation }));
        setReservationStatus('confirmed');
        if (data._prototypeOwnerEmailPreview) {
          setPreviewUrls(prev => ({ ...prev, owner: data._prototypeOwnerEmailPreview }));
        }
      } else {
        alert(data.error || 'Failed to confirm reservation');
      }
    } catch (error) {
      alert('Network error while confirming reservation');
    }
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleComplete = async () => {
    if (!state.name || !state.email || !state.phone) {
      alert("Please fill out all contact details.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const payload = { ...state, origin: window.location.origin };
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (data.success) {
        setReservationStatus('pending');
        if (data._prototypeConfirmUrl) {
          setPreviewUrls(prev => ({ 
            ...prev, 
            confirmLink: data._prototypeConfirmUrl
          }));
        }
      } else {
        alert(data.error || "Failed to create reservation.");
      }
    } catch (err) {
      alert('Failed to connect to the server. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-stone-300">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-800">
            <Utensils className="w-6 h-6" />
            <span className="text-xl font-serif font-bold tracking-tight">Osteria</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {reservationStatus === 'idle' && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-8 text-center max-w-lg">
              <h1 className="text-4xl font-serif text-stone-800 mb-4">Reserve Your Experience</h1>
              <p className="text-stone-500">
                Join us for an unforgettable evening. Select your preferred date, time, and party size to view available tables.
              </p>
            </div>
            
            <ReservationForm 
              state={state} 
              onChange={(updates) => setState(prev => ({ ...prev, ...updates }))} 
              onOpenMap={() => setIsMapOpen(true)}
              onSubmit={handleComplete}
              isSubmitting={isSendingEmail}
            />
          </div>
        )}

        {reservationStatus === 'pending' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-12 w-full max-w-lg text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif text-stone-800 mb-4">Check Your Email</h2>
            <p className="text-stone-600 mb-8">
              We've sent a confirmation link to <strong>{state.email}</strong>. Please click the link in the email to confirm your reservation{state.tableId ? ` at Table ${state.tableId}` : ''}.
            </p>
            
            {/* Prototype Helper (Since real emails aren't sent without SMTP credentials) */}
            {previewUrls.confirmLink && (
              <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-200 text-left text-sm">
                <p className="font-semibold text-stone-800 mb-2">🚧 Prototype Debug Mode</p>
                <p className="text-stone-600 mb-4">Because this is a prototype running without an SMTP server, you can simulate clicking the email link here:</p>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    const url = new URL(previewUrls.confirmLink!);
                    const token = url.searchParams.get('confirm');
                    if (token) confirmReservation(token);
                  }}
                  className="block w-full py-3 bg-stone-200 text-stone-800 text-center rounded-xl font-medium hover:bg-stone-300 transition-colors"
                >
                  Simulate Email Click
                </button>
              </div>
            )}
          </div>
        )}

        {reservationStatus === 'confirmed' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-12 w-full max-w-lg text-center">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif text-stone-800 mb-4">Reservation Confirmed!</h2>
            <p className="text-stone-600 mb-8">
              Thank you, {state.name}! We look forward to hosting you on <strong>{state.date}</strong> at <strong>{state.time}</strong> for <strong>{state.duration}</strong>. Guests: <strong>{state.guests}</strong>{state.tableId ? <>, Table: <strong>{state.tableId}</strong></> : ''}.
            </p>
            <p className="text-stone-500 text-sm mb-8">
              The restaurant owner has been notified.
            </p>
            
            <button
              onClick={() => {
                setReservationStatus('idle');
                setState({ date: '', time: '', duration: '', guests: '', tableId: null, name: '', email: '', phone: '' });
                setPreviewUrls({});
              }}
              className="w-full py-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
            >
              Make Another Booking
            </button>
          </div>
        )}
      </main>

      <TableMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        guests={typeof state.guests === 'number' ? state.guests : 0}
        selectedTableId={state.tableId}
        onSelectTable={(id) => setState(prev => ({ ...prev, tableId: id }))}
        bookedTables={bookedTables}
      />
    </div>
  );
}
