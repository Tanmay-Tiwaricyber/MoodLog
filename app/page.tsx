"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { getDbService } from "@/lib/database"
import type { JournalEntry } from "@/lib/types"

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return <DashboardPage />
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

function DashboardPage() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState<string>()
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardContent />
      case "new-entry":
        return (
          <JournalEntryForm onSave={() => setCurrentView("entries")} onCancel={() => setCurrentView("dashboard")} />
        )
      case "entries":
        return <EntriesView onEdit={setEditingEntry} />
      case "calendar":
        return <CalendarPage onDateSelect={setSelectedDate} selectedDate={selectedDate} />
      case "analytics":
        return <AnalyticsPage />
      case "profile":
        return <ProfilePage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="md:ml-64 p-4 md:p-8">
        {editingEntry ? (
          <JournalEntryForm
            entry={editingEntry}
            onSave={() => {
              setEditingEntry(null)
              setCurrentView("entries")
            }}
            onCancel={() => setEditingEntry(null)}
          />
        ) : (
          renderContent()
        )}
      </main>
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Here's your emotional journey overview</p>
      </div>
      <AnalyticsCard />
      <RecentEntries />
    </div>
  )
}

function EntriesView({ onEdit }: { onEdit: (entry: JournalEntry) => void }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    if (!user) return

    const dbService = getDbService(user.uid)

    // Set up real-time listener
    const unsubscribe = dbService.onEntriesChange((entries) => {
      // Filter out any invalid entries
      const validEntries = entries.filter((entry) => entry && entry.id && entry.title)
      setEntries(validEntries)
    })

    return unsubscribe
  }, [user])

  const handleDelete = async (entryId: string) => {
    if (!user || !entryId) return

    const dbService = getDbService(user.uid)
    await dbService.deleteJournalEntry(entryId)
    // Entries will be updated automatically via the real-time listener
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Entries</h1>
        <p className="text-muted-foreground">Your complete journal collection</p>
      </div>
      <div className="grid gap-6">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={handleDelete} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No journal entries yet.</p>
            <p className="text-sm text-muted-foreground">Start your emotional journey by creating your first entry!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarPage({ onDateSelect, selectedDate }: { onDateSelect: (date: string) => void; selectedDate?: string }) {
  const { user } = useAuth()
  const [dateEntries, setDateEntries] = useState<JournalEntry[]>([])

  const handleDateSelect = async (date: string) => {
    if (!user) return

    onDateSelect(date)
    const dbService = getDbService(user.uid)
    const entries = await dbService.getEntriesByDate(date)
    // Filter out any invalid entries
    const validEntries = entries.filter((entry) => entry && entry.id && entry.title)
    setDateEntries(validEntries)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">View your entries by date</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarView onDateSelect={handleDateSelect} selectedDate={selectedDate} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{selectedDate ? `Entries for ${selectedDate}` : "Select a date"}</h3>
          {dateEntries.length > 0
            ? dateEntries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <h4 className="font-medium">{entry.title || "Untitled"}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{entry.time || "Unknown time"}</p>
                  <Badge className="mt-2 capitalize">{entry.mood || "unknown"}</Badge>
                </Card>
              ))
            : selectedDate && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No entries for this date.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  )
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Insights into your emotional patterns</p>
      </div>
      <AnalyticsCard />
    </div>
  )
}

function RecentEntries() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    if (!user) return

    const dbService = getDbService(user.uid)

    // Set up real-time listener
    const unsubscribe = dbService.onEntriesChange((entries) => {
      // Filter out any invalid entries and only show 3 most recent
      const validEntries = entries
        .filter((entry) => entry && entry.id && entry.title && entry.date && entry.time)
        .slice(0, 3)
      setEntries(validEntries)
    })

    return unsubscribe
  }, [user])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">{entry.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {entry.date} at {entry.time}
                  </p>
                </div>
                <Badge className="capitalize">{entry.mood}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No entries yet. Start your emotional journey by creating your first entry!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Import statements for components
import { Sidebar } from "@/components/layout/sidebar"
import { JournalEntryForm } from "@/components/journal/journal-entry-form"
import { JournalEntryCard } from "@/components/journal/journal-entry-card"
import { CalendarView } from "@/components/calendar/calendar-view"
import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { ProfilePage } from "@/components/profile/profile-page"
import { SettingsPage } from "@/components/settings/settings-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
