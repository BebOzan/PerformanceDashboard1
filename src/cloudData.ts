import type { DashboardData } from "./data"
import { projectId, publicAnonKey } from "../utils/supabase/info"

export type CloudDataset = {
  data: DashboardData
  updatedAt: number
}

const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-4b71dd1f/dashboard-data`
const headers = {
  Authorization: `Bearer ${publicAnonKey}`,
  "Content-Type": "application/json",
}

export async function loadCloudData(): Promise<CloudDataset | null> {
  const response = await fetch(endpoint, { headers })
  if (!response.ok) throw new Error(`Cloud load failed: ${response.status}`)
  return (await response.json()) as CloudDataset | null
}

export async function saveCloudData(
  data: DashboardData,
  updatedAt: number,
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data, updatedAt }),
  })
  if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`)
}
