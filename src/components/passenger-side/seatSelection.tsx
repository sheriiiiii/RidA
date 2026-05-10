"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Clock, Loader2, User } from "lucide-react"
import { getPrototypeSeatData, reservePrototypeSeat, RIDA_PROTOTYPE_MODE, type TransportType } from "@/lib/prototype"

type SeatStatus = "available" | "occupied" | "selected" | "pending"

interface Seat {
  id: string
  seatId: number
  status: SeatStatus
  seatNumber: string
}

interface TripDetails {
  driverName?: string
  arrivalTime?: string
  tripDate: string
  route?: string
  transportType?: TransportType
  unitName?: string
  status?: string
}

interface SeatData {
  tripId: number
  vanId: number
  seats: Seat[]
  tripDetails: TripDetails
}

function SeatSelectionSkeleton() {
  const router = useRouter()

  return (
    <div className="rida-mobile-shell rida-page px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0e2865]">Choose Your Seat</h1>
          <div className="mt-1 h-4 w-40 animate-pulse rounded bg-gray-300" />
        </div>
      </div>

      <div className="mb-8 flex justify-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-1 rounded-full bg-white px-2 py-1">
            <div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
            <div className="h-3 w-12 animate-pulse rounded bg-gray-300" />
          </div>
        ))}
      </div>

      <div className="rida-card mx-auto mb-8 max-w-xs rounded-[2rem] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-16 flex-1 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-16 w-20 animate-pulse rounded-2xl bg-gray-300" />
        </div>
        <div className="grid grid-cols-3 gap-3 justify-items-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 w-20 animate-pulse rounded-2xl bg-gray-300" />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xs">
        <div className="h-12 w-full animate-pulse rounded-full bg-gray-300" />
      </div>
    </div>
  )
}

export default function SeatSelection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")
  const [seatData, setSeatData] = useState<SeatData | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) {
      setError("Trip ID is required")
      setLoading(false)
      return
    }
    fetchSeats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const fetchSeats = async () => {
    try {
      setLoading(true)
      if (RIDA_PROTOTYPE_MODE) {
        const data = getPrototypeSeatData(Number(tripId))
        setSeatData(data)
        setSeats(data.seats)
        return
      }

      const response = await fetch(`/api/trips/${tripId}/seats`)
      if (!response.ok) throw new Error("Failed to fetch seat data")
      const data: SeatData = await response.json()
      setSeatData(data)
      setSeats(data.seats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load seats")
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = (seatNumber: string) => {
    const seat = seats.find((s) => s.seatNumber === seatNumber)
    if (!seat || seat.status === "occupied" || seat.status === "pending") return

    setSeats((prevSeats) =>
      prevSeats.map((s) => {
        if (s.seatNumber === selectedSeat) return { ...s, status: "available" }
        if (s.seatNumber === seatNumber) return { ...s, status: "selected" }
        return s
      }),
    )
    setSelectedSeat(seatNumber)
  }

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case "available":
        return "border-[#b2dfff] bg-white text-[#0141c5] hover:border-[#2580d9] hover:bg-[#eef8ff] cursor-pointer"
      case "occupied":
        return "border-slate-200 bg-[#f3f4f6] text-slate-400 cursor-not-allowed"
      case "selected":
        return "border-[#0141c5] bg-[#0141c5] text-white shadow-lg shadow-[#0141c5]/25 cursor-pointer"
      case "pending":
        return "border-orange-200 bg-[#fff7ed] text-orange-600 cursor-not-allowed"
      default:
        return "border-gray-200 bg-gray-100 text-slate-500"
    }
  }

  const handleContinue = async () => {
    if (!selectedSeat || !tripId) return

    try {
      setReserving(true)
      if (RIDA_PROTOTYPE_MODE) {
        const reservationData = reservePrototypeSeat(Number(tripId), selectedSeat)
        router.push(`/passenger/passenger-info?tripId=${tripId}&seatId=${reservationData.seatId}&seatNumber=${selectedSeat}`)
        return
      }

      const response = await fetch(`/api/trips/${tripId}/seats/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatNumber: selectedSeat }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reserve seat")
      }

      const reservationData = await response.json()
      router.push(`/passenger/passenger-info?tripId=${tripId}&seatId=${reservationData.seatId}&seatNumber=${selectedSeat}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reserve seat")
      fetchSeats()
    } finally {
      setReserving(false)
    }
  }

  if (loading) return <SeatSelectionSkeleton />

  if (error) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center px-6">
        <div className="rida-card rounded-3xl p-6 text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
          <Button onClick={() => router.back()} className="rida-button rounded-full">Go Back</Button>
        </div>
      </div>
    )
  }

  const statusCounts = {
    available: seats.filter((s) => s.status === "available").length,
    occupied: seats.filter((s) => s.status === "occupied").length,
    pending: seats.filter((s) => s.status === "pending").length,
  }

  const vehicleIcon = seatData?.tripDetails.transportType === "FERRY" ? "/assets/ferry-icon.png" : "/assets/van-icon.png"
  const operatorLabel = seatData?.tripDetails.transportType === "FERRY" ? "Captain" : "Driver"
  const firstSeat = seats.find((seat) => seat.seatNumber === "01")
  const remainingSeats = seats.filter((seat) => seat.seatNumber !== "01")

  const seatButton = (seatNumber: string) => {
    const seat = seats.find((s) => s.seatNumber === seatNumber)
    const status = seatNumber === selectedSeat ? "selected" : seat?.status || "available"

    return (
      <button
        key={`seat-${seatNumber}`}
        onClick={() => handleSeatClick(seatNumber)}
        className={`flex h-16 w-20 items-center justify-center rounded-2xl border-2 text-sm font-black transition-all ${getSeatColor(status)}`}
        title={`Seat ${seatNumber}`}
        aria-label={`Seat ${seatNumber} - ${status}`}
        disabled={status === "occupied" || status === "pending"}
      >
        <span className="flex items-center gap-1">
          {status === "selected" && <Check className="h-4 w-4" />}
          {seatNumber}
        </span>
      </button>
    )
  }

  return (
    <main className="rida-mobile-shell rida-page rida-safe-bottom px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2580d9]">Step 2 of 5</p>
          <h1 className="text-2xl font-black text-[#0e2865]">Choose Your Seat</h1>
        </div>
      </div>

      <section className="rida-card mb-5 rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#0e2865]">
              <User className="h-4 w-4 text-[#2580d9]" />
              <span className="truncate">{seatData?.tripDetails.driverName || `Assigned ${operatorLabel.toLowerCase()}`}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{seatData?.tripDetails.route || "Route"} - {seatData?.tripDetails.arrivalTime || "Departure time will be confirmed"}</span>
            </div>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0141c5]">
            <Image src={vehicleIcon} alt="" width={30} height={30} />
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600">
        {[
          ["Available", "border-[#b2dfff] bg-white"],
          ["Occupied", "border-slate-200 bg-[#f3f4f6]"],
          ["Selected", "border-[#0141c5] bg-[#0141c5]"],
          ["Pending", "border-orange-200 bg-[#fff7ed]"],
        ].map(([label, swatch]) => (
          <div key={label} className="flex items-center justify-center gap-1 rounded-full bg-white px-2 py-2 shadow-sm">
            <span className={`h-3 w-3 rounded-full border ${swatch}`} />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>

      <section className="rida-card mx-auto mb-5 max-w-xs rounded-[2rem] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex min-h-16 flex-1 items-center justify-center rounded-2xl border border-dashed border-[#b2dfff] bg-[#eef8ff]">
            <span className="text-sm font-black text-[#0e2865]">{operatorLabel}</span>
          </div>
          {firstSeat ? seatButton("01") : null}
        </div>

        <div className="grid grid-cols-3 gap-3 justify-items-center">
          {remainingSeats.map((seat) => seatButton(seat.seatNumber))}
        </div>
      </section>

      <div className="mx-auto mb-5 max-w-xs rounded-3xl bg-white p-4 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2580d9]">Selected seat</p>
        <p className="text-3xl font-black text-[#0e2865]">{selectedSeat || "--"}</p>
      </div>

      <div className="mx-auto mb-5 max-w-xs">
        <Button
          onClick={handleContinue}
          disabled={!selectedSeat || reserving}
          className="rida-button h-12 w-full rounded-full font-bold disabled:shadow-none"
        >
          {reserving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reserving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>

      <p className="mx-auto max-w-xs text-center text-xs font-medium text-slate-500">
        Available: {statusCounts.available} | Occupied: {statusCounts.occupied} | Pending: {statusCounts.pending}
      </p>
    </main>
  )
}
