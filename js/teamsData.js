// Updated MLB roster data (May 2025)
// Yankees & Dodgers strongest line‑ups (injuries ignored)

export const ALL_TEAMS = [
  // ───────────────────────────────
  // NEW YORK YANKEES
  // ───────────────────────────────
  {
    id: "NYY",
    name: "Yankees",
    // Batters are ordered by suggested batting order
    batters: [
      { name: "Trent Grisham",     pos: "CF", type: "batter", stats: { power: 7,  hitRate: 6, contact: 5, speed: 8 } }, // 1
      { name: "Paul Goldschmidt",  pos: "1B", type: "batter", stats: { power: 8,  hitRate: 9, contact: 8, speed: 5 } }, // 2
      { name: "Aaron Judge",       pos: "RF", type: "batter", stats: { power: 10, hitRate: 9, contact: 7, speed: 6 } }, // 3
      { name: "Ben Rice",          pos: "DH", type: "batter", stats: { power: 8,  hitRate: 8, contact: 6, speed: 6 } }, // 4
      { name: "Cody Bellinger",    pos: "LF", type: "batter", stats: { power: 7,  hitRate: 6, contact: 6, speed: 7 } }, // 5
      { name: "Austin Wells",      pos: "C",  type: "batter", stats: { power: 7,  hitRate: 5, contact: 6, speed: 5 } }, // 6
      { name: "Anthony Volpe",     pos: "SS", type: "batter", stats: { power: 5,  hitRate: 7, contact: 7, speed: 9 } }, // 7
      { name: "Jazz Chisholm",     pos: "2B", type: "batter", stats: { power: 7,  hitRate: 5, contact: 5, speed: 8 } }, // 8
      { name: "Oswaldo Cabrera",   pos: "3B", type: "batter", stats: { power: 4,  hitRate: 6, contact: 6, speed: 6 } }, // 9
      // Bench / depth
      { name: "Jasson Domínguez",  pos: "OF", type: "batter", stats: { power: 7,  hitRate: 6, contact: 5, speed: 8 } },
      { name: "Oswald Peraza",     pos: "IF", type: "batter", stats: { power: 4,  hitRate: 6, contact: 6, speed: 6 } }
    ],
    pitchers: {
      // 5‑man rotation (adjusted: Rodón 返回先發、Cortez/Severino 移除)
      startersRotation: [
        { name: "Gerrit Cole",     type: "pitcher", stats: { role: "Starter", power: 10, velocity: 9,  control: 7, technique: 8, maxStamina: 100 } },
        { name: "Max Fried",       type: "pitcher", stats: { role: "Starter", power: 9,  velocity: 8,  control: 8, technique: 7, maxStamina: 95 } },
        { name: "Carlos Rodón",    type: "pitcher", stats: { role: "Starter", power: 8,  velocity: 8,  control: 7, technique: 6, maxStamina: 90 } },
        { name: "Clarke Schmidt",  type: "pitcher", stats: { role: "Starter", power: 7,  velocity: 8,  control: 7, technique: 6, maxStamina: 85 } },
        { name: "Luke Weaver",     type: "pitcher", stats: { role: "Starter", power: 6,  velocity: 7,  control: 6, technique: 5, maxStamina: 80 } }
      ],
      // Primary late‑inning roles
      reliever: { name: "Jonathan Loáisiga", type: "pitcher", stats: { role: "Reliever", power: 7, velocity: 8, control: 7, technique: 6, maxStamina: 70 } },
      closer:   { name: "Devin Williams",    type: "pitcher", stats: { role: "Closer",   power: 8, velocity: 8, control: 5, technique: 7, maxStamina: 50 } }
    }
  },

  // ───────────────────────────────
  // LOS ANGELES DODGERS
  // ───────────────────────────────
  {
    id: "LAD",
    name: "Dodgers",
    batters: [
      { name: "Mookie Betts",      pos: "SS", type: "batter", stats: { power: 8, hitRate: 8, contact: 8, speed: 9 } }, // 1
      { name: "Shohei Ohtani",     pos: "DH", type: "batter", stats: { power: 9, hitRate: 9, contact: 8, speed: 8 } }, // 2
      { name: "Freddie Freeman",   pos: "1B", type: "batter", stats: { power: 7, hitRate: 9, contact: 9, speed: 6 } }, // 3
      { name: "Teoscar Hernández", pos: "RF", type: "batter", stats: { power: 6, hitRate: 8, contact: 7, speed: 7 } }, // 4
      { name: "Will Smith",        pos: "C",  type: "batter", stats: { power: 6, hitRate: 7, contact: 8, speed: 5 } }, // 5
      { name: "Andy Pages",        pos: "CF", type: "batter", stats: { power: 7, hitRate: 6, contact: 6, speed: 7 } }, // 6
      { name: "Tommy Edman",       pos: "2B", type: "batter", stats: { power: 6, hitRate: 6, contact: 6, speed: 8 } }, // 7
      { name: "Max Muncy",         pos: "3B", type: "batter", stats: { power: 7, hitRate: 7, contact: 5, speed: 5 } }, // 8
      { name: "James Outman",      pos: "LF", type: "batter", stats: { power: 7, hitRate: 5, contact: 5, speed: 8 } }, // 9
      // Bench
      { name: "Michael Conforto",  pos: "OF", type: "batter", stats: { power: 6, hitRate: 5, contact: 5, speed: 5 } },
      { name: "Miguel Rojas",      pos: "IF", type: "batter", stats: { power: 4, hitRate: 6, contact: 7, speed: 6 } },
      { name: "Enrique Hernández", pos: "UT", type: "batter", stats: { power: 6, hitRate: 4, contact: 4, speed: 5 } },
      { name: "Chris Taylor",      pos: "UT", type: "batter", stats: { power: 5, hitRate: 4, contact: 4, speed: 6 } }
    ],
    pitchers: {
      startersRotation: [
        { name: "Yoshinobu Yamamoto", type: "pitcher", stats: { role: "Starter", power: 8, velocity: 9,  control: 9, technique: 8, maxStamina: 95 } },
        { name: "Tyler Glasnow",      type: "pitcher", stats: { role: "Starter", power: 9, velocity: 10, control: 5, technique: 7, maxStamina: 92 } },
        { name: "Walker Buehler",     type: "pitcher", stats: { role: "Starter", power: 8, velocity: 8,  control: 8, technique: 8, maxStamina: 96 } },
        { name: "Roki Sasaki",        type: "pitcher", stats: { role: "Starter", power: 8, velocity: 8,  control: 6, technique: 7, maxStamina: 85 } },
        { name: "Bobby Miller",       type: "pitcher", stats: { role: "Starter", power: 7, velocity: 9,  control: 7, technique: 6, maxStamina: 90 } }
      ],
      reliever: { name: "Blake Treinen", type: "pitcher", stats: { role: "Reliever", power: 7, velocity: 8, control: 7, technique: 6, maxStamina: 70 } },
      closer:   { name: "Evan Phillips",  type: "pitcher", stats: { role: "Closer",   power: 9, velocity: 9, control: 8, technique: 7, maxStamina: 50 } }
    }
  }
];

/**
 * Get basic team data by its unique ID.
 * @param {string} teamId – unique team ID.
 * @returns {object|null} The team object or null if not found.
 */
export function getTeamById(teamId) {
  return ALL_TEAMS.find(team => team.id === teamId) || null;
}
