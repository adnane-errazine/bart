function synthSeries(start: number, end: number, points: number, vol: number) {
  const arr = [start];
  const r = (end / start) ** (1 / (points - 1)) - 1;
  for (let i = 1; i < points; i++) {
    const shock = (Math.sin(i * 0.7) + Math.cos(i * 1.3) + Math.sin(i * 0.31)) * vol * 0.01;
    arr.push(arr[i - 1] * (1 + r + shock));
  }
  arr[points - 1] = end;
  return arr.map((v) => +v.toFixed(2));
}

export const INDICES = [
  { id: "blue_chip", name: "BART BLUE CHIP", short: "BBC", value: 358.42, change1d: -0.34, change7d: 1.21, change30d: 2.84, changeYtd: 8.42, change1y: 11.27, change5y: 47.81, vol: 14.2, volume: "$5.4B", confidence: 88, scope: "100 deceased majors post-1850", method: "Repeat-Sales", desc: "Artistes décédés majeurs, établis depuis plus de 30 ans. Référence trophy assets. Volatilité contenue, corrélation modérée à l'inflation.",
    topConstituents: [
      { artist: "Pablo Picasso", weight: 8.4, ytd: 6.2 }, { artist: "Andy Warhol", weight: 7.8, ytd: 9.1 },
      { artist: "Jean-Michel Basquiat", weight: 6.2, ytd: 14.3 }, { artist: "Francis Bacon", weight: 5.4, ytd: 4.7 },
      { artist: "Cy Twombly", weight: 4.8, ytd: 8.1 }, { artist: "Roy Lichtenstein", weight: 4.1, ytd: 6.8 },
      { artist: "Mark Rothko", weight: 3.9, ytd: 11.4 }, { artist: "Alexander Calder", weight: 3.2, ytd: 7.2 },
      { artist: "Claude Monet", weight: 3.1, ytd: 5.4 }, { artist: "Gustav Klimt", weight: 2.8, ytd: 13.2 },
    ]
  },
  { id: "modern", name: "BART MODERN MASTERS", short: "BMM", value: 432.18, change1d: 0.18, change7d: 0.84, change30d: 3.41, changeYtd: 11.6, change1y: 14.8, change5y: 62.4, vol: 18.1, volume: "$3.1B", confidence: 81, scope: "120 moderns post-1945", method: "Hedonic+Repeat", desc: "Artistes modernes établis post-1945. Effet career stage très marqué — Hockney, Richter, Kusama portés par les rétrospectives muséales.",
    topConstituents: [
      { artist: "Gerhard Richter", weight: 9.1, ytd: 13.4 }, { artist: "David Hockney", weight: 8.4, ytd: 17.2 },
      { artist: "Yayoi Kusama", weight: 7.8, ytd: 22.1 }, { artist: "Ed Ruscha", weight: 5.4, ytd: 11.8 },
      { artist: "Cecily Brown", weight: 4.7, ytd: 8.4 }, { artist: "Anselm Kiefer", weight: 4.1, ytd: 6.2 },
      { artist: "Bridget Riley", weight: 3.8, ytd: 9.7 }, { artist: "Alex Katz", weight: 3.4, ytd: 14.3 },
    ]
  },
  { id: "ultra", name: "BART ULTRA-CONTEMPORARY", short: "BUC", value: 681.45, change1d: 1.42, change7d: 4.12, change30d: 8.84, changeYtd: 24.7, change1y: 36.1, change5y: 247.3, vol: 31.4, volume: "$1.2B", confidence: 64, scope: "180 living, born > 1975", method: "Hedonic", desc: "Artistes vivants nés après 1975, secondaire actif depuis 2010. Le segment qui a le mieux performé sur 5 ans (+247%). Aussi le plus risqué.",
    topConstituents: [
      { artist: "Lucy Bull", weight: 6.4, ytd: 38.1 }, { artist: "Christina Quarles", weight: 5.8, ytd: 21.4 },
      { artist: "Avery Singer", weight: 5.2, ytd: 18.7 }, { artist: "Jadé Fadojutimi", weight: 4.9, ytd: 27.3 },
      { artist: "Salman Toor", weight: 4.4, ytd: 24.8 }, { artist: "Anna Weyant", weight: 4.1, ytd: -8.4 },
      { artist: "Amoako Boafo", weight: 3.8, ytd: 12.1 }, { artist: "Robert Nava", weight: 3.4, ytd: 31.2 },
      { artist: "Loie Hollowell", weight: 3.1, ytd: 14.7 }, { artist: "Issy Wood", weight: 2.8, ytd: -12.4 },
    ]
  },
  { id: "photo", name: "BART PHOTOGRAPHY", short: "BPH", value: 298.71, change1d: -0.12, change7d: 0.42, change30d: 1.02, changeYtd: 4.81, change1y: 6.42, change5y: 31.8, vol: 16.3, volume: "$0.4B", confidence: 73, scope: "85 photographers 1900–now", method: "Hedonic", desc: "Photographie de collection. Faible corrélation aux autres indices (~0.3 vs Blue Chip). Excellent diversificateur. Düsseldorf School poids dominant.",
    topConstituents: [
      { artist: "Andreas Gursky", weight: 11.2, ytd: 5.4 }, { artist: "Cindy Sherman", weight: 9.4, ytd: 4.1 },
      { artist: "Wolfgang Tillmans", weight: 7.8, ytd: 7.2 }, { artist: "Hiroshi Sugimoto", weight: 6.4, ytd: 3.8 },
      { artist: "Thomas Struth", weight: 5.2, ytd: 6.1 }, { artist: "Candida Höfer", weight: 4.1, ytd: 4.8 },
    ]
  },
  { id: "street", name: "BART STREET & URBAN", short: "BSU", value: 478.12, change1d: 2.18, change7d: 6.41, change30d: 12.72, changeYtd: 31.4, change1y: 42.8, change5y: 184.6, vol: 32.8, volume: "$0.3B", confidence: 58, scope: "60 street artists", method: "Repeat-Sales", desc: "Art urbain accepté en circuit institutionnel. Porté par les jeunes UHNWIs et le segment millennials/tech entrepreneurs. Volatilité élevée.",
    topConstituents: [
      { artist: "Banksy", weight: 28.4, ytd: 24.1 }, { artist: "KAWS", weight: 18.2, ytd: 31.4 },
      { artist: "Invader", weight: 8.4, ytd: 41.2 }, { artist: "Shepard Fairey", weight: 5.4, ytd: 18.7 },
      { artist: "JR", weight: 4.8, ytd: 22.1 }, { artist: "Daniel Arsham", weight: 4.1, ytd: 14.8 },
    ]
  },
].map((i) => {
  const startVal = i.value / (1 + i.change5y / 100);
  return { ...i, history5y: synthSeries(startVal, i.value, 60, i.vol / 4), spark30d: synthSeries(i.value * 0.97, i.value, 30, i.vol / 6) };
});

export const ARTWORKS = [
  {
    id: "bull-quaver-2022", artist: "Lucy Bull", artistId: "lucy-bull",
    title: "Untitled (Quaver Series)", year: 2022, medium: "Oil on linen", dimensions: "180 × 150 cm", edition: "Unique",
    segment: "Ultra-Contemporary",
    tags: ["Painting", "Female Artist", "USA-based", "Lyrical Abstraction", "Pinault-collected"],
    bartScore: 84, fairValueLow: 420000, fairValueHigh: 510000, fairValueMid: 465000, fairValueRange: 9,
    confidence: 76, confidenceLabel: "High", liquidity: 34, liquidityLabel: "Low",
    timeToExit: "9–18 months", spread: "12–18%",
    lastSale: { date: "May 2024", price: 450000, venue: "Christie's New York", saleName: "21st Century Evening Sale", lot: "Lot 4823", deltaEst: 18 },
    fiveYReturn: 127, vsIndexBp: 1810,
    salesHistory: [
      { year: 2024, venue: "Christie's New York", detail: "21st Century Evening Sale, Lot 4823", price: 450000, deltaEst: 18, type: "auction" },
      { year: 2022, venue: "Pinault Collection", detail: "Private sale via Kordansky", price: 380000, type: "private" },
      { year: 2022, venue: "Frieze LA, Booth Kordansky", detail: "Acquired pre-fair", price: 220000, type: "primary" },
      { year: 2020, venue: "Phillips London", detail: "New Now, Lot 117", price: 95000, deltaEst: -12, type: "auction" },
      { year: 2018, venue: "Studio sale", detail: "First public listing", price: 18000, type: "primary" },
    ],
    provenance: [
      { year: "2018", type: "gallery", entity: "Studio Lucy Bull, Los Angeles", detail: "Origin, primary market" },
      { year: "2020", type: "collector", entity: "Anonymous European collector", detail: "Phillips London, Lot 117" },
      { year: "2022", type: "gallery", entity: "David Kordansky Gallery", detail: "Reconsigned, Frieze LA booth" },
      { year: "2022", type: "foundation", entity: "Pinault Collection", detail: "Bourse de Commerce, Paris" },
      { year: "2024", type: "private", entity: "Anonymous US institutional", detail: "Christie's NY Evening Sale buyer" },
    ],
    drivers: [
      { num: "01", title: "Pinault Collection acquisition (2022)", text: "Institutional signal observed across 14 comparable Bull works. Pinault presence triggers a documented +28% average price uplift on next-cycle disposal vs unsignaled comparables.", impact: "+28% avg uplift, n=14 obs" },
      { num: "02", title: "Whitney group show (2024)", text: "Inclusion in Painting in Place group exhibition (Mar–Aug 2024). Across the Ultra-Contemporary segment, Whitney inclusion drives +20–40% on a 6M post-event window.", impact: "+20–40%, 6M window" },
      { num: "03", title: "Press momentum", text: "6 major editorial mentions across Artforum, NYT, FT Weekend, Frieze in trailing 12M. Bull-specific momentum index up +44% YoY, outperforming Ultra-Contemporary press benchmark by 1900bp.", impact: "Press +44% YoY, 1900bp" },
    ],
    riskBlock: "Liquidity Score 34/100. Resale window <12 months is likely to require an 8–15% discount given thin Ultra-Contemporary market depth. Recommended holding period ≥36 months for institutional carry.",
    story: [
      "Cette toile appartient à la Quaver Series que Lucy Bull a entamée fin 2021, marquant la transition de son écriture picturale vers des compositions plus orchestrées. Bull, formée à l'UCLA et révélée par sa première solo show chez David Kordansky LA en 2022, travaille la peinture comme un acte vibratoire — chaque touche fait écho à la précédente.",
      "La critique Roberta Smith a décrit cette série dans le NYT comme une nervure organique qui dépasse l'abstraction lyrique de ses prédécesseurs. Présentée à Frieze LA 2022, l'œuvre a été acquise par la Pinault Collection avant son passage en revente actuelle.",
    ],
    storySources: ["Roberta Smith, NYT (Mar 2024)", "Artforum review (Jun 2022)", "Frieze LA preview (Feb 2022)", "Kordansky press release (Apr 2022)"],
    scoreBreakdown: {
      bart: { provenance: 22, authentication: 18, momentum: 17, validation: 14, quality: 13, total: 84, max: { provenance: 25, authentication: 20, momentum: 20, validation: 20, quality: 15 } },
      confidence: { depth: 22, recency: 22, verification: 18, observability: 14, total: 76, max: { depth: 30, recency: 25, verification: 25, observability: 20 } },
      liquidity: { frequency: 8, sellThrough: 14, depth: 6, exit: 6, total: 34, max: { frequency: 25, sellThrough: 25, depth: 25, exit: 25 } },
    },
  },
  { id: "singer-2023", artist: "Avery Singer", artistId: "avery-singer", title: "Free Fall", year: 2023, medium: "Acrylic on canvas", dimensions: "210 × 280 cm", segment: "Ultra-Contemporary", bartScore: 88, fairValueMid: 920000, confidence: 82, liquidity: 48, lastSale: { price: 980000, venue: "Sotheby's New York" } },
  { id: "quarles-2022", artist: "Christina Quarles", artistId: "christina-quarles", title: "Skin Toned", year: 2022, medium: "Acrylic on canvas", dimensions: "152 × 198 cm", segment: "Ultra-Contemporary", bartScore: 91, fairValueMid: 1450000, confidence: 84, liquidity: 52, lastSale: { price: 1380000, venue: "Christie's London" } },
  { id: "fadojutimi-2023", artist: "Jadé Fadojutimi", artistId: "jade-fadojutimi", title: "A Vortex of Pillows", year: 2023, medium: "Oil on canvas", dimensions: "200 × 200 cm", segment: "Ultra-Contemporary", bartScore: 84, fairValueMid: 680000, confidence: 78, liquidity: 41, lastSale: { price: 720000, venue: "Phillips London" } },
  { id: "hockney-pool", artist: "David Hockney", artistId: "david-hockney", title: "Portrait of an Artist (Pool with Two Figures)", year: 1972, medium: "Acrylic on canvas", dimensions: "214 × 305 cm", segment: "Modern Masters", bartScore: 96, fairValueMid: 92000000, confidence: 91, liquidity: 71, lastSale: { price: 90300000, venue: "Christie's NY 2018" } },
  { id: "richter-1024", artist: "Gerhard Richter", artistId: "gerhard-richter", title: "Abstraktes Bild (1024-3)", year: 1990, medium: "Oil on canvas", dimensions: "200 × 320 cm", segment: "Modern Masters", bartScore: 94, fairValueMid: 21500000, confidence: 89, liquidity: 68, lastSale: { price: 22800000, venue: "Sotheby's London" } },
  { id: "kusama-pumpkin", artist: "Yayoi Kusama", artistId: "yayoi-kusama", title: "Pumpkin (Yellow & Black)", year: 2014, medium: "Acrylic on canvas", dimensions: "162 × 162 cm", segment: "Modern Masters", bartScore: 91, fairValueMid: 4200000, confidence: 86, liquidity: 74, lastSale: { price: 4480000, venue: "Christie's HK" } },
  { id: "basquiat-1983", artist: "Jean-Michel Basquiat", artistId: "basquiat", title: "In This Case", year: 1983, medium: "Acrylic, oilstick", dimensions: "198 × 188 cm", segment: "Blue Chip", bartScore: 94, fairValueMid: 84000000, confidence: 90, liquidity: 64, lastSale: { price: 93100000, venue: "Christie's NY 2021" } },
  { id: "warhol-marilyn", artist: "Andy Warhol", artistId: "warhol", title: "Shot Sage Blue Marilyn", year: 1964, medium: "Silkscreen on canvas", dimensions: "102 × 102 cm", segment: "Blue Chip", bartScore: 97, fairValueMid: 195000000, confidence: 92, liquidity: 69, lastSale: { price: 195000000, venue: "Christie's NY 2022" } },
  { id: "gursky-rhein", artist: "Andreas Gursky", artistId: "gursky", title: "Rhein II", year: 1999, medium: "C-print, ed. of 6", dimensions: "186 × 364 cm", segment: "Photography", bartScore: 92, fairValueMid: 4100000, confidence: 87, liquidity: 58, lastSale: { price: 4338500, venue: "Christie's NY 2011" } },
  { id: "banksy-balloon", artist: "Banksy", artistId: "banksy", title: "Love is in the Bin", year: 2018, medium: "Acrylic & oil on canvas", dimensions: "101 × 78 cm", segment: "Street & Urban", bartScore: 89, fairValueMid: 22400000, confidence: 81, liquidity: 72, lastSale: { price: 22600000, venue: "Sotheby's London 2021" } },
  { id: "kaws-album", artist: "KAWS", artistId: "kaws", title: "The KAWS Album", year: 2005, medium: "Acrylic on canvas", dimensions: "101 × 101 cm", segment: "Street & Urban", bartScore: 84, fairValueMid: 13800000, confidence: 79, liquidity: 78, lastSale: { price: 14750000, venue: "Sotheby's HK 2019" } },
];

export const WATCHLIST = [
  { artworkId: "bull-quaver-2022", addedPrice: 380000, currentFV: 465000, deltaFV: 22.4, bartScore: 84 },
  { artworkId: "singer-2023", addedPrice: 880000, currentFV: 920000, deltaFV: 4.5, bartScore: 88 },
  { artworkId: "quarles-2022", addedPrice: 1380000, currentFV: 1450000, deltaFV: 5.1, bartScore: 91 },
  { artworkId: "fadojutimi-2023", addedPrice: 540000, currentFV: 680000, deltaFV: 25.9, bartScore: 84 },
  { artworkId: "kusama-pumpkin", addedPrice: 4100000, currentFV: 4200000, deltaFV: 2.4, bartScore: 91 },
  { artworkId: "gursky-rhein", addedPrice: 4338500, currentFV: 4100000, deltaFV: -5.5, bartScore: 92 },
  { artworkId: "banksy-balloon", addedPrice: 22600000, currentFV: 22400000, deltaFV: -0.9, bartScore: 89 },
  { artworkId: "kaws-album", addedPrice: 14750000, currentFV: 13800000, deltaFV: -6.4, bartScore: 84 },
];

export const PORTFOLIO = {
  totalValue: 12480000, totalCost: 9820000, pnl: 2660000, pnlPct: 27.1,
  holdings: [
    { artworkId: "bull-quaver-2022", acquired: 380000, currentFV: 465000, segment: "Ultra-Contemporary" },
    { artworkId: "fadojutimi-2023", acquired: 540000, currentFV: 680000, segment: "Ultra-Contemporary" },
    { artworkId: "singer-2023", acquired: 880000, currentFV: 920000, segment: "Ultra-Contemporary" },
    { artworkId: "kusama-pumpkin", acquired: 4100000, currentFV: 4200000, segment: "Modern Masters" },
    { artworkId: "gursky-rhein", acquired: 3800000, currentFV: 4100000, segment: "Photography" },
    { artworkId: "kaws-album", acquired: 120000, currentFV: 1380000, segment: "Street & Urban" },
  ],
  allocation: [
    { segment: "Ultra-Contemporary", value: 2065000, pct: 16.5, color: "#D4A017" },
    { segment: "Modern Masters", value: 4200000, pct: 33.7, color: "#6B8FB8" },
    { segment: "Photography", value: 4100000, pct: 32.9, color: "#8C7AAE" },
    { segment: "Street & Urban", value: 1380000, pct: 11.0, color: "#B8722F" },
    { segment: "Cash / Reserve", value: 735000, pct: 5.9, color: "#4F9D69" },
  ],
};

export const SIGNALS = [
  { time: "14:32", type: "mover", text: "Lucy Bull · Quaver Series — secondary lot adjudicated EUR 450k +18% est. Pinault provenance disclosed", impact: "+18.0%", impactClass: "up" },
  { time: "13:48", type: "fair-value", text: "Avery Singer · Fair Value revised +EUR 180k on Hauser & Wirth Basel disclosure", impact: "+24.6%", impactClass: "up" },
  { time: "12:14", type: "event", text: "Whitney Biennial 2026 shortlist leaked — 14 tracked artists incl. Quarles, Toor, Boafo", impact: "Catalyst", impactClass: "neutral" },
  { time: "11:50", type: "alert", text: "Anna Weyant — third unsold lot in 90 days, sell-through degraded -22pts", impact: "-22pts", impactClass: "down" },
  { time: "11:20", type: "watchlist", text: "Banksy · Girl with Balloon entering Sotheby's Modern Evening (Nov 14)", impact: "Watch", impactClass: "neutral" },
  { time: "10:42", type: "confidence", text: "BART STREET & URBAN Confidence downgraded High to Medium, thin transactions trailing 30D", impact: "-9pts", impactClass: "down" },
  { time: "10:18", type: "mover", text: "Issy Wood — Phillips evening lot withdrawn 24h pre-sale, price discovery distorted", impact: "—", impactClass: "down" },
  { time: "09:54", type: "fair-value", text: "Christina Quarles · Fair Value uplift +EUR 340k on MoCA group show announcement", impact: "+31.5%", impactClass: "up" },
  { time: "09:31", type: "event", text: "Pinault Collection dispatching 4 Boafo paintings to Bourse de Commerce Q1 2026 rotation", impact: "Catalyst", impactClass: "neutral" },
  { time: "08:48", type: "mover", text: "Jadé Fadojutimi · Phillips London adjudication EUR 720k +28% est.", impact: "+28.0%", impactClass: "up" },
  { time: "08:14", type: "watchlist", text: "Hockney pool series 1972 reported being privately consigned, NY major house", impact: "Watch", impactClass: "neutral" },
  { time: "07:42", type: "alert", text: "Salman Toor · Whitney show window closing, historical post-window decay -8% in 6M", impact: "-8% mod.", impactClass: "down" },
  { time: "07:18", type: "confidence", text: "BART ULTRA-CONTEMPORARY volume backing thin (-31% vs trailing 90D avg)", impact: "-31% vol", impactClass: "down" },
  { time: "06:55", type: "mover", text: "KAWS Companion sculpture, HK secondary +24% over high estimate", impact: "+24.0%", impactClass: "up" },
];

export const AUCTIONS = [
  { date: "14 NOV", house: "Sotheby's New York", sale: "Modern Evening Auction", lots: 47, est: "$180–270M", tracked: 12 },
  { date: "15 NOV", house: "Christie's New York", sale: "21st Century Evening Sale", lots: 38, est: "$120–180M", tracked: 18 },
  { date: "20 NOV", house: "Phillips New York", sale: "New Now", lots: 124, est: "$28–42M", tracked: 9 },
  { date: "28 NOV", house: "Sotheby's London", sale: "Contemporary Curated", lots: 62, est: "GBP 14–22M", tracked: 6 },
  { date: "04 DEC", house: "Christie's Hong Kong", sale: "20/21 Century Evening", lots: 41, est: "HK$320–520M", tracked: 14 },
];

export const RECENT_RESULTS = [
  { date: "11 NOV", artwork: "Lucy Bull · Untitled", house: "Christie's NY", est: "EUR 350–450k", sold: 450000, delta: 18.4, bought_in: false },
  { date: "11 NOV", artwork: "Jadé Fadojutimi · Vortex", house: "Phillips London", est: "EUR 480–620k", sold: 720000, delta: 28.6, bought_in: false },
  { date: "08 NOV", artwork: "Cecily Brown · Studies", house: "Sotheby's NY", est: "EUR 2.4–3.2M", sold: 3680000, delta: 14.2, bought_in: false },
  { date: "07 NOV", artwork: "Anna Weyant · Falling Woman", house: "Phillips NY", est: "EUR 600–800k", sold: 0, delta: 0, bought_in: true },
  { date: "04 NOV", artwork: "KAWS · Companion", house: "Sotheby's HK", est: "HK$8–12M", sold: 14800000, delta: 23.3, bought_in: false },
];

export const ARTISTS = [
  { id: "lucy-bull", name: "Lucy Bull", born: 1990, nationality: "American", based: "Los Angeles, USA", segment: "Ultra-Contemporary", bartScore: 84, galleries: ["David Kordansky", "Almine Rech"], auctions5y: 23, sellThrough: 96, overEst: 34, dominantMedium: "Oil on linen", bio: "Painter trained at UCLA (MFA 2017), revealed by 2022 Kordansky LA solo show. Working primarily in oil glazes on linen, Bull builds vibratory abstract compositions with strong critical reception (NYT, Artforum). Pinault Collection acquisition (2022) marks first major institutional validation.", pressTimeline: [
    { year: 2022, event: "Solo show « Quaver », David Kordansky LA" },
    { year: 2022, event: "Pinault Collection acquisition" },
    { year: 2023, event: "Group show, ICA Miami" },
    { year: 2024, event: "Whitney « Painting in Place »" },
  ] },
  { id: "avery-singer", name: "Avery Singer", born: 1987, nationality: "American", based: "New York, USA", segment: "Ultra-Contemporary", bartScore: 88, galleries: ["Hauser & Wirth"], auctions5y: 31, sellThrough: 94, overEst: 21, dominantMedium: "Acrylic + airbrush", bio: "Brooklyn-based painter using digital modelling software to plan large-scale airbrush works. First artist to deploy Sketchup as a formal compositional tool. Represented by Hauser & Wirth since 2019.", pressTimeline: [
    { year: 2018, event: "Whitney solo presentation" },
    { year: 2022, event: "Stedelijk Museum solo" },
    { year: 2025, event: "Hauser & Wirth Basel" },
  ] },
  { id: "christina-quarles", name: "Christina Quarles", born: 1985, nationality: "American", based: "Los Angeles, USA", segment: "Ultra-Contemporary", bartScore: 91, galleries: ["Hauser & Wirth", "Pilar Corrias"], auctions5y: 28, sellThrough: 97, overEst: 38, dominantMedium: "Acrylic on canvas", bio: "Los Angeles-based painter whose multi-figure works explore embodiment, identity, and the limits of representation. Graduate of Yale (MFA 2014). Widely considered one of the most important figurative painters of her generation.", pressTimeline: [
    { year: 2021, event: "Tate Modern group inclusion" },
    { year: 2023, event: "MoCA group show" },
    { year: 2024, event: "Whitney Biennial shortlist" },
  ] },
  { id: "jade-fadojutimi", name: "Jadé Fadojutimi", born: 1993, nationality: "British", based: "London, UK", segment: "Ultra-Contemporary", bartScore: 84, galleries: ["Gagosian", "Pippy Houldsworth"], auctions5y: 19, sellThrough: 98, overEst: 41, dominantMedium: "Oil on canvas", bio: "London-based painter working in large-scale gestural abstraction. The youngest artist to have a solo exhibition at the Scottish National Gallery of Modern Art (2021). Gagosian representation since 2022 marked a major institutional step.", pressTimeline: [
    { year: 2021, event: "Scottish National Gallery solo" },
    { year: 2022, event: "Gagosian representation" },
    { year: 2024, event: "Serpentine Galleries group show" },
  ] },
  { id: "david-hockney", name: "David Hockney", born: 1937, nationality: "British", based: "Normandy, France", segment: "Modern Masters", bartScore: 94, galleries: ["Pace", "L.A. Louver"], auctions5y: 187, sellThrough: 91, overEst: 14, dominantMedium: "Acrylic on canvas", bio: "One of the most influential British artists of the 20th century. Known for his pool paintings, double portraits, and landscape works produced in Yorkshire and California. Retrospective at Tate Britain (2017) remains the most visited in the museum's history.", pressTimeline: [
    { year: 2017, event: "Tate Britain retrospective" },
    { year: 2018, event: "Christie's NY record: $90.3M" },
    { year: 2023, event: "Centre Pompidou retrospective" },
  ] },
  { id: "gerhard-richter", name: "Gerhard Richter", born: 1932, nationality: "German", based: "Cologne, Germany", segment: "Modern Masters", bartScore: 96, galleries: ["David Zwirner", "Marian Goodman"], auctions5y: 412, sellThrough: 89, overEst: 11, dominantMedium: "Oil on canvas", bio: "Cologne-based painter working across photo-realism and pure abstraction (the Abstrakte Bilder). Perhaps the most critically established living European painter. Works held in every major museum collection.", pressTimeline: [
    { year: 2020, event: "Fondation Louis Vuitton retrospective" },
    { year: 2022, event: "David Zwirner global tour" },
  ] },
  { id: "yayoi-kusama", name: "Yayoi Kusama", born: 1929, nationality: "Japanese", based: "Tokyo, Japan", segment: "Modern Masters", bartScore: 93, galleries: ["David Zwirner", "Victoria Miro"], auctions5y: 524, sellThrough: 92, overEst: 18, dominantMedium: "Acrylic on canvas", bio: "Tokyo-based artist whose obsessive dot patterns and Infinity Mirror Rooms have made her one of the most recognisable — and commercially successful — artists in the world. The Tate retrospective (2012) broke attendance records.", pressTimeline: [
    { year: 2022, event: "Tate Modern retrospective" },
    { year: 2024, event: "Christie's HK: $4.48M pumpkin" },
  ] },
  { id: "banksy", name: "Banksy", born: 1974, nationality: "British", based: "Bristol, UK", segment: "Street & Urban", bartScore: 89, galleries: ["Pest Control only"], auctions5y: 312, sellThrough: 87, overEst: 28, dominantMedium: "Screen print / spray", bio: "Anonymous Bristol-based street artist whose identity remains unknown. Works span stencil graffiti, installations, and oil paintings. Pest Control is the sole authentication body. The 2018 Sotheby's shredding event created the world's first live-shredded work.", pressTimeline: [
    { year: 2021, event: "Sotheby's London: £18.6M" },
    { year: 2023, event: "Venice intervention" },
    { year: 2024, event: "Market dominance: 28.4% BSU weight" },
  ] },
].map((a, idx) => {
  const history = synthSeries(100, 100 + a.bartScore * 3.5, 120, 18);
  return { ...a, indexHistory: history };
});

export const GALLERIES = [
  { id: "hauser-wirth", name: "Hauser & Wirth", tier: "Mega", cities: "Zurich · NY · LA · London · Paris · HK", roster: 86, bartScore: 96, avg5y: 42 },
  { id: "gagosian", name: "Gagosian", tier: "Mega", cities: "NY · London · Paris · Geneva · HK · Rome", roster: 72, bartScore: 95, avg5y: 38 },
  { id: "zwirner", name: "David Zwirner", tier: "Mega", cities: "NY · London · Paris · HK", roster: 64, bartScore: 96, avg5y: 41 },
  { id: "pace", name: "Pace", tier: "Mega", cities: "NY · London · HK · Geneva · Tokyo", roster: 58, bartScore: 92, avg5y: 34 },
  { id: "kordansky", name: "David Kordansky", tier: "Major", cities: "Los Angeles · New York", roster: 32, bartScore: 84, avg5y: 47 },
  { id: "perrotin", name: "Perrotin", tier: "Major", cities: "Paris · NY · HK · Tokyo · Seoul", roster: 41, bartScore: 81, avg5y: 31 },
  { id: "lisson", name: "Lisson", tier: "Major", cities: "London · NY · Shanghai · LA", roster: 38, bartScore: 84, avg5y: 28 },
  { id: "almine", name: "Almine Rech", tier: "Major", cities: "Paris · Brussels · NY · Shanghai", roster: 44, bartScore: 78, avg5y: 26 },
];

export const MOVEMENTS = [
  { name: "Lyrical Abstraction Post-2018", region: "USA · UK", count: 40, perf: 38, key: ["Bull", "Quin", "Quarles"] },
  { name: "Düsseldorf School (legacy)", region: "DE · post-1990", count: 28, perf: 12, key: ["Gursky", "Struth", "Höfer"] },
  { name: "New Figuration", region: "USA · UK · ZA", count: 64, perf: 24, key: ["Toor", "Boafo", "Weyant"] },
  { name: "Speculative Realism Painting", region: "USA · DE", count: 18, perf: 31, key: ["Singer", "Rauch"] },
  { name: "African Diaspora Contemporary", region: "GH · NG · USA", count: 52, perf: 41, key: ["Boafo", "Crosby", "Mehretu"] },
  { name: "Post-Internet Sculpture", region: "USA · DE · UK", count: 22, perf: -8, key: ["Trecartin", "Arsham"] },
];

export const REPORTS = [
  { title: "Q4 2025 Ultra-Contemporary Outlook", date: "11 NOV 2025", type: "Quarterly", pages: 18, status: "NEW" },
  { title: "Whitney Biennial 2026 Pre-Show Brief", date: "08 NOV 2025", type: "Event Brief", pages: 12, status: "NEW" },
  { title: "Pinault Collection Disposal Patterns 2018-2025", date: "02 NOV 2025", type: "Deep Dive", pages: 34, status: "READ" },
  { title: "Photography Index Methodology Update", date: "24 OCT 2025", type: "Methodology", pages: 9, status: "READ" },
  { title: "African Diaspora Contemporary 2025 Mid-Year", date: "15 OCT 2025", type: "Segment Report", pages: 22, status: "READ" },
  { title: "IFRS 13 Fair Value Hierarchy for Art Assets", date: "02 OCT 2025", type: "Compliance", pages: 14, status: "READ" },
];

export const TOP_MOVERS = [
  { artist: "Robert Nava", segment: "Ultra-Contemporary", move: 31.2, driver: "Pace signing", direction: "up" },
  { artist: "Invader", segment: "Street & Urban", move: 41.2, driver: "NFT cross-buyer flow", direction: "up" },
  { artist: "Christina Quarles", segment: "Ultra-Contemporary", move: 18.4, driver: "MoCA show", direction: "up" },
  { artist: "Anna Weyant", segment: "Ultra-Contemporary", move: -12.4, driver: "Sell-through erosion", direction: "down" },
  { artist: "Issy Wood", segment: "Ultra-Contemporary", move: -14.8, driver: "Phillips withdrawal", direction: "down" },
  { artist: "Avery Singer", segment: "Ultra-Contemporary", move: 14.7, driver: "Hauser & Wirth Basel", direction: "up" },
];
