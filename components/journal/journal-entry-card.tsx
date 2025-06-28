"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { JournalEntry } from "@/lib/types"
import { Smile, Frown, Angry, Zap, Leaf, AlertCircle, Edit, Trash2, Clock } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

interface JournalEntryCardProps {
  entry: JournalEntry
  onEdit: (entry: JournalEntry) => void
  onDelete: (entryId: string) => void
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
  happy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  sad: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  angry: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  excited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  calm: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  anxious: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const MoodIcon = moodIcons[entry.mood]

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Invalid date"
    }
  }

  const truncateContent = (content: string | undefined, maxLength = 150) => {
    if (!content || typeof content !== "string") return "No content available"
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  // Safely access entry properties with fallbacks
  const safeEntry = {
    id: entry.id || "",
    title: entry.title || "Untitled Entry",
    content: entry.content || "",
    mood: entry.mood || "happy",
    date: entry.date || new Date().toISOString().split("T")[0],
    time: entry.time || "00:00",
  }

  const shouldShowReadMore = safeEntry.content && safeEntry.content.length > 150

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{safeEntry.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatDate(safeEntry.date)} at {safeEntry.time}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={moodColors[safeEntry.mood]}>
              <MoodIcon className="h-3 w-3 mr-1" />
              {safeEntry.mood}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            {isExpanded ? safeEntry.content || "No content available" : truncateContent(safeEntry.content)}
          </p>

          {shouldShowReadMore && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-primary"
            >
              {isExpanded ? "Show less" : "Read more"}
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your journal entry "{safeEntry.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(safeEntry.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
