import { useState, useEffect, useMemo } from "react";

const safeConfirm = (msg) => window.confirm(msg);

// ── Persistence (localStorage) ──────────────────────────────────────────────
const DB = {
  get: (k, def = []) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const fmtM = (d) => d ? new Date(d).toLocaleString("default", { month: "long", year: "numeric" }) : "";
const diffDays = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
const LKR = (n) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

// ── Seed data ────────────────────────────────────────────────────────────────
const seedVehicles = () => [
  { id: uid(), number: "WP-CAR-1234", type: "Car", name: "Toyota Aqua", dailyPrice: 5000, status: "Available", notes: "AC, Full option", createdAt: today() },
  { id: uid(), number: "WP-VAN-5678", type: "Van", name: "Toyota KDH", dailyPrice: 8000, status: "Available", notes: "14 seats", createdAt: today() },
];

// ── Auth ─────────────────────────────────────────────────────────────────────
const AUTH = { user: "admin", pass: "admin123" };

// ── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, cls = "w-5 h-5" }) => {
  const icons = {
    car: <path d="M16 6l-1.5-4.5A2 2 0 0012.6 0H7.4a2 2 0 00-1.9 1.5L4 6H2a2 2 0 00-2 2v6a2 2 0 002 2v2h2v-2h12v2h2v-2a2 2 0 002-2V8a2 2 0 00-2-2h-2zm-9.5-1L7.6 2h4.8l1.1 3H6.5zm-2 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>,
    dashboard: <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z"/>,
    book: <path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15zm0 0A2.5 2.5 0 006.5 22H20v-3H6.5A2.5 2.5 0 004 19.5z"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    report: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    chevronL: <polyline points="15 18 9 12 15 6"/>,
    chevronR: <polyline points="9 18 15 12 9 6"/>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.26 10.6 19.79 19.79 0 011.21 2 2 2 0 013.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    gauge: <><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></>,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>{icons[name]}</svg>;
};

// ── COMPONENTS ───────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    Available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Booked: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Active: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Completed: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

const Card = ({ children, cls = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${cls}`}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", cls = "", disabled = false, type = "button" }) => {
  const v = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${v[variant]} ${cls}`}>{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, required, placeholder, min, max, step, options, rows }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
    {options
      ? <select value={value} onChange={e => onChange(e.target.value)} className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} min={min} max={max} step={step}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    }
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h2 className="font-semibold text-gray-800 dark:text-white">{title}</h2>
        <Btn variant="ghost" onClick={onClose} cls="!px-2 !py-1"><Icon name="x" cls="w-4 h-4" /></Btn>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// ── VEHICLE FORM ─────────────────────────────────────────────────────────────
const VehicleForm = ({ initial, onSave, onClose }) => {
  const [f, setF] = useState(initial || { number: "", type: "Car", name: "", dailyPrice: "", status: "Available", notes: "" });
  const set = k => v => setF(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.number || !f.name || !f.dailyPrice) return alert("Fill required fields");
    onSave({ ...f, id: f.id || uid(), createdAt: f.createdAt || today() });
    onClose();
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input label="Vehicle Number" value={f.number} onChange={set("number")} required placeholder="WP-CAR-1234" />
      <Input label="Vehicle Type" value={f.type} onChange={set("type")} options={["Car", "Van", "Bus", "Three Wheeler", "Bike", "SUV", "Truck", "Other"]} />
      <Input label="Vehicle Name" value={f.name} onChange={set("name")} required placeholder="Toyota Aqua" />
      <Input label="Daily Rental Price (Rs.)" type="number" value={f.dailyPrice} onChange={set("dailyPrice")} required min="0" step="100" />
      <Input label="Status" value={f.status} onChange={set("status")} options={["Available", "Booked", "Maintenance"]} />
      <div className="sm:col-span-2"><Input label="Notes" value={f.notes} onChange={set("notes")} rows={2} placeholder="Any notes..." /></div>
      <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit}><Icon name="check" cls="w-4 h-4" /> Save Vehicle</Btn>
      </div>
    </div>
  );
};

// ── BOOKING FORM ─────────────────────────────────────────────────────────────
const BookingForm = ({ initial, vehicles, bookings, onSave, onClose }) => {
  const [f, setF] = useState(initial || {
    customerName: "", phone: "", nic: "", vehicleId: "",
    bookingDate: today(), startDate: today(), endDate: today(),
    numDays: 1, dailyPrice: 0, totalAmount: 0, advancePayment: 0, remainingBalance: 0,
    status: "Booked", startMileage: "", endMileage: "", totalDistance: 0,
    extraMileageRate: 0, extraMileageCharge: 0, fuelStart: "Full", fuelEnd: "Full",
    conditionNotes: "",
  });
  const set = (k, val) => setF(p => ({ ...p, [k]: val }));

  const avail = vehicles.filter(v => v.status === "Available" || (initial && v.id === initial.vehicleId));

  useEffect(() => {
    if (f.vehicleId) {
      const v = vehicles.find(x => x.id === f.vehicleId);
      if (v) set("dailyPrice", v.dailyPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.vehicleId]);

  useEffect(() => {
    if (f.startDate && f.endDate) {
      const d = diffDays(f.startDate, f.endDate);
      const total = d * Number(f.dailyPrice);
      const rem = total - Number(f.advancePayment) + Number(f.extraMileageCharge);
      setF(p => ({ ...p, numDays: d, totalAmount: total, remainingBalance: rem }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.startDate, f.endDate, f.dailyPrice, f.advancePayment, f.extraMileageCharge]);

  useEffect(() => {
    if (f.startMileage && f.endMileage) {
      const dist = Number(f.endMileage) - Number(f.startMileage);
      const extra = dist > 0 ? dist * Number(f.extraMileageRate) : 0;
      setF(p => ({ ...p, totalDistance: Math.max(0, dist), extraMileageCharge: extra }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.startMileage, f.endMileage, f.extraMileageRate]);

  const submit = () => {
    if (!f.customerName || !f.vehicleId || !f.startDate || !f.endDate) return alert("Fill required fields");
    // Check double booking
    const conflict = bookings.filter(b => b.id !== f.id && b.vehicleId === f.vehicleId && b.status !== "Cancelled" && b.status !== "Completed");
    const overlap = conflict.some(b => !(f.endDate < b.startDate || f.startDate > b.endDate));
    if (overlap) return alert("⚠️ This vehicle is already booked for the selected dates!");
    onSave({ ...f, id: f.id || uid(), createdAt: f.createdAt || today() });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <h3 className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</h3>
        <Input label="Customer Name" value={f.customerName} onChange={v => set("customerName", v)} required placeholder="Full name" />
        <Input label="Phone Number" value={f.phone} onChange={v => set("phone", v)} placeholder="07X XXXXXXX" />
        <Input label="NIC Number" value={f.nic} onChange={v => set("nic", v)} placeholder="Optional" />

        <h3 className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Booking Details</h3>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Vehicle<span className="text-red-500 ml-0.5">*</span></label>
          <select value={f.vehicleId} onChange={e => set("vehicleId", e.target.value)} className="mt-1 w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select Vehicle —</option>
            {avail.map(v => <option key={v.id} value={v.id}>{v.number} — {v.name}</option>)}
          </select>
        </div>
        <Input label="Booking Date" type="date" value={f.bookingDate} onChange={v => set("bookingDate", v)} />
        <Input label="Status" value={f.status} onChange={v => set("status", v)} options={["Booked", "Active", "Completed", "Cancelled"]} />
        <Input label="Start Date" type="date" value={f.startDate} onChange={v => set("startDate", v)} required />
        <Input label="End Date" type="date" value={f.endDate} onChange={v => set("endDate", v)} required />
        <Input label="Number of Days" type="number" value={f.numDays} onChange={() => {}} />
        <Input label="Daily Price (Rs.)" type="number" value={f.dailyPrice} onChange={v => set("dailyPrice", v)} />

        <h3 className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Payment</h3>
        <div className="sm:col-span-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{LKR(f.totalAmount)}</p>
        </div>
        <Input label="Advance Payment (Rs.)" type="number" value={f.advancePayment} onChange={v => set("advancePayment", v)} min="0" />
        <div className="sm:col-span-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Remaining Balance</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{LKR(f.remainingBalance)}</p>
        </div>

        <h3 className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Mileage</h3>
        <Input label="Start Mileage (km)" type="number" value={f.startMileage} onChange={v => set("startMileage", v)} min="0" />
        <Input label="End Mileage (km)" type="number" value={f.endMileage} onChange={v => set("endMileage", v)} min="0" />
        <Input label="Extra Mileage Rate (Rs./km)" type="number" value={f.extraMileageRate} onChange={v => set("extraMileageRate", v)} min="0" />
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Distance / Extra Charge</p>
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{f.totalDistance} km / {LKR(f.extraMileageCharge)}</p>
        </div>

        <h3 className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Condition</h3>
        <Input label="Fuel Level (Start)" value={f.fuelStart} onChange={v => set("fuelStart", v)} options={["Full", "3/4", "1/2", "1/4", "Empty"]} />
        <Input label="Fuel Level (End)" value={f.fuelEnd} onChange={v => set("fuelEnd", v)} options={["Full", "3/4", "1/2", "1/4", "Empty"]} />
        <div className="sm:col-span-2"><Input label="Condition Notes" value={f.conditionNotes} onChange={v => set("conditionNotes", v)} rows={2} placeholder="Any damage, condition remarks..." /></div>
      </div>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit}><Icon name="check" cls="w-4 h-4" /> Save Booking</Btn>
      </div>
    </div>
  );
};

// ── PAGINATION ────────────────────────────────────────────────────────────────
const Pager = ({ total, page, perPage, setPage }) => {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-end mt-3">
      <Btn variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} cls="!px-2"><Icon name="chevronL" cls="w-4 h-4" /></Btn>
      <span className="text-xs text-gray-500 dark:text-gray-400">{page} / {pages}</span>
      <Btn variant="ghost" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} cls="!px-2"><Icon name="chevronR" cls="w-4 h-4" /></Btn>
    </div>
  );
};

// ── SEARCH BAR ────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Icon name="search" cls="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search..."} className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

// ── CALENDAR VIEW ─────────────────────────────────────────────────────────────
const CalendarView = ({ bookings, vehicles }) => {
  const [cur, setCur] = useState(new Date());
  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const bookingsForDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return bookings.filter(b => b.status !== "Cancelled" && dateStr >= b.startDate && dateStr <= b.endDate);
  };

  const vName = (id) => { const v = vehicles.find(x => x.id === id); return v ? v.name : "?"; };
  const colors = ["bg-blue-400", "bg-purple-400", "bg-green-400", "bg-orange-400", "bg-pink-400", "bg-teal-400"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Btn variant="ghost" onClick={() => setCur(new Date(year, month - 1, 1))}><Icon name="chevronL" cls="w-4 h-4" /></Btn>
        <h3 className="font-semibold text-gray-700 dark:text-white">{cur.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
        <Btn variant="ghost" onClick={() => setCur(new Date(year, month + 1, 1))}><Icon name="chevronR" cls="w-4 h-4" /></Btn>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          const bks = d ? bookingsForDay(d) : [];
          const isToday = d && `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` === today();
          return (
            <div key={i} className={`min-h-[60px] rounded-lg p-1 border ${d ? "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800" : "border-transparent"} ${isToday ? "ring-2 ring-blue-500" : ""}`}>
              {d && <span className={`text-xs font-semibold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}>{d}</span>}
              {bks.map((b, bi) => (
                <div key={b.id} className={`${colors[bi % colors.length]} text-white text-[9px] rounded px-1 mt-0.5 truncate`} title={`${vName(b.vehicleId)} — ${b.customerName}`}>
                  {vName(b.vehicleId)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2">
        {bookings.filter(b => b.status !== "Cancelled").slice(0, 6).map((b, i) => (
          <span key={b.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <span className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
            {vName(b.vehicleId)} — {b.customerName}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── REPORTS ────────────────────────────────────────────────────────────────────
const ReportsView = ({ bookings, vehicles }) => {
  const [tab, setTab] = useState("daily");
  const [selDate, setSelDate] = useState(today());
  const [selMonth, setSelMonth] = useState(today().slice(0, 7));

  const completedBks = bookings.filter(b => b.status === "Completed" || b.status === "Active");

  const dailyBks = completedBks.filter(b => b.startDate === selDate || b.endDate === selDate);
  const dailyIncome = dailyBks.reduce((s, b) => s + Number(b.advancePayment || 0), 0);

  const monthlyBks = completedBks.filter(b => b.startDate?.slice(0, 7) === selMonth || b.endDate?.slice(0, 7) === selMonth);
  const monthlyIncome = monthlyBks.reduce((s, b) => s + Number(b.totalAmount || 0) + Number(b.extraMileageCharge || 0), 0);

  const vehicleIncome = vehicles.map(v => {
    const vBks = completedBks.filter(b => b.vehicleId === v.id);
    return { ...v, count: vBks.length, income: vBks.reduce((s, b) => s + Number(b.totalAmount || 0), 0) };
  }).sort((a, b) => b.income - a.income);

  const exportCSV = (data, name) => {
    if (!data.length) return alert("No data to export");
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = name + ".csv"; a.click();
  };

  const exportBookingsCSV = (bks, name) => {
    const data = bks.map(b => {
      const v = vehicles.find(x => x.id === b.vehicleId);
      return { Customer: b.customerName, Phone: b.phone, NIC: b.nic, Vehicle: v?.name || "", Number: v?.number || "", Start: b.startDate, End: b.endDate, Days: b.numDays, Daily: b.dailyPrice, Total: b.totalAmount, Advance: b.advancePayment, Balance: b.remainingBalance, Status: b.status, Distance: b.totalDistance, ExtraCharge: b.extraMileageCharge };
    });
    exportCSV(data, name);
  };

  const tabs = [{ k: "daily", l: "Daily" }, { k: "monthly", l: "Monthly" }, { k: "vehicle", l: "By Vehicle" }, { k: "history", l: "History" }];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.k ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{t.l}</button>
        ))}
      </div>

      {tab === "daily" && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap items-end">
            <Input label="Select Date" type="date" value={selDate} onChange={setSelDate} />
            <Btn onClick={() => exportBookingsCSV(dailyBks, `Daily_Report_${selDate}`)} variant="secondary"><Icon name="download" cls="w-4 h-4" /> Export CSV</Btn>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Advance Income on {fmt(selDate)}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{LKR(dailyIncome)}</p>
            <p className="text-xs text-gray-400">{dailyBks.length} bookings</p>
          </div>
          <BookingTable bks={dailyBks} vehicles={vehicles} />
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap items-end">
            <Input label="Select Month" type="month" value={selMonth} onChange={setSelMonth} />
            <Btn onClick={() => exportBookingsCSV(monthlyBks, `Monthly_Report_${selMonth}`)} variant="secondary"><Icon name="download" cls="w-4 h-4" /> Export CSV</Btn>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Income — {fmtM(selMonth + "-01")}</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{LKR(monthlyIncome)}</p>
            <p className="text-xs text-gray-400">{monthlyBks.length} bookings</p>
          </div>
          <BookingTable bks={monthlyBks} vehicles={vehicles} />
        </div>
      )}

      {tab === "vehicle" && (
        <div className="space-y-3">
          <Btn onClick={() => exportCSV(vehicleIncome.map(v => ({ Vehicle: v.name, Number: v.number, Bookings: v.count, Income: v.income })), "Vehicle_Income")} variant="secondary"><Icon name="download" cls="w-4 h-4" /> Export CSV</Btn>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-gray-700">{["Vehicle","Number","Type","Bookings","Total Income"].map(h => <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{vehicleIncome.map(v => (
                <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">{v.name}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{v.number}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{v.type}</td>
                  <td className="py-2 px-3">{v.count}</td>
                  <td className="py-2 px-3 font-semibold text-green-700 dark:text-green-400">{LKR(v.income)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <Btn onClick={() => exportBookingsCSV(bookings, "All_Bookings")} variant="secondary"><Icon name="download" cls="w-4 h-4" /> Export All CSV</Btn>
          <BookingTable bks={[...bookings].reverse()} vehicles={vehicles} />
        </div>
      )}
    </div>
  );
};

const BookingTable = ({ bks, vehicles }) => {
  const [page, setPage] = useState(1);
  const PER = 8;
  const slice = bks.slice((page - 1) * PER, page * PER);
  const vName = (id) => { const v = vehicles.find(x => x.id === id); return v ? `${v.name}` : "?"; };
  if (!bks.length) return <p className="text-center text-gray-400 py-8 text-sm">No bookings found.</p>;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700">{["Customer","Vehicle","Period","Total","Advance","Balance","Status"].map(h => <th key={h} className="text-left py-2 px-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">{h}</th>)}</tr></thead>
          <tbody>{slice.map(b => (
            <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-2 px-2 font-medium text-gray-800 dark:text-white">{b.customerName}</td>
              <td className="py-2 px-2 text-gray-500 dark:text-gray-400">{vName(b.vehicleId)}</td>
              <td className="py-2 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(b.startDate)} – {fmt(b.endDate)}</td>
              <td className="py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">{LKR(b.totalAmount)}</td>
              <td className="py-2 px-2 text-green-700 dark:text-green-400">{LKR(b.advancePayment)}</td>
              <td className="py-2 px-2 text-red-700 dark:text-red-400">{LKR(b.remainingBalance)}</td>
              <td className="py-2 px-2"><Badge status={b.status} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Pager total={bks.length} page={page} perPage={PER} setPage={setPage} />
    </>
  );
};

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => DB.get("vr_auth", false));
  const [dark, setDark] = useState(() => DB.get("vr_dark", false));
  const [vehicles, setVehicles] = useState(() => { const v = DB.get("vr_vehicles", null); return v || seedVehicles(); });
  const [bookings, setBookings] = useState(() => DB.get("vr_bookings", []));
  const [nav, setNav] = useState("dashboard");
  const [modal, setModal] = useState(null); // { type, data }
  const [search, setSearch] = useState({ v: "", b: "" });
  const [filterV, setFilterV] = useState("All");
  const [filterB, setFilterB] = useState("All");
  const [pageV, setPageV] = useState(1);
  const [pageB, setPageB] = useState(1);
  const PER = 8;

  // persist
  useEffect(() => { DB.set("vr_vehicles", vehicles); }, [vehicles]);
  useEffect(() => { DB.set("vr_bookings", bookings); }, [bookings]);
  useEffect(() => { DB.set("vr_dark", dark); }, [dark]);

  // sync vehicle status from bookings
  useEffect(() => {
    const today2 = today();
    const active = new Set(bookings.filter(b => b.status === "Active" || (b.status === "Booked" && b.startDate <= today2 && b.endDate >= today2)).map(b => b.vehicleId));
    const booked = new Set(bookings.filter(b => b.status === "Booked").map(b => b.vehicleId));
    setVehicles(prev => prev.map(v => {
      if (v.status === "Maintenance") return v;
      if (active.has(v.id)) return { ...v, status: "Booked" };
      if (!booked.has(v.id)) return { ...v, status: "Available" };
      return v;
    }));
  }, [bookings, vehicles.length]);

  const saveVehicle = (v) => setVehicles(prev => prev.find(x => x.id === v.id) ? prev.map(x => x.id === v.id ? v : x) : [...prev, v]);
  const delVehicle = (id) => { if (safeConfirm("Delete this vehicle?")) setVehicles(prev => prev.filter(x => x.id !== id)); };
  const saveBooking = (b) => setBookings(prev => prev.find(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
  const delBooking = (id) => { if (safeConfirm("Delete this booking?")) setBookings(prev => prev.filter(x => x.id !== id)); };

  // Dashboard stats
  const todayBks = bookings.filter(b => (b.status === "Active" || b.status === "Completed") && (b.startDate === today() || b.endDate === today()));
  const todayIncome = todayBks.reduce((s, b) => s + Number(b.advancePayment || 0), 0);
  const thisMonth = today().slice(0, 7);
  const monthlyIncome = bookings.filter(b => b.status !== "Cancelled" && (b.startDate?.startsWith(thisMonth) || b.endDate?.startsWith(thisMonth))).reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const upcoming = bookings.filter(b => b.status === "Booked" && b.startDate > today()).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 5);
  const overdue = bookings.filter(b => b.status === "Active" && b.endDate < today());
  const availCount = vehicles.filter(v => v.status === "Available").length;
  const bookedCount = vehicles.filter(v => v.status === "Booked").length;

  // Vehicle filter/search
  const filtV = useMemo(() => vehicles.filter(v => {
    const q = search.v.toLowerCase();
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.number.toLowerCase().includes(q) || v.type.toLowerCase().includes(q);
    const matchF = filterV === "All" || v.status === filterV || v.type === filterV;
    return matchQ && matchF;
  }), [vehicles, search.v, filterV]);
  const pageVData = filtV.slice((pageV - 1) * PER, pageV * PER);

  // Booking filter/search
  const filtB = useMemo(() => bookings.filter(b => {
    const q = search.b.toLowerCase();
    const v = vehicles.find(x => x.id === b.vehicleId);
    const matchQ = !q || b.customerName.toLowerCase().includes(q) || b.phone?.toLowerCase().includes(q) || v?.name.toLowerCase().includes(q) || v?.number.toLowerCase().includes(q);
    const matchF = filterB === "All" || b.status === filterB;
    return matchQ && matchF;
  }).sort((a, b) => b.createdAt?.localeCompare(a.createdAt) || 0), [bookings, search.b, filterB, vehicles]);
  const pageBData = filtB.slice((pageB - 1) * PER, pageB * PER);

  const vName = (id) => { const v = vehicles.find(x => x.id === id); return v ? `${v.name} (${v.number})` : "?"; };

  // LOGIN
  if (!authed) {
    return (
      <div className={`${dark ? "dark" : ""} min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4`}>
        <LoginForm onLogin={(u, p) => {
          if (u === AUTH.user && p === AUTH.pass) { setAuthed(true); DB.set("vr_auth", true); }
          else alert("Invalid credentials!\n\nDefault: admin / admin123");
        }} dark={dark} setDark={setDark} />
      </div>
    );
  }

  const navItems = [
    { k: "dashboard", l: "Dashboard", icon: "dashboard" },
    { k: "vehicles", l: "Vehicles", icon: "car" },
    { k: "bookings", l: "Bookings", icon: "book" },
    { k: "calendar", l: "Calendar", icon: "calendar" },
    { k: "reports", l: "Reports", icon: "report" },
  ];

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-gray-50 dark:bg-gray-900 flex`}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 p-4 fixed h-full z-20">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon name="car" cls="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">VehicleRent</p>
              <p className="text-xs text-gray-400">Management App</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(n => (
            <button key={n.k} onClick={() => setNav(n.k)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${nav === n.k ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <Icon name={n.icon} cls="w-4 h-4" /> {n.l}
            </button>
          ))}
        </nav>
        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => setDark(d => !d)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Icon name={dark ? "sun" : "moon"} cls="w-4 h-4" /> {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={() => { setAuthed(false); DB.set("vr_auth", false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Icon name="logout" cls="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-20 flex">
        {navItems.map(n => (
          <button key={n.k} onClick={() => setNav(n.k)} className={`flex-1 flex flex-col items-center py-2 text-[10px] font-medium ${nav === n.k ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
            <Icon name={n.icon} cls="w-5 h-5" /> {n.l}
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className="flex-1 md:ml-56 p-4 pb-20 md:pb-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{nav}</h1>
          <div className="flex gap-2">
            <button onClick={() => setDark(d => !d)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
              <Icon name={dark ? "sun" : "moon"} cls="w-5 h-5" />
            </button>
            {nav === "vehicles" && <Btn onClick={() => setModal({ type: "vehicle" })}><Icon name="plus" cls="w-4 h-4" /> Add Vehicle</Btn>}
            {nav === "bookings" && <Btn onClick={() => setModal({ type: "booking" })}><Icon name="plus" cls="w-4 h-4" /> New Booking</Btn>}
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {nav === "dashboard" && (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex gap-2 items-start">
                <Icon name="alert" cls="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 text-sm">⚠️ Overdue Bookings ({overdue.length})</p>
                  {overdue.map(b => <p key={b.id} className="text-xs text-red-600 dark:text-red-400">{b.customerName} — {vName(b.vehicleId)} (was due {fmt(b.endDate)})</p>)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: "Total Vehicles", v: vehicles.length, color: "blue", icon: "car" },
                { l: "Available", v: availCount, color: "green", icon: "check" },
                { l: "Booked", v: bookedCount, color: "purple", icon: "book" },
                { l: "Maintenance", v: vehicles.filter(v => v.status === "Maintenance").length, color: "yellow", icon: "alert" },
              ].map(s => (
                <Card key={s.l} cls="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.l}</p>
                  <p className={`text-3xl font-bold text-${s.color}-600 dark:text-${s.color}-400 mt-1`}>{s.v}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card cls="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Today's Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{LKR(todayIncome)}</p>
                <p className="text-xs text-gray-400">{todayBks.length} bookings today</p>
              </Card>
              <Card cls="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Monthly Income ({thisMonth})</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{LKR(monthlyIncome)}</p>
                <p className="text-xs text-gray-400">All active & completed bookings</p>
              </Card>
            </div>

            <Card cls="p-4">
              <h3 className="font-semibold text-gray-700 dark:text-white text-sm mb-3">Upcoming Bookings</h3>
              {upcoming.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No upcoming bookings</p>
                : <div className="space-y-2">{upcoming.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{b.customerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{vName(b.vehicleId)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{fmt(b.startDate)}</p>
                        <p className="text-xs text-gray-400">{b.numDays} days</p>
                      </div>
                    </div>
                  ))}</div>
              }
            </Card>

            {/* Vehicle status grid */}
            <Card cls="p-4">
              <h3 className="font-semibold text-gray-700 dark:text-white text-sm mb-3">Fleet Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.number} · {v.type}</p>
                    </div>
                    <div className="text-right">
                      <Badge status={v.status} />
                      <p className="text-xs text-gray-400 mt-0.5">{LKR(v.dailyPrice)}/day</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── VEHICLES ── */}
        {nav === "vehicles" && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <SearchBar value={search.v} onChange={v => { setSearch(p => ({...p, v})); setPageV(1); }} placeholder="Search vehicles..." />
              <select value={filterV} onChange={e => { setFilterV(e.target.value); setPageV(1); }} className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
                {["All", "Available", "Booked", "Maintenance", "Car", "Van", "Bus", "Bike", "Three Wheeler", "SUV"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 dark:border-gray-700">{["Number","Name","Type","Daily Price","Status","Notes","Actions"].map(h => <th key={h} className="text-left py-3 px-3 text-xs text-gray-500 dark:text-gray-400 font-semibold">{h}</th>)}</tr></thead>
                  <tbody>
                    {pageVData.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No vehicles found.</td></tr>}
                    {pageVData.map(v => (
                      <tr key={v.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-600 dark:text-gray-300">{v.number}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-white">{v.name}</td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">{v.type}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-200">{LKR(v.dailyPrice)}</td>
                        <td className="py-2.5 px-3"><Badge status={v.status} /></td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs max-w-[120px] truncate">{v.notes || "—"}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1">
                            <Btn variant="ghost" cls="!px-2 !py-1" onClick={() => setModal({ type: "vehicle", data: v })}><Icon name="edit" cls="w-3.5 h-3.5" /></Btn>
                            <Btn variant="ghost" cls="!px-2 !py-1 text-red-500" onClick={() => delVehicle(v.id)}><Icon name="trash" cls="w-3.5 h-3.5" /></Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3"><Pager total={filtV.length} page={pageV} perPage={PER} setPage={setPageV} /></div>
            </Card>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {nav === "bookings" && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <SearchBar value={search.b} onChange={v => { setSearch(p => ({...p, b: v})); setPageB(1); }} placeholder="Search customer, vehicle..." />
              <select value={filterB} onChange={e => { setFilterB(e.target.value); setPageB(1); }} className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
                {["All", "Booked", "Active", "Completed", "Cancelled"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 dark:border-gray-700">{["Customer","Phone","Vehicle","Period","Days","Total","Advance","Balance","Status","Actions"].map(h => <th key={h} className="text-left py-3 px-2 text-xs text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {pageBData.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-gray-400">No bookings found.</td></tr>}
                    {pageBData.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2.5 px-2 font-medium text-gray-800 dark:text-white whitespace-nowrap">{b.customerName}</td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400">{b.phone || "—"}</td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{vName(b.vehicleId)}</td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{fmt(b.startDate)} – {fmt(b.endDate)}</td>
                        <td className="py-2.5 px-2 text-center">{b.numDays}</td>
                        <td className="py-2.5 px-2 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">{LKR(b.totalAmount)}</td>
                        <td className="py-2.5 px-2 text-green-700 dark:text-green-400 whitespace-nowrap">{LKR(b.advancePayment)}</td>
                        <td className="py-2.5 px-2 text-red-700 dark:text-red-400 whitespace-nowrap">{LKR(b.remainingBalance)}</td>
                        <td className="py-2.5 px-2"><Badge status={b.status} /></td>
                        <td className="py-2.5 px-2">
                          <div className="flex gap-1">
                            <Btn variant="ghost" cls="!px-2 !py-1" onClick={() => setModal({ type: "booking", data: b })}><Icon name="edit" cls="w-3.5 h-3.5" /></Btn>
                            <Btn variant="ghost" cls="!px-2 !py-1 text-red-500" onClick={() => delBooking(b.id)}><Icon name="trash" cls="w-3.5 h-3.5" /></Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3"><Pager total={filtB.length} page={pageB} perPage={PER} setPage={setPageB} /></div>
            </Card>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {nav === "calendar" && (
          <Card cls="p-4">
            <CalendarView bookings={bookings} vehicles={vehicles} />
          </Card>
        )}

        {/* ── REPORTS ── */}
        {nav === "reports" && (
          <Card cls="p-4">
            <ReportsView bookings={bookings} vehicles={vehicles} />
          </Card>
        )}
      </main>

      {/* ── MODALS ── */}
      {modal?.type === "vehicle" && (
        <Modal title={modal.data ? "Edit Vehicle" : "Add Vehicle"} onClose={() => setModal(null)}>
          <VehicleForm initial={modal.data} onSave={saveVehicle} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "booking" && (
        <Modal title={modal.data ? "Edit Booking" : "New Booking"} onClose={() => setModal(null)} wide>
          <BookingForm initial={modal.data} vehicles={vehicles} bookings={bookings} onSave={saveBooking} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin, dark, setDark }) {
  const [u, setU] = useState(""); const [p, setP] = useState("");
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Icon name="car" cls="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 dark:text-white">VehicleRent</h1>
          <p className="text-xs text-gray-400">Management System</p>
        </div>
        <button onClick={() => setDark(d => !d)} className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Icon name={dark ? "sun" : "moon"} cls="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <Input label="Username" value={u} onChange={setU} placeholder="admin" />
        <Input label="Password" type="password" value={p} onChange={setP} placeholder="••••••••" />
        <button onClick={() => onLogin(u, p)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-colors mt-2">
          Sign In
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">Default: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">admin</code> / <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">admin123</code></p>
      </div>
    </div>
  );
}