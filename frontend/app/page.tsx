"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin,
  QrCode,
  Clock,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  Coffee,
  LogOut,
  Zap,
} from "lucide-react";

type SeatStatus = "AVAILABLE" | "PENDING_CHECKIN" | "OCCUPIED" | "ON_BREAK";

interface Seat {
  id: string;
  floor: number;
  zone: "Silent Zone" | "Power Desk" | "Discussion";
  status: SeatStatus;
  studentRegNo?: string;
  expiresAt?: number; // Unix timestamp in ms
  hogCount: number;
}

const INITIAL_SEATS: Seat[] = Array.from({ length: 36 }, (_, i) => {
  const floor = Math.floor(i / 12) + 1;
  const num = (i % 12) + 1;
  const zone =
    num <= 4 ? "Silent Zone" : num <= 8 ? "Power Desk" : "Discussion";
  return {
    id: `F${floor}-S${num.toString().padStart(2, "0")}`,
    floor,
    zone,
    status: i === 2 || i === 15 ? "OCCUPIED" : i === 5 ? "ON_BREAK" : "AVAILABLE",
    studentRegNo: i === 2 ? "12607648" : i === 15 ? "12623210" : i === 5 ? "12620908" : undefined,
    expiresAt: undefined,
    hogCount: i === 5 ? 6 : i === 2 ? 4 : i % 3,
  };
});

export default function SmartLibraryApp() {
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [regNo, setRegNo] = useState<string>("12615196");
  const [viewMode, setViewMode] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [fastDemoMode, setFastDemoMode] = useState<boolean>(false); // 20s instead of 20m for judges
  const [now, setNow] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Real-time 1-second ticker & auto-release engine
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setSeats((prev) =>
        prev.map((seat) => {
          if (
            (seat.status === "ON_BREAK" || seat.status === "PENDING_CHECKIN") &&
            seat.expiresAt &&
            currentTime >= seat.expiresAt
          ) {
            showToast(`Auto-released ${seat.id} (timer expired)`);
            return {
              ...seat,
              status: "AVAILABLE",
              studentRegNo: undefined,
              expiresAt: undefined,
              hogCount: seat.hogCount + 1,
            };
          }
          return seat;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId) || null;
  const floorSeats = seats.filter((s) => s.floor === activeFloor);

  const bookSeat = (seatId: string) => {
    if (!regNo.trim()) return showToast("Enter your Registration Number first.");
    const durationMs = fastDemoMode ? 20 * 1000 : 5 * 60 * 1000; // 5 min check-in window (20s in demo mode)
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId && s.status === "AVAILABLE"
          ? {
              ...s,
              status: "PENDING_CHECKIN",
              studentRegNo: regNo.trim(),
              expiresAt: Date.now() + durationMs,
            }
          : s
      )
    );
    showToast(`Reserved ${seatId}. Scan seat QR to check in!`);
  };

  const checkInSeat = (seatId: string) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId
          ? { ...s, status: "OCCUPIED", expiresAt: undefined }
          : s
      )
    );
    showToast(`Checked in to ${seatId}!`);
  };

  const startBreak = (seatId: string) => {
    const breakMs = fastDemoMode ? 20 * 1000 : 20 * 60 * 1000; // 20 min break (20s in demo mode)
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId
          ? {
              ...s,
              status: "ON_BREAK",
              expiresAt: Date.now() + breakMs,
            }
          : s
      )
    );
    showToast(
      fastDemoMode
        ? `20-sec Demo Break started on ${seatId}`
        : `20-min Break started on ${seatId}. Auto-releases if late.`
    );
  };

  const releaseSeat = (seatId: string) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId
          ? {
              ...s,
              status: "AVAILABLE",
              studentRegNo: undefined,
              expiresAt: undefined,
            }
          : s
      )
    );
    showToast(`Released ${seatId}`);
  };

  const formatCountdown = (expiresAt?: number) => {
    if (!expiresAt) return "00:00";
    const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const mins = Math.floor(diff / 60)
      .toString()
      .padStart(2, "0");
    const secs = (diff % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const statusStyles: Record<SeatStatus, string> = {
    AVAILABLE:
      "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25",
    PENDING_CHECKIN:
      "bg-amber-500/15 border-amber-500/60 text-amber-300 animate-pulse",
    OCCUPIED: "bg-rose-500/15 border-rose-500/50 text-rose-300",
    ON_BREAK: "bg-sky-500/15 border-sky-500/60 text-sky-300",
  };

  const hoggedSeats = [...seats].sort((a, b) => b.hogCount - a.hogCount).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">
                LibFlow <span className="text-emerald-400">Live</span>
              </h1>
              <p className="text-xs text-slate-400">
                Smart Library Seat Finder • &lt;5s Live Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFastDemoMode(!fastDemoMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                fastDemoMode
                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
              title="Compress 20-minute break timer into 20 seconds for live judging"
            >
              <Zap className="w-3.5 h-3.5" />
              {fastDemoMode ? "Judge Speed: 20s" : "Normal: 20m"}
            </button>

            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode("STUDENT")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  viewMode === "STUDENT"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Floor Map
              </button>
              <button
                onClick={() => setViewMode("ADMIN")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  viewMode === "ADMIN"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Admin View
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}

      {viewMode === "STUDENT" ? (
        <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Floor Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Floor Selector & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex gap-2">
                {[1, 2, 3].map((f) => {
                  const freeCount = seats.filter(
                    (s) => s.floor === f && s.status === "AVAILABLE"
                  ).length;
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        setActiveFloor(f);
                        setSelectedSeatId(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                        activeFloor === f
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Floor {f}{" "}
                      <span className="ml-1 text-xs opacity-80">
                        ({freeCount}/12 free)
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Your Reg No:</span>
                <input
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 w-28 font-mono"
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Awaiting QR Check-In
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500" /> 20-Min Break
              </span>
            </div>

            {/* Interactive SVG-Style Blueprint Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800 text-xs text-slate-400">
                <span>NORTH WING • SILENT STUDY</span>
                <span>FLOOR {activeFloor} LIVE BLUEPRINT</span>
                <span>SOUTH WING • DISCUSSION</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {floorSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => setSelectedSeatId(seat.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                      statusStyles[seat.status]
                    } ${
                      selectedSeatId === seat.id
                        ? "ring-2 ring-white scale-[1.02]"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-sm">
                        {seat.id}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/40">
                        {seat.zone.split(" ")[0]}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold">
                        {seat.status === "AVAILABLE" && "Free"}
                        {seat.status === "PENDING_CHECKIN" &&
                          `Check-in: ${formatCountdown(seat.expiresAt)}`}
                        {seat.status === "OCCUPIED" &&
                          `Reg: ${seat.studentRegNo}`}
                        {seat.status === "ON_BREAK" &&
                          `Break: ${formatCountdown(seat.expiresAt)}`}
                      </div>
                      <div className="text-[11px] opacity-75 mt-0.5">
                        {seat.zone}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Seat Action & QR Check-In Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-5">
            {selectedSeat ? (
              <>
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-semibold uppercase">
                      Floor {selectedSeat.floor} • {selectedSeat.zone}
                    </span>
                    <h2 className="text-2xl font-bold font-mono mt-0.5">
                      Seat {selectedSeat.id}
                    </h2>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      statusStyles[selectedSeat.status]
                    }`}
                  >
                    {selectedSeat.status.replace("_", " ")}
                  </span>
                </div>

                {/* Seat QR Code Display */}
                <div className="bg-white p-4 rounded-xl flex flex-col items-center text-slate-900">
                  <QRCodeSVG
                    value={`LIBFLOW_CHECKIN:${selectedSeat.id}`}
                    size={130}
                  />
                  <span className="text-xs font-mono font-bold mt-2">
                    Desk QR • {selectedSeat.id}
                  </span>
                </div>

                {/* Contextual Controls */}
                <div className="space-y-2.5">
                  {selectedSeat.status === "AVAILABLE" && (
                    <button
                      onClick={() => bookSeat(selectedSeat.id)}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
                    >
                      Book Seat ({regNo})
                    </button>
                  )}

                  {selectedSeat.status === "PENDING_CHECKIN" && (
                    <>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        Auto-cancels in{" "}
                        <strong className="font-mono">
                          {formatCountdown(selectedSeat.expiresAt)}
                        </strong>{" "}
                        unless QR is scanned.
                      </div>
                      <button
                        onClick={() => checkInSeat(selectedSeat.id)}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <QrCode className="w-4 h-4" />
                        Simulate QR Scan Check-In
                      </button>
                    </>
                  )}

                  {selectedSeat.status === "OCCUPIED" && (
                    <>
                      <button
                        onClick={() => startBreak(selectedSeat.id)}
                        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <Coffee className="w-4 h-4" />
                        Start 20-Min Break Timer
                      </button>
                      <button
                        onClick={() => releaseSeat(selectedSeat.id)}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave & Release Seat
                      </button>
                    </>
                  )}

                  {selectedSeat.status === "ON_BREAK" && (
                    <>
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        Bag auto-flagged & seat freed in{" "}
                        <strong className="font-mono">
                          {formatCountdown(selectedSeat.expiresAt)}
                        </strong>
                      </div>
                      <button
                        onClick={() => checkInSeat(selectedSeat.id)}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <QrCode className="w-4 h-4" />
                        Scan QR to Resume Study
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-medium text-slate-300">
                  Select any seat on the floor map
                </p>
                <p className="text-xs">
                  Book a seat, view its desk QR code, or test the 20-minute
                  auto-release break timer.
                </p>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Admin View: Peak Hours & Hogged Seats */
        <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <BarChart3 className="w-5 h-5" />
              <h2>Peak Library Hours (Today)</h2>
            </div>
            <div className="space-y-3 pt-2">
              {[
                { hour: "09:00 AM", pct: 45 },
                { hour: "11:00 AM", pct: 82 },
                { hour: "02:00 PM", pct: 96 },
                { hour: "05:00 PM", pct: 91 },
                { hour: "08:00 PM", pct: 68 },
              ].map((slot) => (
                <div key={slot.hour} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{slot.hour}</span>
                    <span className="text-emerald-400 font-bold">
                      {slot.pct}% Occupied
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${slot.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
              <h2>Most Hogged Seats (Auto-Release Triggers)</h2>
            </div>
            <p className="text-xs text-slate-400">
              Seats where students left bags &gt;20 mins without returning:
            </p>
            <div className="divide-y divide-slate-800">
              {hoggedSeats.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-200">
                      {s.id}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      Floor {s.floor} • {s.zone}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
                    {s.hogCount} auto-releases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}