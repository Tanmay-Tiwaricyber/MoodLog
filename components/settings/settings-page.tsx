"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserSettings } from "@/lib/types"
import { getDbService } from "@/lib/database"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { Moon, Sun, Monitor, Bell, Shield, Save } from "lucide-react"

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    notifications: true,
    privacy: "private",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadSettings = async () => {
      const dbService = getDbService(user.uid)
      const savedSettings = await dbService.getUserSettings()
      setSettings(savedSettings)
    }

    loadSettings()
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) return

    setLoading(true)
    try {
      const dbService = getDbService(user.uid)
      const success = await dbService.saveUserSettings(settings)

      if (success) {
        setTheme(settings.theme)
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your MoodLog experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how MoodLog looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: "light" | "dark" | "system") => setSettings((prev) => ({ ...prev, theme: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Daily Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded to write in your journal</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>Control who can see your journal entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="privacy">Journal Visibility</Label>
            <Select
              value={settings.privacy}
              onValueChange={(value: "private" | "public") => setSettings((prev) => ({ ...prev, privacy: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privacy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Only you)</SelectItem>
                <SelectItem value="public">Public (Anyone can view)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
