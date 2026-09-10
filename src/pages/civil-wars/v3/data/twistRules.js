// Plain-language rules for each twist, shown in full inside the reveal
// modal and reopenable any time from the header's "Year N rules" button.
// Sourced from src/pages/civil-wars/rules.md Parts G/H/I -- keep the two
// in sync if the ruleset changes.

export const TWIST_RULES = {
  flood: {
    title: "Flood",
    year: 1,
    tagline:
      "The river bursts its banks. Every tile in a flood zone is hit — and those zones are marked on the board from the first minute.",
    stakes: [
      {
        label: "Score",
        value:
          "No direct score line. But every service knocked offline stops earning (+10 / demand unit), and unserved demand is penalised (−5 / unit, −10 on a slum) until you repair.",
      },
      {
        label: "Cash",
        value:
          "Repair bills: slum ₹40 Cr (Zone A) / ₹20 Cr (Zone B); most buildings 40% / 20% of their cost; residential 50% / 25%. Zone A parks, storm drains and farms are destroyed outright — cost lost.",
      },
    ],
    sections: [
      {
        heading: "Flood zones",
        points: [
          "Zone A — within one row of the river, both banks. Severe.",
          "Zone B — two rows from the river, one side only. Moderate.",
          "Population is never destroyed: a flooded home keeps its people, it just delivers no services until repaired.",
        ],
      },
      {
        heading: "Dam protection",
        points: [
          "A dam sits on a river tile and protects a strip 6 columns wide — its own column plus the 5 downstream (toward higher column numbers).",
          "Inside that strip, every tile at every row is completely immune. Protection is decided by column only, never by distance from the dam.",
          "One column past the strip — even directly upstream of the dam — there is no protection at all.",
          "Build more than one dam to cover more of the river. Overlapping strips add nothing.",
        ],
      },
      {
        heading: "Hydro stations",
        points: [
          "A hydro station is protected only if it is on its dam's column or downstream of it. Built upstream of the dam it is not protected, even though it is touching it.",
          "An unprotected hydro that floods takes everything it powers offline with it, until it is repaired.",
          "Storm drainage does NOT reduce a hydro station's repair cost — put hydro downstream of its dam.",
        ],
      },
      {
        heading: "Storm drainage",
        points: [
          "₹15 Cr, radius 2 — covers the 5×5 block centred on it.",
          "Halves the flood repair cost for any building in that block, in both zones.",
          "It gives no immunity, and it cannot save a Zone A park / drain / farm — those are destroyed no matter what.",
        ],
      },
      {
        heading: "Not affected",
        points: ["Transport buildings — bus stand, railway, metro, airport — keep running through the flood, protected or not."],
      },
    ],
  },

  pandemic: {
    title: "Waterborne outbreak",
    year: 2,
    tagline: "A waterborne outbreak. Two checks decide how badly it hits you — containment first, then treatment.",
    stakes: [
      {
        label: "Score",
        value:
          "No infections +50 · infected but fully treated 0 · −50 per missing hospital if short · −150 if infected with no hospital anywhere.",
      },
      {
        label: "Cash",
        value: "No infections +₹50 Cr · income halved if short on hospitals · income zero if no hospital anywhere.",
      },
    ],
    sections: [
      {
        heading: "Containment",
        points: [
          "A home is infected if no sewage plant reaches it.",
          "A home fed only by water tank(s) is also infected — unless one of those tanks is itself within a sewage plant's range.",
          "A water treatment plant carries no such exposure. That is its reason to exist over three tanks.",
        ],
      },
      {
        heading: "Treatment",
        points: [
          "Infected population needs 1 hospital per 2,500 people.",
          "Slum population counts double toward that requirement.",
          "The two immigration slums arrive in Year 3, after this — they do not count here.",
        ],
      },
      {
        heading: "After the reveal",
        points: ["Nothing can be done except emergency-building hospitals at full price."],
      },
    ],
  },

  immigration: {
    title: "Immigration",
    year: 3,
    tagline: "Two new slum tiles appear on empty land near your existing settlements — 2,500 people each.",
    stakes: [
      {
        label: "Score",
        value:
          "Up to −540 in unserved-demand penalties across the two, plus −50 each with no sanitation in range, and +270 each you forgo by not serving them.",
      },
      { label: "Cash", value: "The cost of the services needed to reach the new slums." },
    ],
    sections: [
      {
        heading: "How it lands",
        points: [
          "Two new slum tiles, 2,500 people and 3 demand units each — the same profile as a rehoused slum.",
          "They spawn on the empty tiles closest to your current settlements. You do not choose where.",
          "They arrive completely unserved.",
        ],
      },
      {
        heading: "Why it is Year 3",
        points: [
          "It comes after the outbreak, so these slums never counted toward the Year 2 hospital requirement — but they count toward everything scored at the end.",
        ],
      },
      {
        heading: "Plan ahead",
        points: ["Leave empty land and spare cash near your city so you can reach the new slums without scrambling."],
      },
    ],
  },

  olympics: {
    title: "Olympics",
    year: 4,
    tagline: "The city bids to host the Olympics. The requirements were announced back in Year 0.",
    stakes: [
      { label: "Score", value: "+150 qualified · −50 not qualified." },
      { label: "Cash", value: "+₹500 Cr qualified · nothing if not." },
    ],
    sections: [
      {
        heading: "Requirements — all standing when the year turns",
        points: ["1 stadium", "5 hotels", "3 restaurants"],
      },
      {
        heading: "Worth knowing",
        points: [
          "All of these generate income anyway, so building toward them is not wasted — but 5 hotels and a stadium is ₹300 Cr you did not spend on services.",
          "Decide early: the requirement is announced in Year 0.",
        ],
      },
    ],
  },

  treasure: {
    title: "Treasure",
    year: 5,
    tagline: "One tile on the map holds treasure worth ₹300 Cr. Which tile is not revealed until the end of Year 5.",
    stakes: [
      {
        label: "Score",
        value: "No direct score — it only reaches the leaderboard through your cash score (final cash × 0.05).",
      },
      {
        label: "Cash",
        value:
          "Empty tile → +₹250 Cr net (₹300 Cr − ₹50 Cr mining). Built on it → ₹300 Cr minus mining minus demolition, or move the building first. Forfeit → ₹0.",
      },
    ],
    sections: [
      {
        heading: "Claiming is a choice",
        points: [
          "When the tile is revealed it glows gold. You have the rest of Year 5 to decide — click it to claim.",
          "Claiming is never automatic.",
        ],
      },
      {
        heading: "If the tile is empty",
        points: ["Pay ₹50 Cr mining, receive ₹300 Cr — net +₹250 Cr."],
      },
      {
        heading: "If you built there",
        points: [
          "Demolish and claim: pay 50% of the building's cost + ₹50 Cr mining. The building and its services are gone.",
          "Or move the building first with the normal move action (10% of its cost), then claim the empty tile for ₹50 Cr — building kept.",
          "Or do nothing and forfeit the treasure.",
        ],
      },
      {
        heading: "You cannot claim if",
        points: ["You do not have the cash for the mining (plus demolition) charge."],
      },
    ],
  },
};

// The Year 0 mandatory floor is not a twist, but it is reported in the
// same Year 1 reveal modal, so it gets a rules entry too.
export const MANDATORY_FLOOR_RULES = {
  title: "Mandatory floor",
  tagline: "Checked once, when Year 0 ends. It is not a twist, and it never blocks you from building.",
  stakes: [
    { label: "Score", value: "−100 if any item is missing." },
    { label: "Cash", value: "Year 1 income halved if any item is missing." },
  ],
  sections: [
    {
      heading: "The four items — roughly ₹300 Cr of your ₹3,000 Cr",
      points: ["1 dam + 1 hydro station", "Water covering all inherited demand", "1 sewage plant", "1 hospital"],
    },
    {
      heading: "If you miss one",
      points: ["You keep playing — you just start Year 1 behind: −100 score and half income that year."],
    },
  ],
};
