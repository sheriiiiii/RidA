"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, IdCard, Loader2, ShieldCheck, UserRound } from "lucide-react"
import { createPrototypeTicket, RIDA_PROTOTYPE_MODE } from "@/lib/prototype"

interface PassengerData {
  name: string
  address: string
  age: string
  contactNumber: string
  emergencyContact: string
  classification: string
}

const baseInputClass =
  "h-12 rounded-2xl border-[#b2dfff] bg-white px-4 text-[#0e2865] shadow-sm focus:border-[#2580d9] focus:ring-[#2580d9]"

function PassengerInfoSkeleton() {
  const router = useRouter()

  return (
    <div className="rida-mobile-shell rida-page px-5 py-6">
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0e2865]">Passenger Details</h1>
          <div className="mt-1 h-4 w-20 animate-pulse rounded bg-gray-300" />
        </div>
      </div>

      <Card className="rida-card rounded-[2rem] border-0 p-0">
        <CardContent className="space-y-5 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-300" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-200" />
            </div>
          ))}
          <div className="h-12 w-full animate-pulse rounded-full bg-gray-300" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function PassengerInfo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")
  const seatId = searchParams.get("seatId")
  const seatNumber = searchParams.get("seatNumber")

  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<PassengerData>({
    name: "",
    address: "",
    age: "",
    contactNumber: "",
    emergencyContact: "",
    classification: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (field: keyof PassengerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripId || !seatId) {
      setError("Missing trip or seat information")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (RIDA_PROTOTYPE_MODE) {
        const ticket = createPrototypeTicket({
          tripId: Number(tripId),
          seatNumber: seatNumber || "01",
          passengerName: formData.name,
          passengerAddress: formData.address,
          passengerAge: Number(formData.age),
          passengerPhone: formData.contactNumber,
          passengerEmergencyContact: formData.emergencyContact || formData.contactNumber,
          passengerType: formData.classification.toUpperCase().replace(" ", "_"),
        })

        sessionStorage.setItem("ticketData", JSON.stringify(ticket))
        router.push(`/passenger/payment?ticketId=${ticket.id}`)
        return
      }

      const response = await fetch("/api/passenger/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: Number(tripId),
          seatId: Number(seatId),
          passengerName: formData.name,
          passengerAddress: formData.address,
          passengerAge: Number(formData.age),
          passengerPhone: formData.contactNumber,
          passengerEmergencyContact: formData.emergencyContact || formData.contactNumber,
          passengerType: formData.classification.toUpperCase().replace(" ", "_"),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to create ticket")

      sessionStorage.setItem("ticketData", JSON.stringify(data.ticket))
      router.push(`/passenger/payment?ticketId=${data.ticket.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    const requiredFields = ["name", "address", "age", "contactNumber", "classification"]
    return requiredFields.every((field) => formData[field as keyof PassengerData].trim() !== "")
  }

  const requiresIdVerification = ["Student", "PWD", "Senior Citizen"].includes(formData.classification)

  if (!tripId || !seatId) {
    return (
      <div className="rida-mobile-shell rida-page flex items-center justify-center px-6">
        <div className="rida-card rounded-3xl p-6 text-center">
          <p className="mb-2 font-bold text-red-600">Missing trip or seat information</p>
          <p className="mb-4 text-sm text-slate-500">
            Trip ID: {tripId || "Missing"} | Seat ID: {seatId || "Missing"}
          </p>
          <Button onClick={() => router.push("/passenger/trip-lists")} className="rida-button rounded-full">Back to Trips</Button>
        </div>
      </div>
    )
  }

  if (loading) return <PassengerInfoSkeleton />

  return (
    <main className="rida-mobile-shell rida-page rida-safe-bottom px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Go back">
          <ArrowLeft className="h-5 w-5 text-[#0e2865]" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2580d9]">Step 3 of 5</p>
          <h1 className="text-2xl font-black text-[#0e2865]">Passenger Details</h1>
        </div>
      </div>

      <section className="rida-card mb-5 rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2580d9]">Reserved seat</p>
            <p className="text-3xl font-black text-[#0e2865]">{seatNumber}</p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0141c5] text-white">
            <UserRound className="h-7 w-7" />
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <Card className="rida-card rounded-[2rem] border-0 p-0">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-[#0e2865]">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className={baseInputClass} placeholder="Juan Dela Cruz" disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-bold text-[#0e2865]">Address *</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className={baseInputClass} placeholder="Street, barangay, city" disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age" className="font-bold text-[#0e2865]">Age *</Label>
                <Input id="age" type="number" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} className={baseInputClass} placeholder="25" min="1" max="120" disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classification" className="font-bold text-[#0e2865]">Type *</Label>
                <Select value={formData.classification} onValueChange={(value) => handleInputChange("classification", value)} disabled={isSubmitting}>
                  <SelectTrigger className={`${baseInputClass} w-full`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="PWD">PWD</SelectItem>
                    <SelectItem value="Senior Citizen">Senior Citizen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="font-bold text-[#0e2865]">Contact Number *</Label>
              <Input id="contactNumber" type="tel" value={formData.contactNumber} onChange={(e) => handleInputChange("contactNumber", e.target.value)} className={baseInputClass} placeholder="09XX XXX XXXX" disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact" className="font-bold text-[#0e2865]">Emergency Contact</Label>
              <Input id="emergencyContact" type="tel" value={formData.emergencyContact} onChange={(e) => handleInputChange("emergencyContact", e.target.value)} className={baseInputClass} placeholder="Optional" disabled={isSubmitting} />
            </div>

            {requiresIdVerification && (
              <div className="flex gap-3 rounded-2xl border border-[#b2dfff] bg-[#eef8ff] p-3">
                <IdCard className="mt-0.5 h-5 w-5 shrink-0 text-[#2580d9]" />
                <p className="text-sm font-medium text-[#0e2865]">Please bring your ID upon checking or at the terminal.</p>
              </div>
            )}

            <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2580d9]" />
              <p className="text-sm text-slate-600">Your details are used only for ticket validation and trip manifests.</p>
            </div>

            <Button type="submit" disabled={!isFormValid() || isSubmitting} className="rida-button h-12 w-full rounded-full font-bold disabled:shadow-none">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                "Save and Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
