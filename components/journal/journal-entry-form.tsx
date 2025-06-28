"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { JournalEntry } from "@/lib/types"
import { getDbService } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"
import { Smile, Frown, Angry, Zap, Leaf, AlertCircle, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface JournalEntryFormProps {
  entry?: JournalEntry
  onSave: () => void
  onCancel: () => void
}

const moodIcons = {
  happy: Smile,
  sad: Frown,
  angry: Angry,
  excited: Zap,
  calm: Leaf,
  anxious: AlertCircle,
}

const moodColors = {
  happy: "text-yellow-500",
  sad: "text-blue-500",
  angry: "text-red-500",
  excited: "text-purple-500",
  calm: "text-green-500",
  anxious: "text-gray-500",
}

export function JournalEntryForm({ entry, onSave, onCancel }: JournalEntryFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState(entry?.title || "")
  const [content, setContent] = useState(entry?.content || "")
  const [mood, setMood] = useState<JournalEntry["mood"]>(entry?.mood || "happy")
  const [time, setTime] = useState(
    entry?.time || new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const dbService = getDbService(user.uid)

      if (entry) {
        // Update existing entry
        const updatedEntry: JournalEntry = {
          ...entry,
          title,
          content,
          mood,
          time,
        }

        const success = await dbService.updateJournalEntry(updatedEntry)
        if (success) {
          toast({
            title: "Entry updated",
            description: "Your journal entry has been updated successfully.",
          })
          onSave()
        } else {
          throw new Error("Failed to update entry")
        }
      } else {
        // Create new entry
        const newEntry = {
          title,
          content,
          mood,
          date: new Date().toISOString().split("T")[0],
          time,
          createdAt: new Date(),
          userId: user.uid,
        }

        const entryId = await dbService.addJournalEntry(newEntry)
        if (entryId) {
          toast({
            title: "Entry saved",
            description: "Your journal entry has been saved successfully.",
          })
          onSave()
        } else {
          throw new Error("Failed to save entry")
        }
      }
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast({
        title: "Error",
        description: "Failed to save your journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const MoodIcon = moodIcons[mood]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MoodIcon className={`h-6 w-6 ${moodColors[mood]}`} />
          {entry ? "Edit Entry" : "New Journal Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="How are you feeling today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Select value={mood} onValueChange={(value: JournalEntry["mood"]) => setMood(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your mood" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(moodIcons).map(([moodKey, Icon]) => (
                  <SelectItem key={moodKey} value={moodKey}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${moodColors[moodKey as keyof typeof moodColors]}`} />
                      <span className="capitalize">{moodKey}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write about your thoughts and feelings..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
