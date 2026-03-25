import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { publicApi } from '../../lib/api';
import { getWeekMonday, toDateString, buildWhatsAppMessage, formatTime } from '../../lib/utils';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ScheduleSection() {
  const [weekStart, setWeekStart] = useState(getWeekMonday());
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [clientName, setClientName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [step, setStep] = useState<'calendar' | 'time' | 'service' | 'name' | 'done'>('calendar');

  useEffect(() => {
    const week = toDateString(weekStart);
    publicApi.getSchedule(week).then((data: any) => setSchedule(data));
    publicApi.getConfig().then((cfg: any) => setWhatsappNumber(cfg.whatsapp_number || ''));
    publicApi.getServices().then((data: any) => setServices(data));
  }, [weekStart]);

  useEffect(() => {
    if (selectedDate) {
      publicApi.getAvailability(selectedDate).then(setAvailability);
    }
  }, [selectedDate]);

  function selectDay(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep('time');
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setStep('service');
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function reset() {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedService('');
    setClientName('');
    setStep('calendar');
  }

  function handleWhatsApp() {
    const svc = services.find(s => s.id === selectedService);
    const url = buildWhatsAppMessage({
      clientName,
      date: selectedDate!,
      time: selectedTime!,
      serviceName: svc?.name || '',
      whatsappNumber,
    });
    window.open(url, '_blank');
    setStep('done');
  }

  return (
    <section id="agenda" className="py-24 px-4 bg-brand-surface">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-3">Agenda tu hora</h2>
          <p className="text-brand-muted">Selecciona un día y horario disponible</p>
        </motion.div>

        {step === 'done' ? (
          <div className="text-center">
            <p className="text-green-400 text-lg mb-4">¡Mensaje enviado a WhatsApp!</p>
            <p className="text-brand-muted text-sm mb-6">La peluquera confirmará tu hora por WhatsApp.</p>
            <button onClick={reset} className="bg-brand-pink text-white px-6 py-2.5 rounded-full text-sm font-medium">
              Agendar otra hora
            </button>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevWeek} className="text-brand-muted hover:text-white transition-colors text-sm">← Anterior</button>
              <span className="text-white text-sm">Semana del {toDateString(weekStart)}</span>
              <button onClick={nextWeek} className="text-brand-muted hover:text-white transition-colors text-sm">Siguiente →</button>
            </div>

            {/* Calendar */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {DAYS.map((dayName, i) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(dayDate.getDate() + i);
                const dateStr = toDateString(dayDate);
                const daySchedule = schedule.find(s => s.day_of_week === i);
                const isWorking = daySchedule?.is_working;
                const isSelected = selectedDate === dateStr;
                const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={i}
                    onClick={() => isWorking && !isPast && selectDay(dateStr)}
                    disabled={!isWorking || isPast}
                    className={`flex flex-col items-center p-2 rounded-xl text-sm transition-colors ${
                      isSelected ? 'bg-brand-pink text-white' :
                      isWorking && !isPast ? 'bg-brand-card border border-brand-border text-white hover:border-brand-pink' :
                      'bg-brand-card opacity-30 text-brand-muted cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs opacity-70">{dayName.slice(0, 3)}</span>
                    <span className="font-medium">{dayDate.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* Time picker */}
            {step === 'time' && availability && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-white text-sm font-medium mb-3">Horarios disponibles — {selectedDate}</h3>
                {availability.available_slots?.length === 0 ? (
                  <p className="text-brand-muted text-sm">No hay horarios disponibles este día.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availability.available_slots?.map((slot: string) => (
                      <button
                        key={slot}
                        onClick={() => selectTime(slot)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedTime === slot
                            ? 'bg-brand-pink text-white'
                            : 'bg-brand-card border border-brand-border text-white hover:border-brand-pink'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Service picker */}
            {step === 'service' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <h3 className="text-white text-sm font-medium mb-3">¿Qué servicio deseas?</h3>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="bg-brand-card border border-brand-border text-white rounded-xl px-4 py-2.5 text-sm w-full max-w-xs"
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {selectedService && (
                  <button
                    onClick={() => setStep('name')}
                    className="mt-3 bg-brand-pink text-white px-6 py-2 rounded-full text-sm font-medium"
                  >
                    Continuar
                  </button>
                )}
              </motion.div>
            )}

            {/* Name */}
            {step === 'name' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <h3 className="text-white text-sm font-medium mb-3">¿Cuál es tu nombre?</h3>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-brand-card border border-brand-border text-white rounded-xl px-4 py-2.5 text-sm w-full max-w-xs placeholder:text-brand-muted"
                />
                {clientName.trim() && (
                  <button
                    onClick={handleWhatsApp}
                    className="mt-3 ml-3 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Enviar por WhatsApp
                  </button>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
