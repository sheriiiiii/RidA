"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Home, Loader2 } from "lucide-react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"

interface TicketData {
  id: number
  ticketNumber: string
  totalFare: number
  qrCodeUrl: string
  qrCodeData: string
  paymentStatus?: string
  trip: {
    route: string
    arrivalTime: string
  }
  seat: {
    seatNumber: string
  }
}

export default function ReceiptPage() {
  const router = useRouter()
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const storedReceiptData = sessionStorage.getItem("receiptData")
    if (storedReceiptData) {
      try {
        setTicketData(JSON.parse(storedReceiptData))
      } catch (error) {
        console.error("Failed to parse receipt data:", error)
      }
    }
    setLoading(false)
  }, [])

  const handleDownload = () => {
    if (!ticketData) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 700

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#0141c5"
    ctx.fillRect(0, 0, canvas.width, 150)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 34px Arial"
    ctx.textAlign = "center"
    ctx.fillText("RIDA", canvas.width / 2, 72)
    ctx.font = "14px Arial"
    ctx.fillText("Terminal E-Ticket", canvas.width / 2, 102)

    ctx.fillStyle = "rgba(1, 65, 197, 0.06)"
    ctx.font = "bold 72px Arial"
    ctx.fillText("RIDA", canvas.width / 2, 365)

    ctx.fillStyle = "#0e2865"
    ctx.font = "bold 88px Arial"
    ctx.fillText(ticketData.seat.seatNumber, canvas.width / 2, 250)
    ctx.font = "bold 18px Arial"
    ctx.fillText(ticketData.ticketNumber, canvas.width / 2, 305)
    ctx.font = "15px Arial"
    ctx.fillText(ticketData.trip.route, canvas.width / 2, 332)
    ctx.fillText(`Departure: ${ticketData.trip.arrivalTime}`, canvas.width / 2, 358)

    ctx.fillStyle = "#f59e0b"
    ctx.font = "bold 14px Arial"
    ctx.fillText("PAYMENT PENDING", canvas.width / 2, 392)

    const finishDownload = () => {
      ctx.fillStyle = "#0f172a"
      ctx.font = "12px Arial"
      ctx.fillText("Present this ticket at the counter", canvas.width / 2, 590)
      ctx.fillText(`Total: PHP ${ticketData.totalFare.toFixed(2)}`, canvas.width / 2, 612)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `rida-ticket-${ticketData.ticketNumber}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
    }

    const qrSize = 130
    const qrX = (canvas.width - qrSize) / 2
    const qrY = 420

    if (!ticketData.qrCodeUrl && qrCanvasRef.current) {
      ctx.drawImage(qrCanvasRef.current, qrX, qrY, qrSize, qrSize)
      finishDownload()
      return
    }

    const qrImage = new window.Image()
    qrImage.crossOrigin = "anonymous"
    qrImage.onload = () => {
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
      finishDownload()
    }
    qrImage.onerror = () => {
      if (qrCanvasRef.current) ctx.drawImage(qrCanvasRef.current, qrX, qrY, qrSize, qrSize)
      finishDownload()
    }
    qrImage.src = ticketData.qrCodeUrl
  }

  const handleBackToHome = () => {
    sessionStorage.removeItem("ticketData")
    sessionStorage.removeItem("receiptData")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#0e2865]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-semibold">Loading receipt...</span>
        </div>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center px-6">
        <div className="rida-card rounded-3xl p-6 text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">No ticket information found</p>
          <Button onClick={() => router.push("/passenger/trip-lists")} className="rida-button rounded-full">Back to Trips</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="rida-mobile-shell rida-page rida-safe-bottom px-5 py-6">
      <div className="pointer-events-none fixed -left-[9999px] -top-[9999px]">
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={ticketData.qrCodeData || ticketData.ticketNumber}
          size={256}
          fgColor="#0141c5"
          bgColor="#ffffff"
        />
      </div>

      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2580d9]">Step 5 of 5</p>
          <h1 className="text-2xl font-black text-[#0e2865]">E-Ticket Ready</h1>
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-sm text-slate-600">Proceed to the cashier at the terminal and present this QR code for scanning and payment confirmation.</p>
        <span className="mt-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
          Payment Pending
        </span>
      </div>

      <Card className="rida-card mb-6 overflow-hidden rounded-[2rem] border-0 p-0">
        <div className="rida-map-panel px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <Image src="/assets/3.png" alt="Rida" width={48} height={48} className="rounded-full" />
            <Button onClick={handleDownload} variant="ghost" size="sm" className="rounded-full bg-white/14 text-white hover:bg-white/24">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <CardContent className="relative p-7 text-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <div className="text-7xl font-black text-[#0141c5]">RIDA</div>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2580d9]">Seat</p>
            <p className="mb-5 text-8xl font-black leading-none text-[#0e2865]">{ticketData.seat.seatNumber}</p>

            <div className="mb-6 rounded-3xl bg-[#eef8ff] p-4">
              <p className="text-lg font-black text-[#0e2865]">{ticketData.ticketNumber}</p>
              <p className="text-sm font-medium text-slate-600">{ticketData.trip.route}</p>
              <p className="mt-1 text-xs text-slate-500">Departure: {ticketData.trip.arrivalTime}</p>
            </div>

            <div className="mx-auto mb-4 grid h-40 w-40 place-items-center rounded-3xl border border-[#b2dfff] bg-white p-3 shadow-sm">
              {ticketData.qrCodeUrl ? (
                <Image
                  src={ticketData.qrCodeUrl}
                  alt="Booking QR Code"
                  width={128}
                  height={128}
                  className="h-32 w-32"
                  crossOrigin="anonymous"
                  unoptimized
                  priority
                />
              ) : (
                <QRCodeSVG value={ticketData.qrCodeData || ticketData.ticketNumber} size={128} fgColor="#0141c5" bgColor="#ffffff" />
              )}
            </div>

            <p className="text-xs text-slate-500">Present this QR code at the counter</p>
            <p className="mt-2 text-lg font-black text-[#0e2865]">PHP {ticketData.totalFare.toFixed(2)}</p>
            <p className="mt-3 text-xs font-medium text-orange-700">Failure to pay before cutoff will automatically cancel the seat booking.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleBackToHome} className="rida-button h-12 w-full rounded-full font-bold">
        <Home className="h-5 w-5" />
        Back to Home
      </Button>
    </main>
  )
}
