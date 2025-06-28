"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { User, Mail, Calendar, Edit, Save, X } from "lucide-react"
import { getDbService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { JournalEntry } from "@/lib/types"

export function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [loading, setLoading] = useState(false)
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

  const totalEntries = entries.length
  const joinDate = user ? new Date().toLocaleDateString() : ""

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return

    setLoading(true)
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      })

      if (user) {
        const dbService = getDbService(user.uid)
        await dbService.updateUserProfile({
          displayName: displayName,
        })
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMoodStats = () => {
    if (!entries || entries.length === 0) {
      return []
    }

    const moodCounts = entries.reduce(
      (acc, entry) => {
        if (entry && entry.mood) {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
  }

  const getRecentEntries = () => {
    if (!entries || entries.length === 0) {
      return []
    }

    return entries.filter((entry) => entry && entry.id && entry.title && entry.date).slice(0, 5)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="text-2xl">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-1" />
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">{user?.displayName || "Anonymous User"}</h3>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{totalEntries} journal entries</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Journey Stats</CardTitle>
            <CardDescription>Overview of your emotional timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{totalEntries}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {entries.filter((e) => e && e.date === new Date().toISOString().split("T")[0]).length}
                </div>
                <div className="text-sm text-muted-foreground">Today's Entries</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {new Set(entries.filter((e) => e && e.date).map((e) => e.date)).size}
                </div>
                <div className="text-sm text-muted-foreground">Active Days</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Top Moods</h4>
              <div className="flex flex-wrap gap-2">
                {getMoodStats().length > 0 ? (
                  getMoodStats().map(([mood, count]) => (
                    <Badge key={mood} variant="secondary" className="capitalize">
                      {mood} ({count})
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No mood data available yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {getRecentEntries().length > 0 ? (
                  getRecentEntries().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{entry.title || "Untitled"}</span>
                      <span className="text-xs text-muted-foreground">{entry.date || "Unknown date"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
