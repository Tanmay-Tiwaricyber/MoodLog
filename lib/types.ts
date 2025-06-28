export interface JournalEntry {
  id: string
  title: string
  content: string
  mood: "happy" | "sad" | "angry" | "excited" | "calm" | "anxious"
  date: string
  time: string
  createdAt: Date
  userId: string
}

export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  notifications: boolean
  privacy: "private" | "public"
}
