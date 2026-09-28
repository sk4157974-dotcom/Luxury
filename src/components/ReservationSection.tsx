import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, User, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { RESTAURANT_CONFIG, buildReservationWhatsAppUrl } from '../config/restaurant';

export const ReservationSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('07:30 PM');
  const [guests, setGuests] = useState('2');
  const [specialRequest, setSpecialRequest] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const timeSlots = [
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '07:00 PM',
    '07:30 PM',
    '08:00 PM',
    '08:30 PM',
    '09:00 PM',
    '09:30 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit contact phone number.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select your preferred reservation date.');
      return;
    }

    if (!time) {
      setErrorMsg('Please select a dining time slot.');
      return;
    }

    const numGuests = parseInt(guests, 10) || 2;

    const whatsappUrl = buildReservationWhatsAppUrl({
      name: name.trim(),
      phone: cleanPhone,
      date,
      time,
      guests: numGuests,
      specialRequest: specialRequest.trim() || undefined
    });

    setSubmitted(true);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Min date for reservation is today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <motion.section
      id="reservation"
      className="py-16 sm:py-24 bg-[#F7F3EC] relative overflow-hidden border-t border-[#E8DEC8]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-sans-modern tracking-[0.25em] text-[#C48B46] font-semibold block mb-2">
            BESPOKE HOSPITALITY
          </span>

          <h2
            id="reservation-title"
            className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#1F1A17] tracking-tight uppercase"
          >
            Book a Table
          </h2>
          <p className="text-sm sm:text-base text-[#685D56] font-sans-modern mt-2">
            Reserve your intimate table for lunch or dinner. Reservations are confirmed instantly via our Maître d’ on WhatsApp.
          </p>
        </div>

        {/* Form Container with luxury 4-corner lighting */}
        <div className="relative group max-w-3xl mx-auto pop-card-wrapper !rounded-3xl">
          <div
            className="card-solid-face !rounded-3xl bg-white border border-[#E8DEC8] hover:border-[#38BDF8] p-5 sm:p-10 lg:p-12 shadow-2xl relative"
          >
          
          {submitted && (
            <div className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">WhatsApp reservation dispatched!</p>
                <p className="text-emerald-700 mt-0.5">
                  Our maître d' team at {RESTAURANT_CONFIG.contact.phoneFormatted} will review your request and confirm table availability immediately.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="reservation-name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors glow-on-hover"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                  Phone / WhatsApp Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    id="reservation-phone"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors glow-on-hover"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                  Reservation Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    id="reservation-date"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] focus:outline-none focus:border-[#C48B46] transition-colors glow-on-hover"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                  Preferred Seating Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    id="reservation-time"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] focus:outline-none focus:border-[#C48B46] transition-colors appearance-none cursor-pointer glow-on-hover"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                Number of Guests *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 xs:gap-2">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuests(num.toString())}
                    className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg text-[10.5px] xs:text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer glow-on-hover ${
                      guests === num.toString()
                        ? 'bg-[#C48B46] text-white shadow'
                        : 'bg-[#FAF7F2] text-[#685D56] border border-[#E8DEC8] hover:border-[#C48B46]'
                    }`}
                  >
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#1F1A17] mb-2 font-semibold">
                Special Request / Occasion (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-3.5" />
                <textarea
                  rows={3}
                  placeholder="e.g. Anniversary celebration, quiet window booth, dairy-free preference..."
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  id="reservation-special-request"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors resize-none glow-on-hover"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                id="submit-reservation-btn"
                className="w-full py-4 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#C48B46]/25 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer glow-on-hover lighting-beam-sweep"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm Reservation via WhatsApp</span>
              </button>

              <p className="text-center text-xs text-[#8C7D73] mt-3">
                Direct WhatsApp routing to {RESTAURANT_CONFIG.contact.phoneFormatted} • Instant Concierge Confirmation
              </p>
            </div>
          </form>

        </div>

      </div>

      </div>
    </motion.section>
  );
};
