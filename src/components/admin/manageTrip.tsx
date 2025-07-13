"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPinned,
  Filter,
  ArrowUpDown,
  Edit,
  Trash2,
  Users,
  Download,
  Calendar,
  CalendarDays,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminSidebar from "@/components/sidebar/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import CreateTripModal from "@/components/modals/createTrip";
import EditTripModal from "@/components/modals/editTrip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Trip {
  id: number;
  tripDate: string;
  availableSeats: number;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  arrivalTime?: string;
  van: {
    id: number;
    plateNumber: string;
    capacity: number;
  };
  route: {
    id: number;
    name: string;
    origin: string;
    destination: string;
  };
}

interface ManifestData {
  tripInfo: {
    vanNumber: string;
    driver: string;
    route: string;
    tripDate: string;
    arrivalTime?: string;
  };
  passengers: Array<{
    number: number;
    seatNumber: string;
    passengerName: string;
    age: number;
    address: string;
    contactNumber: string;
    emergencyContact: string;
    paymentStatus: string;
  }>;
  summary: {
    totalPassengers: number;
    totalSeats: number;
    availableSeats: number;
  };
}

type DateFilter = "today" | "tomorrow" | "custom" | "all";

// Status badge component
function TripStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return {
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        };
      case "BOARDING":
        return {
          variant: "default" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        };
      case "DEPARTED":
        return {
          variant: "default" as const,
          className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
        };
      case "COMPLETED":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-100",
        };
      case "CANCELLED":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
        };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };

  const config = getStatusConfig(status);
  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

export default function ManageTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [generatingManifest, setGeneratingManifest] = useState<number | null>(
    null
  );

  // Date filtering states
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const getDateForFilter = (): string | null => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (dateFilter) {
      case "today":
        return today.toISOString().split("T")[0]; // Always send today's date
      case "tomorrow":
        return tomorrow.toISOString().split("T")[0];
      case "custom":
        return customDate || null;
      case "all":
        return null; // No date parameter = all trips
      default:
        return today.toISOString().split("T")[0]; // Default to today
    }
  };

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const filterDate = getDateForFilter();
      const url = filterDate
        ? `/api/admin/trips?date=${filterDate}`
        : `/api/admin/trips`;

      console.log("Fetching trips with URL:", url); // Debug log

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch trips");
      const data = await res.json();

      console.log("Received trips:", data.length); // Debug log
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to fetch trips");
    } finally {
      setLoading(false);
    }
    /* eslint-disable */
  }, [dateFilter, customDate]);

  const deleteTrip = async (tripId: number) => {
    setDeletingId(tripId);
    try {
      const res = await fetch(`/api/admin/trips?id=${tripId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete trip");
      }
      // Remove the trip from the local state
      setTrips(trips.filter((trip) => trip.id !== tripId));
      toast.success("Trip deleted successfully");
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete trip"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setEditModalOpen(true);
  };

  const handleTripUpdated = () => {
    fetchTrips(); // Refresh the trips list
  };

  const generatePassengerManifest = async (trip: Trip) => {
    setGeneratingManifest(trip.id);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}/manifest`);
      if (!response.ok) {
        throw new Error("Failed to generate manifest");
      }

      const manifestData: ManifestData = await response.json();

      // Generate PDF-like content using canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Set canvas size (A4-like proportions)
        canvas.width = 800;
        canvas.height = 1000;

        // Fill background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = "#000000";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PASSENGER MANIFEST", canvas.width / 2, 40);

        // Trip Information
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        const startY = 80;
        ctx.fillText(`VAN#: ${manifestData.tripInfo.vanNumber}`, 50, startY);
        ctx.fillText(
          `DRIVER: ${manifestData.tripInfo.driver}`,
          50,
          startY + 25
        );
        ctx.fillText(`ROUTE: ${manifestData.tripInfo.route}`, 50, startY + 50);
        ctx.fillText(
          `DATE: ${new Date(
            manifestData.tripInfo.tripDate
          ).toLocaleDateString()}`,
          50,
          startY + 75
        );
        if (manifestData.tripInfo.arrivalTime) {
          ctx.fillText(
            `TIME: ${manifestData.tripInfo.arrivalTime}`,
            50,
            startY + 100
          );
        }

        // Table Header
        const tableStartY = 200;
        ctx.font = "bold 14px Arial";
        ctx.fillRect(50, tableStartY, 700, 30); // Header background
        ctx.fillStyle = "#ffffff";
        ctx.fillText("#", 60, tableStartY + 20);
        ctx.fillText("PASSENGER'S NAME", 100, tableStartY + 20);
        ctx.fillText("AGE", 300, tableStartY + 20);
        ctx.fillText("ADDRESS", 350, tableStartY + 20);
        ctx.fillText("CONTACT #", 550, tableStartY + 20);
        ctx.fillText("EMERGENCY", 650, tableStartY + 20);

        // Table Content
        ctx.fillStyle = "#000000";
        ctx.font = "12px Arial";
        manifestData.passengers.forEach((passenger, index) => {
          const rowY = tableStartY + 50 + index * 25;
          // Draw row border
          ctx.strokeRect(50, rowY - 15, 700, 25);

          ctx.fillText(passenger.number.toString(), 60, rowY);
          ctx.fillText(passenger.passengerName, 100, rowY);
          ctx.fillText(passenger.age.toString(), 300, rowY);
          ctx.fillText(passenger.address, 350, rowY);
          ctx.fillText(passenger.contactNumber, 550, rowY);
          ctx.fillText(passenger.emergencyContact, 650, rowY);
        });

        // Summary
        const summaryY =
          tableStartY + 50 + manifestData.passengers.length * 25 + 50;
        ctx.font = "bold 14px Arial";
        ctx.fillText(
          `Total Passengers: ${manifestData.summary.totalPassengers}`,
          50,
          summaryY
        );
        ctx.fillText(
          `Available Seats: ${manifestData.summary.availableSeats}`,
          50,
          summaryY + 25
        );
        ctx.fillText(
          `Van Capacity: ${manifestData.summary.totalSeats}`,
          50,
          summaryY + 50
        );

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `passenger-manifest-${
              manifestData.tripInfo.vanNumber
            }-${
              new Date(manifestData.tripInfo.tripDate)
                .toISOString()
                .split("T")[0]
            }.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        });

        toast.success("Passenger manifest generated successfully!");
      }
    } catch (error) {
      console.error("Error generating manifest:", error);
      toast.error("Failed to generate passenger manifest");
    } finally {
      setGeneratingManifest(null);
    }
  };

  // Helper function to get seat status color
  const getSeatStatusColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 70) return "text-green-600";
    if (percentage > 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getFilterDisplayText = () => {
    switch (dateFilter) {
      case "today":
        return "Today's Trips";
      case "tomorrow":
        return "Tomorrow's Trips";
      case "custom":
        return customDate
          ? `Trips for ${new Date(customDate).toLocaleDateString()}`
          : "Custom Date";
      case "all":
        return "All Trips";
      default:
        return "Today's Trips";
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-r bg-white px-4 py-10 shadow-xl z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center space-x-2">
            <MapPinned className="h-5 w-5 text-black" />
            <h1 className="text-[16px] font-semibold text-black">
              Manage available trips
            </h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-8 bg-[rgba(219,234,254,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600">
                Manage scheduled trips and availability
              </p>
              <p className="text-sm text-gray-500">{getFilterDisplayText()}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filter Trips</span>
            </Button>
          </div>

          {/* Date Filter Controls */}
          {showFilters && (
            <Card className="bg-white shadow-md border-0 mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Filter by Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Button
                    variant={dateFilter === "today" ? "default" : "outline"}
                    onClick={() => setDateFilter("today")}
                    className="flex items-center space-x-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Today</span>
                  </Button>
                  <Button
                    variant={dateFilter === "tomorrow" ? "default" : "outline"}
                    onClick={() => setDateFilter("tomorrow")}
                    className="flex items-center space-x-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Tomorrow</span>
                  </Button>
                  <Button
                    variant={dateFilter === "all" ? "default" : "outline"}
                    onClick={() => setDateFilter("all")}
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>All Trips</span>
                  </Button>
                  <Button
                    variant={dateFilter === "custom" ? "default" : "outline"}
                    onClick={() => setDateFilter("custom")}
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Custom Date</span>
                  </Button>
                </div>

                {dateFilter === "custom" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="customDate"
                      className="text-gray-700 font-medium"
                    >
                      Select Date
                    </Label>
                    <Input
                      id="customDate"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-gray-50 border-gray-200 max-w-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <CreateTripModal onTripCreated={fetchTrips} />
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-transparent"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Trips Table */}
          <Card className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl border-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <p className="p-4 text-gray-600">Loading trips...</p>
                ) : trips.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Trips Found
                    </h3>
                    <p className="text-gray-600">
                      {dateFilter === "today"
                        ? "No trips scheduled for today."
                        : dateFilter === "tomorrow"
                        ? "No trips scheduled for tomorrow."
                        : dateFilter === "custom" && customDate
                        ? `No trips found for ${new Date(
                            customDate
                          ).toLocaleDateString()}.`
                        : "No trips found for the selected criteria."}
                    </p>
                    {dateFilter !== "all" && (
                      <Button
                        variant="outline"
                        onClick={() => setDateFilter("all")}
                        className="mt-4"
                      >
                        View All Trips
                      </Button>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Van
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Route
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Seats
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Driver
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => (
                        <tr
                          key={trip.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="py-4 px-6 text-gray-900">
                            {trip.van.plateNumber}
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {trip.route.name}
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {new Date(trip.tripDate).toLocaleDateString(
                              "en-PH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span
                                className={`font-medium ${getSeatStatusColor(
                                  trip.availableSeats,
                                  trip.van.capacity
                                )}`}
                              >
                                {trip.van.capacity}
                              </span> 
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <TripStatusBadge
                              status={trip.status || "SCHEDULED"}
                            />
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {trip.driverName || "-"}
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {trip.driverPhone || "-"}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={() => generatePassengerManifest(trip)}
                                disabled={generatingManifest === trip.id}
                                title="Generate Passenger Manifest"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditTrip(trip)}
                                title="Edit trip"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                    disabled={deletingId === trip.id}
                                    title="Delete trip"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Trip
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                      <div className="space-y-3">
                                        <div>
                                          Are you sure you want to delete this
                                          trip? This action cannot be undone.
                                        </div>
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md space-y-1">
                                          <div>
                                            <strong>Van:</strong>{" "}
                                            {trip.van.plateNumber}
                                          </div>
                                          <div>
                                            <strong>Route:</strong>{" "}
                                            {trip.route.name}
                                          </div>
                                          <div>
                                            <strong>Date:</strong>{" "}
                                            {new Date(
                                              trip.tripDate
                                            ).toLocaleDateString("en-PH", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })}
                                          </div>
                                          <div>
                                            <strong>Seats:</strong>{" "}
                                            {trip.availableSeats}/
                                            {trip.van.capacity}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <strong>Status:</strong>
                                            <TripStatusBadge
                                              status={
                                                trip.status || "SCHEDULED"
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteTrip(trip.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deletingId === trip.id}
                                    >
                                      {deletingId === trip.id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Trip Modal */}
        <EditTripModal
          trip={editingTrip}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdated={handleTripUpdated}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
