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

  // Matches
  matches: {
    all: ["matches"] as const,
    list: (filters?: object) => ["matches", "list", filters] as const,
    byEvent: (eventId: string) => ["matches", "event", eventId] as const,
    detail: (id: string) => ["matches", "detail", id] as const,
  },

  // Standings
  standings: {
    byEvent: (eventId: string) => ["standings", "event", eventId] as const,
  },

  // Courts
  courts: {
    byEvent: (eventId: string) => ["courts", "event", eventId] as const,
  },

  // Teams
  teams: {
    byEvent: (eventId: string) => ["teams", "event", eventId] as const,
  },

  // Groups
  groups: {
    byEvent: (eventId: string) => ["groups", "event", eventId] as const,
  },

  // Members
  members: {
    byEvent: (eventId: string) => ["members", "event", eventId] as const,
  },

  // Schedule generation
  schedule: {
    generation: (eventId: string) => ["schedule", "generation", eventId] as const,
  },

  // Dashboard
  dashboard: ["dashboard"] as const,
};
