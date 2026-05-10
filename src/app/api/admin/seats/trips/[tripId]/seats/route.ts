import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
type SeatWithTickets = {
  id: number
  seatNumber: string
  tickets: {
    paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED"
    ticketStatus: "ACTIVE" | "USED" | "CANCELLED" | "EXPIRED"
  }[]
}
type SeatStatusRecord = {
  id: number
  seatNumber: string
  status: "available" | "occupied" | "pending"
  ticket: SeatWithTickets["tickets"][number] | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId: tripIdParam } = await params
    const tripId = Number.parseInt(tripIdParam)

    console.log("=== ADMIN: FETCHING SEATS FOR TRIP ===", tripId)

    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    // Get trip details with seats
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        van: {
          include: {
            seats: {
              include: {
                tickets: {
                  where: {
                    tripId: tripId,
                    ticketStatus: {
                      in: ["ACTIVE", "USED"],
                    },
                  },
                },
              },
              orderBy: {
                seatNumber: "asc",
              },
            },
          },
        },
        route: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Map seats with their status
    const seatsWithStatus: SeatStatusRecord[] = trip.van.seats.map((seat: SeatWithTickets) => {
      let status: "available" | "occupied" | "pending" = "available"

      if (seat.tickets.length > 0) {
        const ticket = seat.tickets[0]
        if (ticket.paymentStatus === "PENDING") {
          status = "pending"
        } else if (ticket.paymentStatus === "PAID" || ticket.ticketStatus === "USED") {
          status = "occupied"
        }
      }

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        status,
        ticket: seat.tickets[0] || null,
      }
    })

    return NextResponse.json({
      tripId: trip.id,
      vanId: trip.vanId,
      seats: seatsWithStatus,
      tripDetails: {
        route: `${trip.route.origin} to ${trip.route.destination}`,
        driverName: trip.driverName,
        arrivalTime: trip.arrivalTime,
        tripDate: trip.tripDate,
      },
      stats: {
        totalSeats: trip.van.capacity,
        availableSeats: seatsWithStatus.filter((s) => s.status === "available").length,
        occupiedSeats: seatsWithStatus.filter((s) => s.status === "occupied").length,
        pendingSeats: seatsWithStatus.filter((s) => s.status === "pending").length,
      },
    })
  } catch (error) {
    console.error("Error fetching admin seats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
