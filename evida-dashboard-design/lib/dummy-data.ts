// Dummy data generator for personas

export interface PersonaData {
  id: string
  name: string
  steps: number[]
  heartRate: {
    resting: number
    average: number
  }
  sleep: {
    duration: number
    efficiency: number
    stages: {
      deep: number
      light: number
      rem: number
      awake: number
    }
  }
  stress: {
    index: number
    hrv: number
  }
}

export const personas: Record<string, PersonaData> = {
  athlete: {
    id: "athlete",
    name: "Active Athlete",
    steps: [12000, 13500, 11800, 14200, 13100, 15000, 13800],
    heartRate: {
      resting: 52,
      average: 65,
    },
    sleep: {
      duration: 8.2,
      efficiency: 92,
      stages: {
        deep: 28,
        light: 42,
        rem: 22,
        awake: 8,
      },
    },
    stress: {
      index: 35,
      hrv: 68,
    },
  },
  busy: {
    id: "busy",
    name: "Busy Professional",
    steps: [6200, 7100, 5500, 8200, 6900, 7500, 6800],
    heartRate: {
      resting: 68,
      average: 75,
    },
    sleep: {
      duration: 6.5,
      efficiency: 78,
      stages: {
        deep: 18,
        light: 52,
        rem: 18,
        awake: 12,
      },
    },
    stress: {
      index: 58,
      hrv: 42,
    },
  },
  wellness: {
    id: "wellness",
    name: "Wellness Enthusiast",
    steps: [9800, 10100, 9500, 10800, 9900, 10500, 10200],
    heartRate: {
      resting: 58,
      average: 68,
    },
    sleep: {
      duration: 7.8,
      efficiency: 89,
      stages: {
        deep: 25,
        light: 45,
        rem: 20,
        awake: 10,
      },
    },
    stress: {
      index: 38,
      hrv: 62,
    },
  },
}

export function getPersonaData(personaId: string): PersonaData {
  return personas[personaId] || personas.wellness
}
