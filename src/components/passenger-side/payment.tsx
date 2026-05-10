"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, MapPin, ReceiptText, WalletCards } from "lucide-react"
import { markPrototypePaymentPending, RIDA_PROTOTYPE_MODE } from "@/lib/prototype"

interface TicketData {
  id: number
  ticketNumber: string
  totalFare: number
  discount: number
  passengerType: string
  qrCodeUrl: string
  qrCodeData: string
  trip: {
    id: number
    route: string
    tripDate: string
    arrivalTime: string
  }
  seat: {
    seatNumber: string
  }
}

export default function Payment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketId = searchParams.get("ticketId")
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedTicketData = sessionStorage.getItem("ticketData")
    if (storedTicketData) {
      try {
        setTicketData(JSON.parse(storedTicketData))
      } catch {
        setError("Failed to parse ticket information")
      }
    } else {
      setError("No ticket information found")
    }
  }, [ticketId])

  const handlePayAtCounter = async () => {
    if (!ticketData) return

    setIsProcessing(true)
    setError(null)

    try {
      if (RIDA_PROTOTYPE_MODE) {
        markPrototypePaymentPending(ticketData.id)
        sessionStorage.setItem("receiptData", JSON.stringify({ ...ticketData, paymentStatus: "PENDING" }))
        router.push("/passenger/receipt")
        return
      }

      const response = await fetch(`/api/passenger/tickets/${ticketData.id}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "PENDING" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update payment status")
      }

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to process payment")

      sessionStorage.setItem("receiptData", JSON.stringify({ ...ticketData, paymentStatus: "PENDING" }))
      router.push("/passenger/receipt")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatAmount = (amount: number) => amount.toFixed(2)

  const getDiscountInfo = () => {
    if (!ticketData) return null
    const originalAmount = 210
    const isDiscounted = ticketData.discount > 0
    const discountType =
      ticketData.passengerType === "STUDENT"
        ? "Student Discount"
        : ticketData.passengerType === "PWD"
          ? "PWD Discount"
          : ticketData.passengerType === "SENIOR_CITIZEN"
            ? "Senior Citizen Discount"
            : null

    return { isDiscounted, originalAmount: isDiscounted ? originalAmount : null, discountType }
  }

  if (error) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center px-6">
        <div className="rida-card rounded-3xl p-6 text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
          <Button onClick={() => router.push("/passenger/trip-lists")} className="rida-button rounded-full">Back to Trips</Button>
        </div>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#0e2865]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-semibold">Loading payment information...</span>
        </div>
      </div>
    )
  }

  const discountInfo = getDiscountInfo()

  return (
    <main className="rida-mobile-shell rida-page rida-safe-bottom px-5 py-6">
      <div className="mb-7 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" disabled={isProcessing} aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2580d9]">Step 4 of 5</p>
          <h1 className="text-2xl font-black text-[#0e2865]">Payment</h1>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <section className="rida-map-panel mb-5 overflow-hidden rounded-[2rem] p-5 text-white">
        <div className="mb-8 flex items-center justify-between">
          <Image src="/assets/3.png" alt="Rida" width={50} height={50} className="rounded-full" />
          <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-bold backdrop-blur">Pay at counter</span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2dfff]">Total Fare</p>
        <p className="mt-2 text-5xl font-black">PHP {formatAmount(ticketData.totalFare)}</p>
        {discountInfo?.isDiscounted && discountInfo.originalAmount && (
          <div className="mt-4 rounded-2xl bg-white/12 p-3 backdrop-blur">
            <p className="text-sm text-white/70 line-through">PHP {formatAmount(discountInfo.originalAmount)}</p>
            <p className="text-sm font-bold text-[#b2dfff]">
              {discountInfo.discountType} applied (-PHP {formatAmount(ticketData.discount)})
            </p>
          </div>
        )}
        <p className="mt-3 text-xs text-white/72">Includes PHP 10.00 transaction fee.</p>
      </section>

      <section className="rida-card mb-5 rounded-3xl p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef8ff] text-[#0141c5]">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#0e2865]">{ticketData.ticketNumber}</p>
            <p className="truncate text-xs text-slate-500">{ticketData.trip.route}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-[#eef8ff] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2580d9]">Seat</p>
            <p className="text-xl font-black text-[#0e2865]">{ticketData.seat.seatNumber}</p>
          </div>
          <div className="rounded-2xl bg-[#eef8ff] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2580d9]">Departure</p>
            <p className="truncate text-xl font-black text-[#0e2865]">{ticketData.trip.arrivalTime}</p>
          </div>
        </div>
      </section>

      <Button disabled className="mb-3 h-14 w-full rounded-full border border-[#b2dfff] bg-white text-base font-bold text-[#0141c5] opacity-70">
        Pay Online - Coming Soon
      </Button>

      <Button onClick={handlePayAtCounter} disabled={isProcessing} className="rida-button mb-4 h-14 w-full rounded-full text-base font-bold">
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <MapPin className="h-5 w-5" />
            Pay at the Counter
          </>
        )}
      </Button>

      <div className="flex gap-3 rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
        <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-[#2580d9]" />
        <p>Pay Online is planned for the full version. For tomorrow&apos;s prototype, use Pay at the Terminal. Failure to pay before cutoff automatically cancels the seat booking.</p>
      </div>
    </main>
  )
}
