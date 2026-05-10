"use client"

export const RIDA_PROTOTYPE_MODE = process.env.NEXT_PUBLIC_RIDA_PROTOTYPE !== "false"

export type TransportType = "VAN" | "FERRY"
export type PrototypeTripStatus = "LOADING" | "BOARDING" | "CLOSED" | "DEPARTING" | "DEPARTED" | "COMPLETED" | "CANCELLED"
export type PrototypeSeatStatus = "available" | "occupied" | "selected" | "pending"

export interface PrototypeTrip {
  id: number
  tripNumber: string
  route: string
  origin: string
  destination: string
  sector: string
  transportType: TransportType
  availableSeats: number
  totalSeats: number
  fareRegular: number
  fareDiscounted: number
  tripDate: string
  status: PrototypeTripStatus
  arrivalTime: string
  driverName: string
  unitName: string
}

export interface PrototypeBooking {
  id: number
  ticketNumber: string
  tripId: number
  seatNumber: string
  passengerName: string
  passengerAddress: string
  passengerAge: number
  passengerPhone: string
  passengerEmergencyContact: string
  passengerType: string
  paymentStatus: "PENDING" | "PAID"
  ticketStatus: "ACTIVE" | "USED" | "CANCELLED" | "EXPIRED"
  totalFare: number
  discount: number
  qrCodeData: string
  bookedAt: string
}

const BOOKING_KEY = "rida-prototype-bookings"
const RESERVED_KEY = "rida-prototype-reservations"
const ADMIN_KEY = "rida-prototype-admin"

export const prototypeTrips: PrototypeTrip[] = [
  {
    id: 101,
    tripNumber: "VAN-001",
    route: "Iloilo City to San Jose, Antique",
    origin: "Iloilo City",
    destination: "San Jose, Antique",
    sector: "Iloilo - Antique",
    transportType: "VAN",
    availableSeats: 9,
    totalSeats: 13,
    fareRegular: 200,
    fareDiscounted: 160,
    tripDate: new Date().toISOString(),
    status: "LOADING",
    arrivalTime: "08:30 AM",
    driverName: "Mario Delgado",
    unitName: "Toyota HiAce - RDA 1024",
  },
  {
    id: 102,
    tripNumber: "VAN-002",
    route: "Iloilo City to Caticlan",
    origin: "Iloilo City",
    destination: "Caticlan",
    sector: "Iloilo - Caticlan",
    transportType: "VAN",
    availableSeats: 5,
    totalSeats: 13,
    fareRegular: 700,
    fareDiscounted: 660,
    tripDate: new Date().toISOString(),
    status: "BOARDING",
    arrivalTime: "10:00 AM",
    driverName: "Elmer Dizon",
    unitName: "Toyota HiAce - RDA 2041",
  },
  {
    id: 103,
    tripNumber: "VAN-003",
    route: "Culasi to Iloilo City",
    origin: "Culasi",
    destination: "Iloilo City",
    sector: "Culasi - Iloilo",
    transportType: "VAN",
    availableSeats: 8,
    totalSeats: 13,
    fareRegular: 400,
    fareDiscounted: 360,
    tripDate: new Date().toISOString(),
    status: "LOADING",
    arrivalTime: "01:00 PM",
    driverName: "Ramon Villa",
    unitName: "Toyota HiAce - RDA 3040",
  },
  {
    id: 201,
    tripNumber: "FRY-101",
    route: "Iloilo City to Guimaras",
    origin: "Iloilo City",
    destination: "Guimaras",
    sector: "Iloilo - Guimaras",
    transportType: "FERRY",
    availableSeats: 34,
    totalSeats: 48,
    fareRegular: 40,
    fareDiscounted: 32,
    tripDate: new Date().toISOString(),
    status: "BOARDING",
    arrivalTime: "09:15 AM",
    driverName: "Capt. Lito Mercado",
    unitName: "MV RidA Blue",
  },
]

const browserStorage = () => (typeof window === "undefined" ? null : window.localStorage)

const readJson = <T>(key: string, fallback: T): T => {
  const storage = browserStorage()
  if (!storage) return fallback
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJson = <T>(key: string, value: T) => {
  const storage = browserStorage()
  if (storage) storage.setItem(key, JSON.stringify(value))
}

export const getPrototypeBookings = () => readJson<PrototypeBooking[]>(BOOKING_KEY, [])
const getReservations = () => readJson<Record<string, string[]>>(RESERVED_KEY, {})

const saveReservation = (tripId: number, seatNumber: string) => {
  const reservations = getReservations()
  const key = String(tripId)
  const seats = new Set(reservations[key] || [])
  seats.add(seatNumber)
  reservations[key] = Array.from(seats)
  writeJson(RESERVED_KEY, reservations)
}

export const getPrototypeTrips = () => {
  const bookings = getPrototypeBookings()
  const reservations = getReservations()

  return prototypeTrips.map((trip) => {
    const lockedSeats = new Set([
      ...bookings.filter((booking) => booking.tripId === trip.id && booking.ticketStatus === "ACTIVE").map((booking) => booking.seatNumber),
      ...(reservations[String(trip.id)] || []),
    ])

    return {
      ...trip,
      availableSeats: Math.max(trip.totalSeats - lockedSeats.size, 0),
    }
  })
}

export const getPrototypeTrip = (tripId: number) => getPrototypeTrips().find((trip) => trip.id === tripId)

export const getSeatNumbersForTrip = (trip: PrototypeTrip) => {
  const count = trip.transportType === "FERRY" ? 24 : 13
  return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, "0"))
}

export const getPrototypeSeatData = (tripId: number) => {
  const trip = getPrototypeTrip(tripId)
  if (!trip) throw new Error("Trip not found")

  const bookings = getPrototypeBookings()
  const reservations = getReservations()[String(tripId)] || []
  const lockedSeats = new Set([
    ...bookings.filter((booking) => booking.tripId === tripId && booking.ticketStatus === "ACTIVE").map((booking) => booking.seatNumber),
    ...reservations,
  ])

  const seats = getSeatNumbersForTrip(trip).map((seatNumber, index) => ({
    id: `${tripId}-${seatNumber}`,
    seatId: index + 1,
    seatNumber,
    status: lockedSeats.has(seatNumber) ? ("pending" as PrototypeSeatStatus) : ("available" as PrototypeSeatStatus),
  }))

  return {
    tripId,
    vanId: trip.id,
    seats,
    tripDetails: {
      route: trip.route,
      driverName: trip.driverName,
      arrivalTime: trip.arrivalTime,
      tripDate: trip.tripDate,
      transportType: trip.transportType,
      fareRegular: trip.fareRegular,
      fareDiscounted: trip.fareDiscounted,
      unitName: trip.unitName,
      status: trip.status,
    },
  }
}

export const reservePrototypeSeat = (tripId: number, seatNumber: string) => {
  const seatData = getPrototypeSeatData(tripId)
  const seat = seatData.seats.find((item) => item.seatNumber === seatNumber)
  if (!seat || seat.status !== "available") throw new Error("Seat is no longer available")
  saveReservation(tripId, seatNumber)
  return { seatId: seat.seatId }
}

export const createPrototypeTicket = (input: {
  tripId: number
  seatNumber: string
  passengerName: string
  passengerAddress: string
  passengerAge: number
  passengerPhone: string
  passengerEmergencyContact: string
  passengerType: string
}) => {
  const trip = getPrototypeTrip(input.tripId)
  if (!trip) throw new Error("Trip not found")

  const isDiscounted = ["STUDENT", "PWD", "SENIOR_CITIZEN"].includes(input.passengerType)
  const totalFare = isDiscounted ? trip.fareDiscounted : trip.fareRegular
  const discount = isDiscounted ? trip.fareRegular - trip.fareDiscounted : 0
  const id = Date.now()
  const ticketNumber = `RIDA-${String(id).slice(-6)}`
  const qrCodeData = JSON.stringify({
    ticketNumber,
    tripId: trip.id,
    route: trip.route,
    seatNumber: input.seatNumber,
    passengerName: input.passengerName,
    status: "PENDING_PAYMENT",
  })

  const booking: PrototypeBooking = {
    id,
    ticketNumber,
    tripId: trip.id,
    seatNumber: input.seatNumber,
    passengerName: input.passengerName,
    passengerAddress: input.passengerAddress,
    passengerAge: input.passengerAge,
    passengerPhone: input.passengerPhone,
    passengerEmergencyContact: input.passengerEmergencyContact,
    passengerType: input.passengerType,
    paymentStatus: "PENDING",
    ticketStatus: "ACTIVE",
    totalFare,
    discount,
    qrCodeData,
    bookedAt: new Date().toISOString(),
  }

  writeJson(BOOKING_KEY, [...getPrototypeBookings(), booking])

  return {
    id: booking.id,
    ticketNumber: booking.ticketNumber,
    totalFare: booking.totalFare,
    discount: booking.discount,
    passengerType: booking.passengerType,
    qrCodeUrl: "",
    qrCodeData: booking.qrCodeData,
    paymentStatus: booking.paymentStatus,
    trip: {
      id: trip.id,
      route: trip.route,
      tripDate: trip.tripDate,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      transportType: trip.transportType,
    },
    seat: {
      seatNumber: booking.seatNumber,
    },
  }
}

export const markPrototypePaymentPending = (ticketId: number) => {
  const bookings = getPrototypeBookings()
  writeJson(
    BOOKING_KEY,
    bookings.map((booking) => (booking.id === ticketId ? { ...booking, paymentStatus: "PENDING" } : booking)),
  )
}

export const updatePrototypeBooking = (
  ticketId: number,
  updates: Partial<Pick<PrototypeBooking, "paymentStatus" | "ticketStatus">>,
) => {
  const bookings = getPrototypeBookings()
  const updatedBookings = bookings.map((booking) => (booking.id === ticketId ? { ...booking, ...updates } : booking))
  writeJson(BOOKING_KEY, updatedBookings)
  return updatedBookings.find((booking) => booking.id === ticketId) || null
}

export const getPrototypeStats = () => {
  const trips = getPrototypeTrips()
  const bookings = getPrototypeBookings()
  const passengers = bookings.length
  const revenue = bookings.reduce((sum, booking) => sum + booking.totalFare, 0)

  return {
    totalTrips: trips.length,
    totalVans: trips.filter((trip) => trip.transportType === "VAN").length,
    activeVans: trips.filter((trip) => trip.transportType === "VAN" && trip.status !== "CANCELLED").length,
    todayTripCount: trips.length,
    completedTripsCount: trips.filter((trip) => trip.status === "COMPLETED").length,
    ticketsSold: passengers,
    pendingTickets: bookings.filter((booking) => booking.paymentStatus === "PENDING").length,
    revenue,
  }
}

export const signInPrototypeAdmin = () => {
  const storage = browserStorage()
  if (storage) storage.setItem(ADMIN_KEY, "true")
}

export const signOutPrototypeAdmin = () => {
  const storage = browserStorage()
  if (storage) storage.removeItem(ADMIN_KEY)
}

export const getPrototypeAdminUser = () => {
  const storage = browserStorage()
  if (!storage || storage.getItem(ADMIN_KEY) !== "true") return null

  return {
    id: "prototype-admin",
    email: "admin@rida.demo",
    user_metadata: {
      name: "RidA Demo Admin",
    },
  }
}
