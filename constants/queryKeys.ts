export const queryKeys = {
  // Auth
  profile: ["profile"] as const,
  organization: ["organization"] as const,

  // Events
  events: {
    all: ["events"] as const,
    list: (filters?: object) => ["events", "list", filters] as const,
    detail: (id: string) => ["events", "detail", id] as const,
  },

  // Sessions
  sessions: {
    all: ["sessions"] as const,
    list: (filters?: object) => ["sessions", "list", filters] as const,
    byEvent: (eventId: string) => ["sessions", "event", eventId] as const,
    detail: (id: string) => ["sessions", "detail", id] as const,
  },

  // Teams
  teams: {
    byEvent: (eventId: string) => ["teams", "event", eventId] as const,
  },

  // Player counts
  playerCounts: {
    bySession: (sessionId: string) => ["playerCounts", sessionId] as const,
    summary: ["playerCounts", "summary"] as const,
  },

  // Dashboard
  dashboard: ["dashboard"] as const,
};
