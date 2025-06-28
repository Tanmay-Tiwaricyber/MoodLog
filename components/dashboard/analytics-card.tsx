"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { JournalEntry } from "@/lib/types"
import { getDbService } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, BookOpen, Calendar, Heart } from "lucide-react"

export function AnalyticsCard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    mostCommonMood: "",
    thisWeekEntries: 0,
  })

  useEffect(() => {
    if (!user) return

    const dbService = getDbService(user.uid)

    // Set up real-time listener
    const unsubscribe = dbService.onEntriesChange((entries) => {
      // Filter out any invalid entries and ensure we have real entries
      const validEntries = entries.filter(
        (entry) => entry && entry.id && entry.title && entry.content && entry.mood && entry.date,
      )
      setEntries(validEntries)
      calculateStats(validEntries)
    })

    // Cleanup listener on unmount
    return unsubscribe
  }, [user])

  const calculateStats = (entries: JournalEntry[]) => {
    const totalEntries = entries.length

    // Calculate current streak
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0

    if (sortedEntries.length > 0) {
      let currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      for (const entry of sortedEntries) {
        const entryDate = new Date(entry.date)
        entryDate.setHours(0, 0, 0, 0)

        const diffTime = currentDate.getTime() - entryDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === currentStreak) {
          currentStreak++
          currentDate = new Date(entryDate)
        } else if (diffDays > currentStreak) {
          break
        }
      }
    }

    // Most common mood - only calculate if we have entries
    let mostCommonMood = ""
    if (entries.length > 0) {
      const moodCounts = entries.reduce(
        (acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      if (Object.keys(moodCounts).length > 0) {
        mostCommonMood = Object.entries(moodCounts).reduce((a, b) => (moodCounts[a[0]] > moodCounts[b[0]] ? a : b))[0]
      }
    }

    // This week entries
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    oneWeekAgo.setHours(0, 0, 0, 0)

    const thisWeekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate >= oneWeekAgo
    }).length

    setStats({
      totalEntries,
      currentStreak,
      mostCommonMood,
      thisWeekEntries,
    })
  }

  const getMoodData = () => {
    // Return empty array if no entries, don't show fake "No data" entry
    if (entries.length === 0) {
      return []
    }

    const moodCounts = entries.reduce(
      (acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(moodCounts).map(([mood, count]) => ({
      name: mood,
      value: count,
    }))
  }

  const getWeeklyData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      const dayEntries = entries.filter((entry) => entry.date === dateString)

      last7Days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        entries: dayEntries.length,
      })
    }
    return last7Days
  }

  const moodColors = {
    happy: "#fbbf24",
    sad: "#3b82f6",
    angry: "#ef4444",
    excited: "#8b5cf6",
    calm: "#10b981",
    anxious: "#6b7280",
  }

  const moodData = getMoodData()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
          <p className="text-xs text-muted-foreground">Your journal collection</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentStreak}</div>
          <p className="text-xs text-muted-foreground">Days in a row</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeekEntries}</div>
          <p className="text-xs text-muted-foreground">Entries this week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Common Mood</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {stats.mostCommonMood ? (
              <Badge className="capitalize">{stats.mostCommonMood}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">No data yet</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Most frequent feeling</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getWeeklyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entries" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No entries yet</p>
                <p className="text-xs mt-1">Start journaling to see your activity</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Mood Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={moodColors[entry.name as keyof typeof moodColors] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No mood data yet</p>
                <p className="text-xs mt-1">Create entries to track your emotions</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
