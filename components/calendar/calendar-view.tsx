"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import type { JournalEntry } from "@/lib/types"
import { getDbService } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"

interface CalendarViewProps {
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export function CalendarView({ onDateSelect, selectedDate }: CalendarViewProps) {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    if (!user) return

    const dbService = getDbService(user.uid)

    // Set up real-time listener for entries
    const unsubscribe = dbService.onEntriesChange((entries) => {
      setEntries(entries)
    })

    return unsubscribe
  }, [user])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEntriesForDate = (date: string) => {
    return entries.filter((entry) => entry.date === date)
  }

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayOfMonth = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const days = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 md:h-16"></div>)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayEntries = getEntriesForDate(dateString)
    const isSelected = selectedDate === dateString
    const isToday = dateString === new Date().toISOString().split("T")[0]

    days.push(
      <div
        key={day}
        className={`h-12 md:h-16 p-1 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
          isSelected ? "bg-primary text-primary-foreground" : ""
        } ${isToday ? "ring-2 ring-primary" : ""}`}
        onClick={() => onDateSelect(dateString)}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isSelected ? "text-primary-foreground" : ""}`}>{day}</span>
          {dayEntries.length > 0 && (
            <div className="flex-1 flex items-end">
              <Badge
                variant="secondary"
                className={`text-xs px-1 py-0 h-4 ${isSelected ? "bg-primary-foreground text-primary" : ""}`}
              >
                {dayEntries.length}
              </Badge>
            </div>
          )}
        </div>
      </div>,
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{monthYear}</span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </CardContent>
    </Card>
  )
}
