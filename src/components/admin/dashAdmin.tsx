"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bus,
  Calendar,
  Camera,
  CheckCircle,
  Edit3,
  Home,
  MapPinned,
  Plus,
  QrCode,
  RefreshCw,
  Route,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/sidebar/AdminSidebar";
import {
  getPrototypeBookings,
  getPrototypeStats,
  type PrototypeBooking,
  updatePrototypeBooking,
} from "@/lib/prototype";

type Unit = { id: number; model: string; capacity: number; plateNumber: string; status: string };
type Driver = { id: number; name: string; contact: string; license: string; age: number; address: string };
type AdminRoute = { id: number; departure: string; destination: string };
type AdminTrip = {
  id: number;
  routeId: number;
  driverId: number;
  unitId: number;
  date: string;
  time: string;
  status: "Loading" | "Boarding" | "Closed" | "Departing" | "Departed" | "Completed" | "Cancelled";
};

const today = () => new Date().toISOString().slice(0, 10);
const storage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
};
const save = <T,>(key: string, value: T) => window.localStorage.setItem(key, JSON.stringify(value));

const seedUnits: Unit[] = [
  { id: 101, model: "Toyota HiAce", capacity: 13, plateNumber: "RDA 1024", status: "Available" },
  { id: 102, model: "Toyota HiAce", capacity: 13, plateNumber: "RDA 2041", status: "Available" },
  { id: 103, model: "Toyota HiAce", capacity: 13, plateNumber: "RDA 3040", status: "Available" },
  { id: 201, model: "MV RidA Blue", capacity: 48, plateNumber: "FRY 101", status: "Available" },
];
const seedDrivers: Driver[] = [
  { id: 1, name: "Mario Delgado", contact: "0917 100 2001", license: "D01-88-1024", age: 42, address: "Iloilo City" },
  { id: 2, name: "Elmer Dizon", contact: "0917 100 2002", license: "D01-88-2041", age: 39, address: "Oton, Iloilo" },
  { id: 3, name: "Ramon Villa", contact: "0917 100 2003", license: "D01-88-3040", age: 45, address: "Culasi, Antique" },
  { id: 4, name: "Capt. Lito Mercado", contact: "0917 100 2004", license: "SEA-77-101", age: 51, address: "Guimaras" },
];
const seedRoutes: AdminRoute[] = [
  { id: 101, departure: "Iloilo City", destination: "San Jose, Antique" },
  { id: 102, departure: "Iloilo City", destination: "Caticlan" },
  { id: 103, departure: "Culasi", destination: "Iloilo City" },
  { id: 201, departure: "Iloilo City", destination: "Guimaras" },
];
const seedTrips: AdminTrip[] = [
  { id: 101, routeId: 101, driverId: 1, unitId: 101, date: today(), time: "08:30 AM", status: "Loading" },
  { id: 102, routeId: 102, driverId: 2, unitId: 102, date: today(), time: "10:00 AM", status: "Boarding" },
  { id: 103, routeId: 103, driverId: 3, unitId: 103, date: today(), time: "01:00 PM", status: "Loading" },
  { id: 201, routeId: 201, driverId: 4, unitId: 201, date: today(), time: "09:15 AM", status: "Boarding" },
];
const statusOptions: AdminTrip["status"][] = ["Loading", "Boarding", "Closed", "Departing", "Departed", "Completed", "Cancelled"];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="space-y-1 text-sm font-semibold text-slate-700">
    <span>{label}</span>
    {children}
  </label>
);
const inputClass = "h-10 w-full rounded-xl border border-[#b2dfff] bg-white px-3 text-sm outline-none focus:border-[#0141c5]";

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "overview";
  const selectedTripId = Number(searchParams.get("tripId") || 0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [bookings, setBookings] = useState<PrototypeBooking[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setUnits(storage("rida-admin-units", seedUnits));
    setDrivers(storage("rida-admin-drivers", seedDrivers));
    setRoutes(storage("rida-admin-routes", seedRoutes));
    setTrips(storage("rida-admin-trips", seedTrips));
    setBookings(getPrototypeBookings());
  }, []);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((nextStream) => {
      stream = nextStream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [cameraOpen]);

  const stats = getPrototypeStats();
  const latestBooking = bookings[bookings.length - 1];
  const routeName = (id: number) => {
    const route = routes.find((item) => item.id === id);
    return route ? `${route.departure} to ${route.destination}` : "Route not assigned";
  };
  const driverOf = (id: number) => drivers.find((driver) => driver.id === id);
  const unitOf = (id: number) => units.find((unit) => unit.id === id);
  const tripBookings = (tripId: number) => bookings.filter((booking) => booking.tripId === tripId);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0];
  const selectedBookings = selectedTrip ? tripBookings(selectedTrip.id) : [];

  const setAndSaveUnits = (items: Unit[]) => {
    setUnits(items);
    save("rida-admin-units", items);
  };
  const setAndSaveDrivers = (items: Driver[]) => {
    setDrivers(items);
    save("rida-admin-drivers", items);
  };
  const setAndSaveRoutes = (items: AdminRoute[]) => {
    setRoutes(items);
    save("rida-admin-routes", items);
  };
  const setAndSaveTrips = (items: AdminTrip[]) => {
    setTrips(items);
    save("rida-admin-trips", items);
  };

  const handleAddUnit = (form: FormData) => {
    setAndSaveUnits([
      ...units,
      {
        id: Date.now(),
        model: String(form.get("model") || ""),
        capacity: Number(form.get("capacity") || 13),
        plateNumber: String(form.get("plateNumber") || ""),
        status: "Available",
      },
    ]);
  };
  const handleAddDriver = (form: FormData) => {
    setAndSaveDrivers([
      ...drivers,
      {
        id: Date.now(),
        name: String(form.get("name") || ""),
        contact: String(form.get("contact") || ""),
        license: String(form.get("license") || ""),
        age: Number(form.get("age") || 0),
        address: String(form.get("address") || ""),
      },
    ]);
  };
  const handleAddRoute = (form: FormData) => {
    setAndSaveRoutes([
      ...routes,
      { id: Date.now(), departure: String(form.get("departure") || ""), destination: String(form.get("destination") || "") },
    ]);
  };
  const handleAddTrip = (form: FormData) => {
    setAndSaveTrips([
      ...trips,
      {
        id: Date.now(),
        routeId: Number(form.get("routeId")),
        driverId: Number(form.get("driverId")),
        unitId: Number(form.get("unitId")),
        date: String(form.get("date") || today()),
        time: String(form.get("time") || "08:00 AM"),
        status: "Loading",
      },
    ]);
  };

  const updateTripStatus = (tripId: number, status: AdminTrip["status"]) => {
    setAndSaveTrips(trips.map((trip) => (trip.id === tripId ? { ...trip, status } : trip)));
  };

  const handleUpdateUnit = (id: number, form: FormData) => {
    setAndSaveUnits(
      units.map((unit) =>
        unit.id === id
          ? {
              ...unit,
              model: String(form.get("model") || unit.model),
              capacity: Number(form.get("capacity") || unit.capacity),
              plateNumber: String(form.get("plateNumber") || unit.plateNumber),
              status: String(form.get("status") || unit.status),
            }
          : unit,
      ),
    );
    setEditingUnitId(null);
  };

  const handleUpdateDriver = (id: number, form: FormData) => {
    setAndSaveDrivers(
      drivers.map((driver) =>
        driver.id === id
          ? {
              ...driver,
              name: String(form.get("name") || driver.name),
              contact: String(form.get("contact") || driver.contact),
              license: String(form.get("license") || driver.license),
              age: Number(form.get("age") || driver.age),
              address: String(form.get("address") || driver.address),
            }
          : driver,
      ),
    );
    setEditingDriverId(null);
  };

  const handleUpdateRoute = (id: number, form: FormData) => {
    setAndSaveRoutes(
      routes.map((route) =>
        route.id === id
          ? {
              ...route,
              departure: String(form.get("departure") || route.departure),
              destination: String(form.get("destination") || route.destination),
            }
          : route,
      ),
    );
    setEditingRouteId(null);
  };

  const drawManifest = (trip: AdminTrip) => {
    const passengers = tripBookings(trip.id);
    const rows =
      passengers.length > 0
        ? passengers
        : [
            {
              passengerName: "Demo Passenger",
              passengerAge: 24,
              passengerAddress: "Iloilo City",
              passengerPhone: "0917 000 0000",
              passengerEmergencyContact: "0917 111 1111",
              seatNumber: "01",
            } as PrototypeBooking,
          ];
    const unit = unitOf(trip.unitId);
    const driver = driverOf(trip.driverId);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 800;
    canvas.height = 1000;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.font = "bold 26px Arial";
    ctx.fillText("PASSENGER MANIFEST", 400, 40);
    ctx.textAlign = "left";
    ctx.font = "16px Arial";
    ctx.fillText(`VAN#: ${unit?.plateNumber || "-"}`, 50, 80);
    ctx.fillText(`DRIVER: ${driver?.name || "-"} / ${driver?.contact || "-"}`, 50, 105);
    ctx.fillText(`ROUTE: ${routeName(trip.routeId)}`, 50, 130);
    ctx.fillText(`DATE: ${trip.date} ${trip.time}`, 50, 155);
    const y = 200;
    ctx.fillStyle = "#111111";
    ctx.fillRect(50, y, 700, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ["#", "PASSENGER'S NAME", "AGE", "ADDRESS", "CONTACT #", "EMERGENCY"].forEach((head, index) => {
      ctx.fillText(head, [60, 100, 300, 350, 550, 650][index], y + 21);
    });
    ctx.fillStyle = "#111111";
    ctx.font = "12px Arial";
    rows.forEach((row, index) => {
      const rowY = y + 35 + index * 26;
      ctx.strokeRect(50, rowY - 18, 700, 26);
      ctx.fillText(String(index + 1), 60, rowY);
      ctx.fillText(row.passengerName, 100, rowY);
      ctx.fillText(String(row.passengerAge), 300, rowY);
      ctx.fillText(row.passengerAddress, 350, rowY);
      ctx.fillText(row.passengerPhone, 550, rowY);
      ctx.fillText(row.passengerEmergencyContact || "-", 650, rowY);
    });
    const footerY = y + 90 + rows.length * 26;
    ctx.font = "bold 14px Arial";
    ctx.fillText(`Total Passengers: ${rows.length}`, 50, footerY);
    ctx.fillText(`Available Seats: ${Math.max((unit?.capacity || 13) - rows.length, 0)}`, 50, footerY + 25);
    ctx.fillText(`Van Capacity: ${unit?.capacity || 13}`, 50, footerY + 50);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `rida-manifest-${trip.id}.png`;
    a.click();
  };

  const drawPaidTicket = (booking: PrototypeBooking) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 400;
    canvas.height = 620;
    ctx.fillStyle = "#0141c5";
    ctx.fillRect(0, 0, 400, 150);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Arial";
    ctx.fillText("RIDA", 200, 70);
    ctx.font = "14px Arial";
    ctx.fillText("Paid Terminal Ticket", 200, 100);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 150, 400, 470);
    ctx.fillStyle = "#0e2865";
    ctx.font = "bold 96px Arial";
    ctx.fillText(booking.seatNumber, 200, 280);
    ctx.font = "bold 18px Arial";
    ctx.fillText(booking.ticketNumber, 200, 330);
    ctx.font = "15px Arial";
    ctx.fillText(booking.passengerName, 200, 360);
    ctx.fillStyle = "#16a34a";
    ctx.font = "bold 16px Arial";
    ctx.fillText("PAID - READY TO BOARD", 200, 420);
    ctx.fillStyle = "#0f172a";
    ctx.font = "13px Arial";
    ctx.fillText(`Total: PHP ${booking.totalFare.toFixed(2)}`, 200, 455);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `rida-paid-ticket-${booking.ticketNumber}.png`;
    a.click();
  };

  const markPaid = (booking: PrototypeBooking) => {
    const updated = updatePrototypeBooking(booking.id, { paymentStatus: "PAID" });
    setBookings(getPrototypeBookings());
    if (updated) drawPaidTicket(updated);
  };

  const shell = (title: string, description: string, icon: React.ReactNode, body: React.ReactNode) => (
    <Card className="border-0 bg-white shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0141c5] text-white">{icon}</div>
          <div>
            <CardTitle className="text-xl font-black text-[#0e2865]">{title}</CardTitle>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );

  const renderCrud = (
    kind: "units" | "drivers" | "routes",
    body: React.ReactNode,
  ) => shell(
    kind === "units" ? "Manage Units" : kind === "drivers" ? "Driver Management" : "Route Management",
    kind === "units"
      ? "Create, update, and remove operational vans and ferry units."
      : kind === "drivers"
        ? "Create, update, and remove driver or captain profiles."
        : "Create, update, and remove departure and destination routes.",
    kind === "units" ? <Bus /> : kind === "drivers" ? <Users /> : <Route />,
    body,
  );

  const renderView = () => {
    if (currentView === "units") {
      return renderCrud("units", (
        <>
          <form action={handleAddUnit} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Unit Model"><input name="model" required className={inputClass} placeholder="Toyota HiAce" /></Field>
            <Field label="Passenger Capacity"><input name="capacity" type="number" required className={inputClass} placeholder="13" /></Field>
            <Field label="Plate Number"><input name="plateNumber" required className={inputClass} placeholder="RDA 1234" /></Field>
            <Button className="rida-button mt-6 rounded-xl"><Plus className="h-4 w-4" /> Add Unit</Button>
          </form>
          <Table headers={["Model", "Capacity", "Plate Number", "Status", "Action"]}>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b">
                {editingUnitId === unit.id ? (
                  <td colSpan={5} className="py-3">
                    <form action={(form) => handleUpdateUnit(unit.id, form)} className="grid grid-cols-1 gap-2 md:grid-cols-5">
                      <input name="model" defaultValue={unit.model} className={inputClass} />
                      <input name="capacity" type="number" defaultValue={unit.capacity} className={inputClass} />
                      <input name="plateNumber" defaultValue={unit.plateNumber} className={inputClass} />
                      <select name="status" defaultValue={unit.status} className={inputClass}>
                        <option>Available</option>
                        <option>Under Maintenance</option>
                      </select>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl">Save</Button>
                        <Button size="sm" type="button" variant="outline" onClick={() => setEditingUnitId(null)}>Cancel</Button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="py-3">{unit.model}</td><td>{unit.capacity}</td><td>{unit.plateNumber}</td><td>{unit.status}</td>
                    <td className="flex gap-2 py-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUnitId(unit.id)}><Edit3 className="h-4 w-4" /> Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAndSaveUnits(units.filter((item) => item.id !== unit.id))}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </Table>
        </>
      ));
    }

    if (currentView === "drivers") {
      return renderCrud("drivers", (
        <>
          <form action={handleAddDriver} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-6">
            <Field label="Name"><input name="name" required className={inputClass} /></Field>
            <Field label="Contact Number"><input name="contact" required className={inputClass} /></Field>
            <Field label="License"><input name="license" required className={inputClass} /></Field>
            <Field label="Age"><input name="age" type="number" required className={inputClass} /></Field>
            <Field label="Address"><input name="address" required className={inputClass} /></Field>
            <Button className="rida-button mt-6 rounded-xl"><Plus className="h-4 w-4" /> Add Driver</Button>
          </form>
          <Table headers={["Name", "Contact", "License", "Age", "Address", "Action"]}>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-b">
                {editingDriverId === driver.id ? (
                  <td colSpan={6} className="py-3">
                    <form action={(form) => handleUpdateDriver(driver.id, form)} className="grid grid-cols-1 gap-2 md:grid-cols-6">
                      <input name="name" defaultValue={driver.name} className={inputClass} />
                      <input name="contact" defaultValue={driver.contact} className={inputClass} />
                      <input name="license" defaultValue={driver.license} className={inputClass} />
                      <input name="age" type="number" defaultValue={driver.age} className={inputClass} />
                      <input name="address" defaultValue={driver.address} className={inputClass} />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl">Save</Button>
                        <Button size="sm" type="button" variant="outline" onClick={() => setEditingDriverId(null)}>Cancel</Button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="py-3 font-semibold">{driver.name}</td><td>{driver.contact}</td><td>{driver.license}</td><td>{driver.age}</td><td>{driver.address}</td>
                    <td className="flex gap-2 py-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingDriverId(driver.id)}><Edit3 className="h-4 w-4" /> Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAndSaveDrivers(drivers.filter((item) => item.id !== driver.id))}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </Table>
        </>
      ));
    }

    if (currentView === "routes") {
      return renderCrud("routes", (
        <>
          <form action={handleAddRoute} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Departure"><input name="departure" required className={inputClass} placeholder="Iloilo City" /></Field>
            <Field label="Destination"><input name="destination" required className={inputClass} placeholder="San Jose, Antique" /></Field>
            <Button className="rida-button mt-6 rounded-xl"><Plus className="h-4 w-4" /> Add Route</Button>
          </form>
          <Table headers={["Departure", "Destination", "Action"]}>
            {routes.map((route) => (
              <tr key={route.id} className="border-b">
                {editingRouteId === route.id ? (
                  <td colSpan={3} className="py-3">
                    <form action={(form) => handleUpdateRoute(route.id, form)} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <input name="departure" defaultValue={route.departure} className={inputClass} />
                      <input name="destination" defaultValue={route.destination} className={inputClass} />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl">Save</Button>
                        <Button size="sm" type="button" variant="outline" onClick={() => setEditingRouteId(null)}>Cancel</Button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="py-3">{route.departure}</td><td>{route.destination}</td>
                    <td className="flex gap-2 py-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingRouteId(route.id)}><Edit3 className="h-4 w-4" /> Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAndSaveRoutes(routes.filter((item) => item.id !== route.id))}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </Table>
        </>
      ));
    }

    if (currentView === "trips") {
      return shell("Trip Management", "Create same-day trips, update lifecycle status, view passengers, and generate manifests.", <MapPinned />, (
        <>
          <form action={handleAddTrip} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-5">
            <Field label="Driver"><select name="driverId" className={inputClass}>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            <Field label="Unit"><select name="unitId" className={inputClass}>{units.map((u) => <option key={u.id} value={u.id}>{u.plateNumber}</option>)}</select></Field>
            <Field label="Route"><select name="routeId" className={inputClass}>{routes.map((r) => <option key={r.id} value={r.id}>{r.departure} to {r.destination}</option>)}</select></Field>
            <Field label="Date"><input name="date" type="date" defaultValue={today()} className={inputClass} /></Field>
            <Field label="Time"><input name="time" defaultValue="08:00 AM" className={inputClass} /></Field>
            <Button className="rida-button rounded-xl md:col-span-5"><Plus className="h-4 w-4" /> Create Trip</Button>
          </form>
          <Table headers={["Route", "Driver", "Unit", "Date/Time", "Status", "Actions"]}>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b">
                <td className="py-3 font-semibold text-[#0e2865]"><button onClick={() => router.push(`/admin/dashboard?view=passengers&tripId=${trip.id}`)}>{routeName(trip.routeId)}</button></td>
                <td>{driverOf(trip.driverId)?.name}</td><td>{unitOf(trip.unitId)?.plateNumber}</td><td>{trip.date} {trip.time}</td>
                <td><select value={trip.status} onChange={(e) => updateTripStatus(trip.id, e.target.value as AdminTrip["status"])} className={inputClass}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></td>
                <td className="flex gap-2 py-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/dashboard?view=passengers&tripId=${trip.id}`)}>Passengers</Button>
                  <Button size="sm" disabled={!["Closed", "Departing", "Departed", "Completed"].includes(trip.status)} onClick={() => drawManifest(trip)}>Manifest</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateTripStatus(trip.id, "Cancelled")}>Cancel</Button>
                </td>
              </tr>
            ))}
          </Table>
        </>
      ));
    }

    if (currentView === "passengers") {
      return shell("Trip Passenger List", "All passengers booked for the selected trip with payment and booking status.", <Users />, (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-[#eef8ff] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black text-[#0e2865]">{selectedTrip ? routeName(selectedTrip.routeId) : "Trip"}</p>
              <p className="text-sm text-slate-600">{selectedTrip?.date} {selectedTrip?.time} - {selectedTrip?.status}</p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/admin/dashboard?view=trips")}>
              Back to Trip Management
            </Button>
          </div>
          <Table headers={["Passenger", "Age", "Address", "Contact", "Emergency", "Seat", "Status", "Action"]}>
            {(selectedBookings.length ? selectedBookings : bookings).map((booking) => (
              <tr key={booking.id} className="border-b">
                <td className="py-3 font-semibold">{booking.passengerName}</td><td>{booking.passengerAge}</td><td>{booking.passengerAddress}</td><td>{booking.passengerPhone}</td><td>{booking.passengerEmergencyContact || "-"}</td><td className="font-black text-[#0141c5]">{booking.seatNumber}</td><td>{booking.paymentStatus}</td>
                <td className="flex gap-2 py-2"><Button size="sm" onClick={() => markPaid(booking)}>Mark Paid</Button><Button size="sm" variant="ghost" onClick={() => { updatePrototypeBooking(booking.id, { ticketStatus: "CANCELLED" }); setBookings(getPrototypeBookings()); }}>Cancel</Button></td>
              </tr>
            ))}
          </Table>
        </>
      ));
    }

    if (currentView === "scan") {
      return shell("Scan Ticket", "Open the camera, scan a booking QR, confirm payment, and download a paid seat ticket.", <QrCode />, (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-900 p-4">
            {cameraOpen ? <video ref={videoRef} autoPlay playsInline className="h-72 w-full rounded-xl object-cover" /> : <div className="grid h-72 place-items-center rounded-xl bg-slate-800 text-white">Camera preview</div>}
            <Button className="mt-4 w-full rounded-xl" onClick={() => setCameraOpen(!cameraOpen)}><Camera className="h-4 w-4" /> {cameraOpen ? "Close Camera" : "Open Camera"}</Button>
          </div>
          <div className="rounded-2xl border border-[#b2dfff] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#2580d9]">Scanned Booking</p>
            <h3 className="mt-2 text-2xl font-black text-[#0e2865]">{latestBooking?.ticketNumber || "No booking yet"}</h3>
            <p className="mt-2 text-sm text-slate-600">{latestBooking?.passengerName || "Create a passenger booking first."}</p>
            <p className="text-sm text-slate-600">Seat {latestBooking?.seatNumber || "--"} - {latestBooking?.paymentStatus || "PENDING"}</p>
            <Button className="rida-button mt-5 rounded-xl" disabled={!latestBooking} onClick={() => latestBooking && markPaid(latestBooking)}>
              <CheckCircle className="h-4 w-4" /> Confirm Payment and Download Ticket
            </Button>
          </div>
        </div>
      ));
    }

    if (currentView === "reports") {
      const revenue = bookings.reduce((sum, booking) => sum + booking.totalFare, 0);
      return shell("Reports", "Generate revenue and trip operation summaries for daily, weekly, or monthly review.", <BarChart3 />, (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[["Total Trips", trips.length], ["Passengers", bookings.length], ["Paid", bookings.filter((b) => b.paymentStatus === "PAID").length], ["Revenue", `PHP ${revenue.toFixed(2)}`]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#eef8ff] p-5"><p className="text-sm font-semibold text-[#2580d9]">{label}</p><p className="mt-2 text-2xl font-black text-[#0e2865]">{value}</p></div>
            ))}
          </div>
          <div className="flex gap-2"><Button>Daily</Button><Button variant="outline">Weekly</Button><Button variant="outline">Monthly</Button></div>
        </div>
      ));
    }

    return null;
  };

  const homeView = (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[["Total Trips", trips.length], ["Passengers", stats.ticketsSold], ["Earnings", `PHP ${stats.revenue.toFixed(2)}`]].map(([label, value]) => (
          <Card key={label} className="border-0 bg-white shadow-xl"><CardContent className="p-6"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-4xl font-black text-[#0e2865]">{value}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {shell("Quick Actions", "Common cashier/admin tasks.", <Home />, (
          <div className="grid gap-3">
            {[["Manage Units", "units"], ["Driver Management", "drivers"], ["Route Management", "routes"], ["Create Trip", "trips"], ["Scan Ticket", "scan"], ["Reports", "reports"]].map(([label, view]) => (
              <Button key={view} variant="outline" className="justify-start rounded-xl" onClick={() => router.push(`/admin/dashboard?view=${view}`)}>{label}</Button>
            ))}
          </div>
        ))}
        {shell("Today Operations", "Same-day active trips and terminal queue.", <Calendar />, (
          <div className="space-y-3">
            {trips.slice(0, 4).map((trip) => <div key={trip.id} className="rounded-xl bg-[#eef8ff] p-3"><p className="font-bold text-[#0e2865]">{routeName(trip.routeId)}</p><p className="text-sm text-slate-600">{trip.time} - {trip.status}</p></div>)}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-r bg-white px-4 py-10 shadow-xl z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-black" />
              <h1 className="text-[16px] font-semibold text-black">Admin Dashboard</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBookings(getPrototypeBookings())}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 bg-[rgba(219,234,254,0.3)] p-8">
          {currentView === "overview" ? homeView : renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
            {headers.map((head) => <th key={head} className="py-3 pr-4">{head}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
