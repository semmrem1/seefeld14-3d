// Alle Angaben zur Wohnung 01, Seefeldstrasse 14, 8610 Uster.
// Quellen: seefeldstrasse14.ch, Verkaufspreisliste 26.10.2026,
// Verkaufsdokumentation 02.11.2026, Käuferbaubeschrieb 04.11.2026,
// Plan Aussenfläche Gartenwohnung, Vertrags- und Detailunterlagen vom 12.11.2026
// (siehe unterlagen.html). Angaben ohne Gewähr.

// Der Grundriss wurde aus dem Plan 1:100 abgegriffen (Pixel bei 300 % -> Meter).
// Massstab kalibriert an den Raumflächen und der Gebäudetiefe 13.80 m.
const PX_PER_M = 69.1;
const OX = 446, OZ = 128;
export const mx = (px) => (px - OX) / PX_PER_M;
export const mz = (py) => (py - OZ) / PX_PER_M;
export const r = (x0, x1, z0, z1) => ({ x0: mx(x0), x1: mx(x1), z0: mz(z0), z1: mz(z1) });

export const WALL_H = 2.5; // Annahme, Raumhöhe ist in den Unterlagen nicht angegeben

// Aussenkontur der Wohnung: oberer Teil, Mittelteil mit Entrée, unterer Teil
export const outline = [r(446, 1386, 128, 441), r(446, 1515, 441, 771), r(446, 1120, 771, 1086)];

export const rooms = [
  { id: 'kueche', name: 'Küche / Essen', area: 23.3, fenster: 13.0, floor: 'platten', rects: [r(468, 895, 167, 422)],
    note: 'Jahreszeitenzimmer: Fensterfront zur Terrasse vollständig öffenbar' },
  { id: 'wohnen', name: 'Wohnen', area: 28.1, fenster: 4.3, floor: 'parkett', rects: [r(480, 750, 422, 817), r(750, 857, 565, 817)],
    note: 'Offen zu Küche / Essen' },
  { id: 'zimmer1', name: 'Zimmer 1', area: 15.7, fenster: 4.3, floor: 'parkett', rects: [r(906, 1200, 167, 422)], note: 'Zugang vom Korridor, neben Bad / WC. Möbliert als Kinderzimmer mit Hochbett.' },
  { id: 'zimmer2', name: 'Zimmer 2', area: 17.2, fenster: 3.4, floor: 'parkett', rects: [r(868, 1088, 675, 1047)],
    note: 'Elternzimmer mit Ankleide und eigener Dusche / WC' },
  { id: 'zimmer3', name: 'Zimmer 3', area: 17.6, fenster: 4.3, floor: 'parkett', rects: [r(480, 857, 829, 1047)], note: 'Zugang vom Wohnen' },
  { id: 'korridor', name: 'Entrée / Korridor', area: 19.4, floor: 'parkett', rects: [r(970, 1493, 434, 585), r(857, 1090, 565, 663)],
    note: 'Wohnungseingang auf der Ostseite, Einbauschränke' },
  { id: 'bad', name: 'Bad / WC', area: 6.7, floor: 'platten', rects: [r(1228, 1354, 167, 422)], note: 'Badewanne, Doppellavabo, Zugang vom Korridor' },
  { id: 'dusche', name: 'Dusche / WC', area: 7.0, floor: 'platten', rects: [r(1229, 1493, 614, 739)], note: 'Zugang nur über die Ankleide von Zimmer 2' },
  { id: 'garderobe', name: 'Ankleide', area: 3.7, floor: 'platten', rects: [r(1100, 1223, 597, 739)], note: 'Zugang von Zimmer 2, Durchgang zur Dusche' },
  { id: 'abstell', name: 'Abstellraum', area: 4.8, floor: 'platten', rects: [r(760, 950, 434, 553)], note: 'Zugang von der Küche, Waschturm' },
];

// Durchgänge und Türen (Wandöffnungen über die ganze Höhe)
export const openings = [
  r(1090, 1150, 420, 436),   // Korridor -> Zimmer 1
  r(1290, 1352, 420, 436),   // Korridor -> Bad
  r(762, 825, 420, 436),     // Küche -> Abstellraum
  r(745, 807, 815, 831),     // Wohnen -> Zimmer 3
  r(918, 978, 661, 677),     // Korridor -> Zimmer 2
  r(1086, 1102, 674, 737),   // Zimmer 2 -> Ankleide
  r(1221, 1231, 686, 738),   // Ankleide -> Dusche (Schiebetür, unterer Teil gemäss Vertragsplan)
  r(1491, 1517, 478, 550),   // Wohnungstür
];

// Fenster (raumhoch, Glas)
export const windows = [
  r(640, 770, 126, 169), r(952, 1082, 126, 169),       // oben: Küche, Zimmer 1
  r(444, 470, 167, 422), r(444, 482, 604, 734),        // links: Jahreszeitenzimmer, Wohnen
  r(567, 697, 1045, 1088), r(868, 1000, 1045, 1088),   // unten: Zimmer 3, Zimmer 2
];

// Terrasse als Variante mit 2.5 m Tiefe (Plan: 1.2 m tief, 5.5 m2). Der Gartenstreifen ist ca. 3.5 m tief.
export const TERRACE_DEPTH = 2.5;
const tz = r(366, 446, 158, 432);
export const terrace = { x0: -TERRACE_DEPTH, x1: 0, z0: tz.z0, z1: tz.z1, area: Math.round(TERRACE_DEPTH * (tz.z1 - tz.z0) * 10) / 10, planArea: 5.5 };
// Gartentisch 0.9 x 1.6 m mit vier Stühlen
export const gardenTable = { x0: -1.85, x1: -0.95, z0: (tz.z0 + tz.z1) / 2 - 0.8, z1: (tz.z0 + tz.z1) / 2 + 0.8 };

// Privater Garten 97.0 m2 gemäss Plan "Angabe Aussenfläche Gartenwohnung"
const D = mz(1086);
export const garden = { area: 97.0, rects: [
  { x0: -3.5, x1: 0, z0: 0, z1: D + 4.2 },
  { x0: 0, x1: 7.9, z0: D, z1: D + 4.2 },
] };
export const DEPTH = D;
export const BUILDING_LEN = 27.34; // Gebäudelänge gemäss Plan

// Möblierung nur zur Veranschaulichung (nicht im Kaufpreis)
const f = (x0, x1, z0, z1, h, color, y = 0) => ({ ...r(x0, x1, z0, z1), h, color, y });
export const furniture = [
  // Ecksofa in der Südwestecke des Wohnbereichs: 2.85 m an der Südwand, 1.75 m an der Westwand
  f(482, 679, 751, 801, 0.42, 0x8f8478),           // Sitzfläche lang
  f(482, 679, 801, 815, 0.8, 0x857a6e),            // Rückenlehne Süd
  f(496, 548, 694, 751, 0.42, 0x8f8478),           // Sitzfläche Schenkel
  f(482, 496, 694, 801, 0.8, 0x857a6e),            // Rückenlehne West
  f(665, 679, 751, 801, 0.6, 0x857a6e),            // Armlehne
  f(496, 548, 687, 694, 0.6, 0x857a6e),            // Armlehne Schenkel
  f(580, 650, 690, 726, 0.34, 0x6b5a4e),           // Salontisch
  // Sessel mittig im Wohnbereich, Blick zum Sofa
  f(596, 652, 594, 640, 0.42, 0xa39a8c),           // Sitz
  f(596, 652, 582, 594, 0.85, 0x968c7e),           // Rückenlehne
  f(590, 596, 582, 640, 0.6, 0x968c7e),            // Armlehne links
  f(652, 658, 582, 640, 0.6, 0x968c7e),            // Armlehne rechts
  f(829, 857, 700, 800, 0.45, 0x6b5a4e),           // Sideboard an der Wand zu Zimmer 2
  f(870, 912, 677, 801, 2.1, 'gard'),              // Schrank Zimmer 2
  f(972, 1087, 436, 474, 2.15, 'gard'),            // Einbauschränke Entrée
  f(1100, 1222, 597, 637, 2.15, 'gard'),           // Schränke Ankleide
];

// Ausbaulinien gemäss PDF "Ausbaulinien" (je drei Optionen pro Gattung)
export const ausbaulinien = [
  { name: 'Offerte Küche', parkett: 0xd2b596, nass: 0xcbb5a3, platten: 0xa3978c, front: 0xc6b6a2, stone: 0x8b8c90, speck: 0.5, gard: 0xb9b5aa,
    text: ['Küche gemäss Offerte LD Küchen vom 06.11.2026', 'Küchenfront PerfectSense Graubraun', 'Granit New Angola, poliert', 'Küchenboden Platten 60 x 60 wie in den Perspektiven (Farbton geschätzt)', 'Parkett Eiche RMC Neutral R2020', 'Nasszellen Iamara Cayman Cappuccino'] },
  { name: 'Option 1', parkett: 0xd2b596, nass: 0xcbb5a3, platten: 0xe6e1da, front: 0xa69b8e, stone: 0xe6e6e2, speck: 0.25, gard: 0xb9b5aa,
    text: ['Parkett Eiche RMC Neutral R2020', 'Nasszellen Iamara Cayman Cappuccino', 'Platten Colom Creme', 'Küchenfront Graubraun', 'Naturstein London White', 'Garderobe Kieselgrau'] },
  { name: 'Option 2', parkett: 0xd0a070, nass: 0xd9cfbd, platten: 0xbcbebe, front: 0x3b3c39, stone: 0xdcdcde, speck: 0.9, gard: 0x8e8c87,
    text: ['Parkett Eiche RMC Sand 5% R2023', 'Nasszellen Iamara Espalmador Sand', 'Platten Colom Perlgrau', 'Küchenfront matt Graphit', 'Naturstein Blanco Castilla', 'Garderobe Grigio Lava'] },
  { name: 'Option 3', parkett: 0x7a6c62, nass: 0xab9d8d, platten: 0x414243, front: 0xd2cdc0, stone: 0x3a3e3f, speck: 0.35, gard: 0xd2d2ce,
    text: ['Parkett Eiche RMC Charcoal R305', 'Nasszellen Iamara Espalmador Taupe', 'Platten Colom Anthrazit', 'Küchenfront Ecru', 'Naturstein New Angola', 'Garderobe Lichtgrau'] },
];
// Esstisch aus Holz, 1.05 x 2.20 m, je drei Stühle an den Längsseiten
export const diningTable = { x0: 1.375, x1: 2.425, z0: mz(294.5) - 1.1, z1: mz(294.5) + 1.1 };
// Abstellraum: Waschturm (Waschmaschine und Tumbler übereinander) und Vorratsregale
// V-ZUG Adora V4000: je 60 x 60 x 85 cm, übereinander ca. 1.70 m
export const washTower = { x0: mx(945) - 0.6, x1: mx(945), z0: mz(549) - 0.6, z1: mz(549) };
export const shelves = [
  { ...r(764, 850, 526, 551), open: 'n' },   // Südwand, 1.25 m lang, 36 cm tief
  { ...r(923, 948, 438, 500), open: 'w' },   // Ostwand neben dem Waschturm, 90 cm lang, 36 cm tief
];

export const facts = {
  titel: 'Wohnung 01',
  untertitel: '4.5 Zimmer · Gartengeschoss',
  adresse: 'Seefeldstrasse 14, 8610 Uster (Niederuster)',
  wohnflaeche: 151.3,
  keller: 10.4,
  preis: 1890000,
  werkpreis: 1225000,
  landpreis: 665000,
  wertquote: 109,
  parkplatz: 50000,
  status: 'Frei (Stand 11.11.2026)',
  gruppen: [
    { titel: 'Preis', zeilen: [
      ['Verkaufspreis', "CHF 1'890'000"],
      ['davon Werkpreis', "CHF 1'225'000"],
      ['davon Landpreis', "CHF 665'000"],
      ['Preis pro m² Wohnfläche', "CHF 12'492"],
      ['Wertquote', '109 / 1000'],
      ['Parkplatz Einstellhalle', "CHF 50'000 (zusätzlich)"],
      ['Rabatt Ausbaukonzept', '2 % auf Werkpreis bei vordefiniertem Gesamtkonzept'],
    ] },
    { titel: 'Flächen', zeilen: [
      ['Wohnfläche', '151.3 m²'],
      ['Garten privat', '97.0 m²'],
      ['Terrasse gemäss Plan', '5.5 m² (ca. 1.2 m tief)'],
      ['Terrasse im Modell', 'Variante 2.5 m tief, ca. 9.9 m²'],
      ['Keller', '10.4 m²'],
    ] },
    { titel: 'Haustechnik', zeilen: [
      ['Heizung', 'Wärmepumpe mit Erdsonden, Bodenheizung'],
      ['Kühlung', 'Freecooling über Erdsonden im Sommer'],
      ['Strom', 'Photovoltaikanlage auf dem Hauptdach'],
      ['E-Mobilität', 'Hausanschluss vorbereitet, Ladestation auf Käuferkosten'],
      ['Internet', 'Swisscom Glasfaser (FTTH)'],
      ['Messung', 'Wärme und Wasser pro Wohnung'],
    ] },
    { titel: 'Gebäude', zeilen: [
      ['Projekt', 'Ersatzneubau mit 11 Eigentumswohnungen'],
      ['Geschosse', 'UG, Gartengeschoss, EG, 1. und 2. OG, 1. und 2. Dachgeschoss'],
      ['Fassade', 'Holzfassade, Satteldach mit Quergiebel'],
      ['Erschliessung', 'Lift, Einstellhalle mit Autolift (2.10 m), Veloraum im Gartengeschoss'],
      ['Grundstück', 'Kat. Nr. C2738, 858 m², Grundbuch Blatt 8507'],
      ['Baubewilligung', 'Stadt Uster, 18.11.2025, rechtskräftig'],
    ] },
    { titel: 'Auskünfte vom 12.11.2026', zeilen: [
      ['Veloraum', 'Zugang über den Autolift'],
      ['Sitzplatz', 'Plattenbereich laut Verkäufer noch anpassbar'],
      ['Standardausbau', 'Rabattvereinbarung, 2 % auf den Werkpreis'],
      ['Individueller Ausbau', 'Käufervereinbarung und Budgetliste'],
    ] },
    { titel: 'Zahlungsplan (mit Parkplatz)', zeilen: [
      ['Reservation', "CHF 50'000"],
      ['Beurkundung, ca. Feb. 2027', "CHF 947'250 (Land 633'000, 25 % Werk 314'250)"],
      ['Rohbau, ca. Feb. 2028', "CHF 314'250 (25 %)"],
      ['Elektro, ca. April 2028', "CHF 251'400 (20 %)"],
      ['Unterlagsböden, ca. Juni 2028', "CHF 251'400 (20 %)"],
      ['Schlusszahlung, ca. Okt. 2028', "CHF 125'700 (10 %)"],
      ['Total', "CHF 1'940'000"],
    ] },
    { titel: 'Termine und Ablauf', zeilen: [
      ['Reservation gültig bis', '31.03.2027 (Beurkundung spätestens dann)'],
      ['Baubeginn', 'voraussichtlich Februar / März 2027'],
      ['Bezugsbereitschaft', '01.10.2028 bis 31.01.2029, Anzeige 3 Monate vorher'],
      ['Zahlungsversprechen', 'Bank, gültig bis mind. 31.01.2029'],
      ['Rückzug nach Reservation', "CHF 20'000 verfallen"],
      ['Garantie', 'Rügefrist 2 Jahre, verdeckte Mängel 5 Jahre'],
    ] },
    { titel: 'Stockwerkeigentum', zeilen: [
      ['Grundbuch', 'Blatt 53402, amtliche Whg.-Nr. 9901'],
      ['Kostenanteil Wohnhaus', '113 / 1000'],
      ['Garten und Sitzplatz', 'ausschliessliches Benutzungsrecht, Bepflanzung nicht veränderbar'],
      ['Erneuerungsfonds', 'ab 3. Betriebsjahr, bis 0.25 % des Versicherungswerts pro Jahr'],
      ['Kurzzeitvermietung', 'nicht erlaubt (z.B. Airbnb)'],
      ['Solarstrom', 'Zusammenschluss zum Eigenverbrauch (ZEV)'],
    ] },
    { titel: 'Küche Standard', zeilen: [
      ['Lieferant', 'LD Küchen GmbH, Uster'],
      ['Anordnung', 'Zeile 3.65 m, Kochinsel 1.84 m'],
      ['Front', 'PerfectSense Graubraun'],
      ['Abdeckung', 'Granit New Angola, poliert'],
      ['Geräte', 'Electrolux: Induktion mit Dunstabzug, Backofen, Steamer, Geschirrspüler, Kühlschrank 275 l'],
    ] },
    { titel: 'Lage', zeilen: [
      ['Bus', 'Haltestelle Niederuster (Linie 816), ca. 200 m'],
      ['S-Bahn', 'Bahnhof Uster in ca. 5 Minuten'],
      ['Schule', 'Kindergarten und Schulhaus Niederuster vis-à-vis'],
      ['Erholung', 'Greifensee und Strandbad Uster zu Fuss'],
      ['Steuerfuss 2026', '112 % (gemäss Verkaufsdokumentation)'],
    ] },
    { titel: 'Beteiligte', zeilen: [
      ['Verkauf', 'Dettwyler Development AG, Küsnacht'],
      ['Landeigentümerin', 'Dettwyler Immobilien GmbH, Küsnacht'],
      ['Totalunternehmung', 'Piiri AG, Zürich'],
      ['Generalunternehmung', 'Werubau AG, Meilen (Bauleitung und Käuferbetreuung)'],
      ['Architektur', 'Jäger Zäh Architekten, Zürich'],
    ] },
  ],
};
