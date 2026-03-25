import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicApi } from '../../lib/api';
import { getWeekMonday, toDateString, buildWhatsAppMessage, formatDate } from '../../lib/utils';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
type Step = 'calendar' | 'time' | 'service' | 'name' | 'confirm' | 'done';

const STEPS: Step[] = ['calendar', 'time', 'service', 'name', 'confirm'];
const STEP_LABELS = ['Día', 'Hora', 'Servicio', 'Nombre', 'Confirmar'];

export default function ScheduleSection() {
  const [weekStart, setWeekStart] = useState(getWeekMonday());
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [step, setStep] = useState<Step>('calendar');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const week = toDateString(weekStart);
    publicApi.getSchedule(week).then((data: any) => setSchedule(data));
    publicApi.getConfig().then((cfg: any) => setWhatsappNumber(cfg.whatsapp_number || ''));
    publicApi.getServices().then((data: any) => setServices(data));
  }, [weekStart]);

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      publicApi.getAvailability(selectedDate).then(data => {
        setAvailability(data);
        setLoadingSlots(false);
      });
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
    setClientPhone('');
    setStep('calendar');
  }

  function handleWhatsApp() {
    const svc = services.find(s => s.id === selectedService);
    const url = buildWhatsAppMessage({
      clientName: clientPhone ? `${clientName} (${clientPhone})` : clientName,
      date: selectedDate!,
      time: selectedTime!,
      serviceName: svc?.name || '',
      whatsappNumber,
    });
    window.open(url, '_blank');
    setStep('done');
  }

  const selectedSvc = services.find(s => s.id === selectedService);
  const currentStepIdx = STEPS.indexOf(step);

  return (
    <section id="agenda" className="py-24 px-4 bg-brand-surface">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-3">Agenda tu hora</h2>
          <p className="text-brand-muted">Selecciona día, hora y servicio — te contactamos por WhatsApp</p>
        </motion.div>

        {step === 'done' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-brand-card border border-brand-border rounded-2xl p-10"
          >
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-white text-xl font-semibold mb-2">¡Solicitud enviada!</h3>
            <p className="text-brand-muted text-sm mb-6">Tu mensaje fue enviado a WhatsApp. La peluquera te confirmará la hora a la brevedad.</p>
            <button onClick={reset} className="bg-brand-pink text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-brand-pink-dark transition-colors">
              Agendar otra hora
            </button>
          </motion.div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
            {/* Step indicator */}
            {step !== 'calendar' && (
              <div className="flex items-center gap-1 mb-6">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < currentStepIdx ? 'bg-brand-pink text-white' :
                      i === currentStepIdx ? 'bg-brand-pink text-white ring-2 ring-brand-pink/30' :
                      'bg-brand-surface border border-brand-border text-brand-muted'
                    }`}>
                      {i < currentStepIdx ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:block ${i <= currentStepIdx ? 'text-white' : 'text-brand-muted'}`}>
                      {STEP_LABELS[i]}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIdx ? 'bg-brand-pink' : 'bg-brand-border'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevWeek} className="text-brand-muted hover:text-white transition-colors text-sm px-2 py-1">← Anterior</button>
                <span className="text-white text-sm font-medium">Semana del {toDateString(weekStart)}</span>
                <button onClick={nextWeek} className="text-brand-muted hover:text-white transition-colors text-sm px-2 py-1">Siguiente →</button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
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
                      className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-sm transition-all ${
                        isSelected
                          ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30'
                          : isWorking && !isPast
                          ? 'bg-brand-surface border border-brand-border text-white hover:border-brand-pink hover:bg-brand-surface/80'
                          : 'bg-brand-surface/40 opacity-30 text-brand-muted cursor-not-allowed'
                      }`}
                    >
                      <span className="text-[10px] opacity-70 mb-0.5">{dayName}</span>
                      <span className="font-semibold">{dayDate.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Time slots */}
              {(step === 'time' || step === 'service' || step === 'name' || step === 'confirm') && selectedDate && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-brand-border"
                >
                  <h3 className="text-white text-sm font-medium mb-3">
                    Horarios disponibles — <span className="text-brand-pink">{selectedDate}</span>
                  </h3>
                  {loadingSlots ? (
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-9 bg-brand-surface rounded-lg animate-pulse" />)}
                    </div>
                  ) : availability?.available_slots?.length === 0 ? (
                    <p className="text-brand-muted text-sm">No hay horarios disponibles este día.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability?.available_slots?.map((slot: string) => (
                        <button
                          key={slot}
                          onClick={() => step === 'time' && selectTime(slot)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedTime === slot
                              ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30'
                              : step === 'time'
                              ? 'bg-brand-surface border border-brand-border text-white hover:border-brand-pink'
                              : 'bg-brand-surface border border-brand-border text-brand-muted cursor-default'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Service */}
              {(step === 'service' || step === 'name' || step === 'confirm') && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-brand-border"
                >
                  <h3 className="text-white text-sm font-medium mb-3">¿Qué servicio deseas?</h3>
                  <select
                    value={selectedService}
                    onChange={e => setSelectedService(e.target.value)}
                    disabled={step !== 'service'}
                    className="bg-brand-surface border border-brand-border text-white rounded-xl px-4 py-2.5 text-sm w-full disabled:opacity-60"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {step === 'service' && selectedService && (
                    <button
                      onClick={() => setStep('name')}
                      className="mt-3 bg-brand-pink text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-brand-pink-dark transition-colors"
                    >
                      Continuar →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Name + phone */}
              {(step === 'name' || step === 'confirm') && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-brand-border"
                >
                  <h3 className="text-white text-sm font-medium mb-3">Tus datos de contacto</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Tu nombre *"
                      disabled={step !== 'name'}
                      className="bg-brand-surface border border-brand-border text-white rounded-xl px-4 py-2.5 text-sm w-full placeholder:text-brand-muted disabled:opacity-60"
                    />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="Teléfono (opcional)"
                      disabled={step !== 'name'}
                      className="bg-brand-surface border border-brand-border text-white rounded-xl px-4 py-2.5 text-sm w-full placeholder:text-brand-muted disabled:opacity-60"
                    />
                  </div>
                  {step === 'name' && clientName.trim() && (
                    <button
                      onClick={() => setStep('confirm')}
                      className="mt-3 bg-brand-pink text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-brand-pink-dark transition-colors"
                    >
                      Revisar reserva →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Confirm summary */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-brand-border"
                >
                  <h3 className="text-white text-sm font-medium mb-4">Resumen de tu reserva</h3>
                  <div className="bg-brand-surface rounded-xl p-4 space-y-2.5 mb-4 text-sm">
                    <Row label="📅 Fecha" value={formatDate(selectedDate!)} />
                    <Row label="🕐 Hora" value={selectedTime!} />
                    <Row label="💇 Servicio" value={selectedSvc?.name || '—'} />
                    <Row label="👤 Nombre" value={clientName} />
                    {clientPhone && <Row label="📱 Teléfono" value={clientPhone} />}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('calendar')}
                      className="flex-1 border border-brand-border text-brand-muted rounded-full py-2.5 text-sm hover:border-white hover:text-white transition-colors"
                    >
                      Modificar
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Enviar por WhatsApp
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-brand-muted">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}
