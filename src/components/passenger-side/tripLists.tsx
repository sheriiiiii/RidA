"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Calendar, Clock, Bus, MapPin, RefreshCw, Search, Ship, Users } from "lucide-react"
import Image from "next/image"
import { getPrototypeTrips, RIDA_PROTOTYPE_MODE, type PrototypeTripStatus, type TransportType } from "@/lib/prototype"

interface Trip {
  id: number
  tripNumber: string
  route: string
  sector?: string
  transportType?: TransportType
  availableSeats: number
  totalSeats?: number
  fareRegular?: number
  fareDiscounted?: number
  tripDate: string
  status: "SCHEDULED" | "BOARDING" | "DEPARTED" | "COMPLETED" | "CANCELLED" | PrototypeTripStatus
  arrivalTime?: string
  driverName?: string
  unitName?: string
}

// Skeleton component that matches the trip card structure
function TripCardSkeleton() {
  return (
    <Card className="rida-card rounded-3xl border-0 p-0">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <div className="h-4 w-4 animate-pulse rounded-full bg-[#b2dfff]"></div>
                <div className="h-3 w-16 animate-pulse rounded bg-[#b2dfff]"></div>
              </div>
              <div className="h-6 w-36 animate-pulse rounded bg-gray-200"></div>
            </div>
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-gray-200"></div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="h-16 animate-pulse rounded-2xl bg-gray-100"></div>
            <div className="h-16 animate-pulse rounded-2xl bg-gray-100"></div>
          </div>

          <div className="h-11 w-full animate-pulse rounded-full bg-gray-200"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TripLists() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [transportFilter, setTransportFilter] = useState<"ALL" | TransportType>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "LOADING":
        return {
          text: "Loading",
          color: "text-[#0141c5]",
          bgColor: "bg-[#b2dfff]",
        }
      case "SCHEDULED":
        return {
          text: "Loading",
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "BOARDING":
        return {
          text: "Now Boarding",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        }
      case "CLOSED":
        return {
          text: "Closed",
          color: "text-slate-600",
          bgColor: "bg-slate-100",
        }
      case "DEPARTING":
        return {
          text: "Departing",
          color: "text-orange-700",
          bgColor: "bg-orange-100",
        }
      default:
        return { text: status, color: "text-gray-600", bgColor: "bg-gray-100" }
    }
  }

  const fetchTrips = async () => {
    setLoading(true)
    try {
      if (RIDA_PROTOTYPE_MODE) {
        setTrips(getPrototypeTrips())
        return
      }

      const res = await fetch("/api/passenger/trips")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch trips")
      setTrips(data)
    } catch (err) {
      console.error("Error fetching trips:", err)
      setTrips(getPrototypeTrips())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
    // Refresh trips every 30 seconds to get real-time updates
    const interval = setInterval(fetchTrips, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectSeat = (tripId: number) => {
    router.push(`/passenger/seat-selection?tripId=${tripId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const filteredTrips = trips.filter((trip) => {
    const matchesTransport = transportFilter === "ALL" || trip.transportType === transportFilter
    const searchable = `${trip.route} ${trip.sector || ""} ${trip.tripNumber} ${trip.arrivalTime || ""}`.toLowerCase()
    return matchesTransport && searchable.includes(searchQuery.trim().toLowerCase())
  })

  const getTransportIcon = (transportType?: TransportType) => (transportType === "FERRY" ? "/assets/ferry-icon.png" : "/assets/van-icon.png")
  const getTransportLabel = (transportType?: TransportType) => (transportType === "FERRY" ? "Ferry" : "Van")

  return (
    <main className="rida-mobile-shell rida-page rida-safe-bottom">
      <section className="rida-map-panel rounded-b-[2rem] px-5 pb-8 pt-5 text-white">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/assets/3.png" alt="Rida" width={46} height={46} className="rounded-full" priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b2dfff]">Passenger</p>
              <h1 className="text-2xl font-black">Find Your Ride</h1>
            </div>
          </div>
          <button
            onClick={fetchTrips}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Refresh trips"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/82">
            <Calendar className="h-4 w-4 text-[#b2dfff]" />
            <span>{formatDate(new Date().toISOString())}</span>
          </div>
          <p className="mt-2 text-3xl font-black">{loading ? "Checking" : trips.length}</p>
          <p className="text-sm text-white/72">{loading ? "Looking for available departures" : "Available departures today"}</p>
        </div>
      </section>

      <section className="-mt-4 space-y-4 px-5 pb-8">
        <div className="rida-card rounded-3xl p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2580d9]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search route or sector"
              className="h-11 w-full rounded-2xl border border-[#b2dfff] bg-white pl-10 pr-4 text-sm font-medium text-[#0e2865] outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "ALL", label: "All", icon: MapPin },
              { value: "VAN", label: "Van", icon: Bus },
              { value: "FERRY", label: "Ferry", icon: Ship },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTransportFilter(value as "ALL" | TransportType)}
                className={`flex h-10 items-center justify-center gap-1 rounded-full text-xs font-black transition ${
                  transportFilter === value ? "bg-[#0141c5] text-white" : "bg-[#eef8ff] text-[#0e2865]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <>
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </>
        ) : filteredTrips.length === 0 ? (
          <div className="rida-card rounded-3xl px-6 py-10 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-[#2580d9]" />
            <p className="text-sm font-bold text-[#0e2865]">No matching trips available</p>
            <p className="mt-1 text-xs text-slate-500">Try another route, sector, or transport type.</p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const statusInfo = getStatusInfo(trip.status)
            return (
              <Card key={trip.id} className="rida-card overflow-hidden rounded-3xl border-0 p-0">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2580d9]">
                          {trip.transportType === "FERRY" ? <Ship className="h-3.5 w-3.5" /> : <Bus className="h-3.5 w-3.5" />}
                          <span>{trip.tripNumber} - {getTransportLabel(trip.transportType)}</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight text-[#0e2865]">{trip.route}</h2>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{trip.sector || "Same-day terminal route"}</span>
                        </div>
                      </div>
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#0141c5]">
                        <Image src={getTransportIcon(trip.transportType)} alt="" width={42} height={42} className="object-contain" />
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-[#eef8ff] p-3">
                        <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#2580d9]">
                          <Users className="h-3.5 w-3.5" />
                          Seats
                        </div>
                        <p className="text-xl font-black text-[#0e2865]">{trip.availableSeats}/{trip.totalSeats || 13}</p>
                      </div>
                      <div className="rounded-2xl bg-[#eef8ff] p-3">
                        <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#2580d9]">
                          <Clock className="h-3.5 w-3.5" />
                          Time
                        </div>
                        <p className="truncate text-xl font-black text-[#0e2865]">{trip.arrivalTime || "Today"}</p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-2xl bg-[#f8fbff] px-3 py-2 text-sm font-bold text-[#0e2865]">
                      Fare: PHP {trip.fareRegular || 210} <span className="font-medium text-slate-500">/ Discounted PHP {trip.fareDiscounted || 170}</span>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className={`rounded-full px-3 py-1 ${statusInfo.bgColor}`}>
                        <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                      </div>
                      {trip.driverName && <p className="truncate text-xs font-medium text-slate-500">Driver: {trip.driverName}</p>}
                    </div>

                    <Button
                      onClick={() => handleSelectSeat(trip.id)}
                      disabled={trip.availableSeats === 0}
                      className="rida-button h-12 w-full rounded-full text-sm font-bold disabled:bg-gray-300 disabled:shadow-none"
                    >
                      {trip.availableSeats === 0 ? "Fully Booked" : "Select a seat"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
        <p className="text-center text-xs font-medium text-slate-400">Updates automatically every 30 seconds</p>
      </section>
    </main>
  )
}
