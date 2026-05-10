import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
type TripWhereClause = {
  status: "SCHEDULED"
  tripDate?: {
    gte: Date
    lte: Date
  }
}
type AdminSeatTrip = {
  id: number
  tripDate: Date
  arrivalTime: string | null
  driverName: string | null
  route: {
    origin: string
    destination: string
  }
  van: {
    plateNumber: string
    capacity: number
  }
  tickets: {
    id: number
    passengerName: string
    paymentStatus: string
    ticketStatus: string
    seat: {
      seatNumber: string
    }
  }[]
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== ADMIN: FETCHING TRIPS ===")

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")

    console.log("Date filter:", dateParam)

    // Build where clause - start with existing status filter
    const whereClause: TripWhereClause = {
      status: "SCHEDULED",
    }

    // Add date filtering ONLY if date parameter is provided
    if (dateParam) {
      // Parse the date and create start/end of day
      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      console.log("Filtering trips between:", startOfDay, "and", endOfDay)

      whereClause.tripDate = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else {
      // No date parameter = show ALL trips (don't add date filter)
      console.log("No date filter provided, showing ALL trips")
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        route: true,
        van: true,
        tickets: {
          where: {
            ticketStatus: {
              in: ["ACTIVE", "USED"],
            },
          },
          include: {
            seat: true,
          },
        },
      },
      orderBy: {
        tripDate: "asc",
      },
    })

    console.log("Found trips:", trips.length)

    const formattedTrips = (trips as AdminSeatTrip[]).map((trip) => ({
      id: trip.id,
      route: `${trip.route.origin} to ${trip.route.destination}`,
      tripDate: trip.tripDate,
      arrivalTime: trip.arrivalTime,
      driverName: trip.driverName,
      van: {
        plateNumber: trip.van.plateNumber,
        capacity: trip.van.capacity,
      },
      totalSeats: trip.van.capacity,
      occupiedSeats: trip.tickets.length,
      availableSeats: trip.van.capacity - trip.tickets.length,
      tickets: trip.tickets.map((ticket) => ({
        id: ticket.id,
        seatNumber: ticket.seat.seatNumber,
        passengerName: ticket.passengerName,
        paymentStatus: ticket.paymentStatus,
        ticketStatus: ticket.ticketStatus,
      })),
    }))

    console.log("Returning formatted trips:", formattedTrips.length)
    return NextResponse.json(formattedTrips)
  } catch (error) {
    console.error("Error fetching admin trips:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
