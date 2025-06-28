import { database } from "./firebase"
import { ref, push, set, get, remove, query, orderByChild, equalTo, onValue, off } from "firebase/database"
import type { JournalEntry, UserSettings } from "./types"

export class DatabaseService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const entriesRef = ref(database, `users/${this.userId}/entries`)
      const snapshot = await get(entriesRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const entries = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          createdAt: new Date(data[key].createdAt),
        }))

        // Filter out any invalid entries
        return entries.filter(
          (entry) =>
            entry.id && entry.title && entry.content && entry.mood && entry.date && entry.userId === this.userId,
        )
      }
      return []
    } catch (error) {
      console.error("Error fetching journal entries:", error)
      return []
    }
  }

  async addJournalEntry(entry: Omit<JournalEntry, "id">): Promise<string | null> {
    try {
      const entriesRef = ref(database, `users/${this.userId}/entries`)
      const newEntryRef = push(entriesRef)

      await set(newEntryRef, {
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        userId: this.userId,
      })

      return newEntryRef.key
    } catch (error) {
      console.error("Error adding journal entry:", error)
      return null
    }
  }

  async updateJournalEntry(entry: JournalEntry): Promise<boolean> {
    try {
      const entryRef = ref(database, `users/${this.userId}/entries/${entry.id}`)
      await set(entryRef, {
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        userId: this.userId,
      })
      return true
    } catch (error) {
      console.error("Error updating journal entry:", error)
      return false
    }
  }

  async deleteJournalEntry(entryId: string): Promise<boolean> {
    try {
      const entryRef = ref(database, `users/${this.userId}/entries/${entryId}`)
      await remove(entryRef)
      return true
    } catch (error) {
      console.error("Error deleting journal entry:", error)
      return false
    }
  }

  async getEntriesByDate(date: string): Promise<JournalEntry[]> {
    try {
      const entriesRef = ref(database, `users/${this.userId}/entries`)
      const dateQuery = query(entriesRef, orderByChild("date"), equalTo(date))
      const snapshot = await get(dateQuery)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const entries = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          createdAt: new Date(data[key].createdAt),
        }))

        // Filter out any invalid entries
        return entries.filter(
          (entry) =>
            entry.id && entry.title && entry.content && entry.mood && entry.date && entry.userId === this.userId,
        )
      }
      return []
    } catch (error) {
      console.error("Error fetching entries by date:", error)
      return []
    }
  }

  // Real-time listeners
  onEntriesChange(callback: (entries: JournalEntry[]) => void): () => void {
    const entriesRef = ref(database, `users/${this.userId}/entries`)

    const unsubscribe = onValue(entriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const entries = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          createdAt: new Date(data[key].createdAt),
        }))

        // Filter out any invalid entries
        const validEntries = entries.filter(
          (entry) =>
            entry.id && entry.title && entry.content && entry.mood && entry.date && entry.userId === this.userId,
        )

        callback(validEntries)
      } else {
        callback([])
      }
    })

    return () => off(entriesRef, "value", unsubscribe)
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const settingsRef = ref(database, `users/${this.userId}/settings`)
      const snapshot = await get(settingsRef)

      if (snapshot.exists()) {
        return snapshot.val()
      }

      // Return default settings
      const defaultSettings: UserSettings = {
        theme: "system",
        notifications: true,
        privacy: "private",
      }

      // Save default settings
      await this.saveUserSettings(defaultSettings)
      return defaultSettings
    } catch (error) {
      console.error("Error fetching user settings:", error)
      return { theme: "system", notifications: true, privacy: "private" }
    }
  }

  async saveUserSettings(settings: UserSettings): Promise<boolean> {
    try {
      const settingsRef = ref(database, `users/${this.userId}/settings`)
      await set(settingsRef, settings)
      return true
    } catch (error) {
      console.error("Error saving user settings:", error)
      return false
    }
  }

  // User Profile
  async updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<boolean> {
    try {
      const profileRef = ref(database, `users/${this.userId}/profile`)
      await set(profileRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      })
      return true
    } catch (error) {
      console.error("Error updating user profile:", error)
      return false
    }
  }

  async getUserProfile(): Promise<{ displayName?: string; photoURL?: string } | null> {
    try {
      const profileRef = ref(database, `users/${this.userId}/profile`)
      const snapshot = await get(profileRef)

      if (snapshot.exists()) {
        return snapshot.val()
      }
      return null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }
}

// Singleton pattern for database service
let dbService: DatabaseService | null = null

export const getDbService = (userId: string): DatabaseService => {
  if (!dbService || dbService["userId"] !== userId) {
    dbService = new DatabaseService(userId)
  }
  return dbService
}
