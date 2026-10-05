import { useEffect, useState } from 'react'
import { createPeriod, createStore } from '../data/workspace'
import type {
  Client,
  PlanningWorkspace,
  WorkspaceStore,
} from '../types/workspace'
import { validateStore } from '../utils/storage'
const storageKey = 'tapreco-workspace-v1'
function loadStore() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const value: unknown = JSON.parse(raw)
      if (validateStore(value)) return value
    }
  } catch {
    /* Fall back to a usable workspace. */
  }
  return createStore()
}
export function useWorkspace() {
  const [store, setStore] = useState<WorkspaceStore>(loadStore)
  const [storageError, setStorageError] = useState('')
  useEffect(() => {
    let error = ''
    let active = true
    try {
      localStorage.setItem(storageKey, JSON.stringify(store))
    } catch {
      error =
        'Changes could not be saved to this browser. Download a workspace backup from Settings before leaving.'
    }
    // Report the result of the external storage operation after synchronization.
    queueMicrotask(() => {
      if (active) setStorageError(error)
    })
    return () => {
      active = false
    }
  }, [store])
  const client =
    store.clients.find((item) => item.id === store.activeClientId) ??
    store.clients[0]
  const period = client.periods[store.taxYear]
  function updatePeriod(
    patch:
      | Partial<PlanningWorkspace>
      | ((current: PlanningWorkspace) => Partial<PlanningWorkspace>),
  ) {
    setStore((current) => ({
      ...current,
      clients: current.clients.map((item) =>
        item.id !== client.id
          ? item
          : {
              ...item,
              periods: {
                ...item.periods,
                [store.taxYear]: {
                  ...item.periods[store.taxYear],
                  ...(typeof patch === 'function'
                    ? patch(item.periods[store.taxYear])
                    : patch),
                },
              },
            },
      ),
    }))
  }
  function selectClient(id: string) {
    setStore((current) => ({
      ...current,
      activeClientId: id,
      clients: current.clients.map((item) =>
        item.id === id && !item.periods[current.taxYear]
          ? {
              ...item,
              periods: {
                ...item.periods,
                [current.taxYear]: createPeriod(false, item.ownerName),
              },
            }
          : item,
      ),
    }))
  }
  function selectYear(year: string) {
    setStore((current) => ({
      ...current,
      taxYear: year,
      clients: current.clients.map((item) =>
        item.id !== current.activeClientId || item.periods[year]
          ? item
          : {
              ...item,
              periods: {
                ...item.periods,
                [year]: createPeriod(false, item.ownerName),
              },
            },
      ),
    }))
  }
  function addClient(businessName: string, ownerName: string) {
    const id = crypto.randomUUID()
    const newClient: Client = {
      id,
      businessName,
      ownerName,
      periods: { [store.taxYear]: createPeriod(false, ownerName) },
    }
    setStore((current) => ({
      ...current,
      clients: [...current.clients, newClient],
      activeClientId: id,
    }))
  }
  return {
    store,
    setStore,
    client,
    period,
    updatePeriod,
    selectClient,
    selectYear,
    addClient,
    storageError,
  }
}
