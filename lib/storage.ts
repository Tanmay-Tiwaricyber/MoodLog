import type { JournalEntry, UserSettings } from "./types"

const STORAGE_KEYS = {
  JOURNAL_ENTRIES: "moodlog_journal_entries",
  USER_SETTINGS: "moodlog_user_settings",
  THEME: "moodlog_theme",
}

export const storage = {
  // Journal Entries
  getJournalEntries: (): JournalEntry[] => {
    if (typeof window === "undefined") return []
    const entries = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES)
    return entries ? JSON.parse(entries) : []
  },

  saveJournalEntries: (entries: JournalEntry[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries))
  },

  addJournalEntry: (entry: JournalEntry) => {
    const entries = storage.getJournalEntries()
    entries.push(entry)
    storage.saveJournalEntries(entries)
  },

  updateJournalEntry: (updatedEntry: JournalEntry) => {
    const entries = storage.getJournalEntries()
    const index = entries.findIndex((entry) => entry.id === updatedEntry.id)
    if (index !== -1) {
      entries[index] = updatedEntry
      storage.saveJournalEntries(entries)
    }
  },

  deleteJournalEntry: (entryId: string) => {
    const entries = storage.getJournalEntries()
    const filteredEntries = entries.filter((entry) => entry.id !== entryId)
    storage.saveJournalEntries(filteredEntries)
  },

  getEntriesByDate: (date: string): JournalEntry[] => {
    const entries = storage.getJournalEntries()
    return entries.filter((entry) => entry.date === date)
  },

  // User Settings
  getUserSettings: (): UserSettings => {
    if (typeof window === "undefined") return { theme: "system", notifications: true, privacy: "private" }
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
    return settings ? JSON.parse(settings) : { theme: "system", notifications: true, privacy: "private" }
  },

  saveUserSettings: (settings: UserSettings) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
  },

  // Theme
  getTheme: (): string => {
    if (typeof window === "undefined") return "system"
    return localStorage.getItem(STORAGE_KEYS.THEME) || "system"
  },

  saveTheme: (theme: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  },
}
