// Alle Angaben zur Wohnung 01, Seefeldstrasse 14, 8610 Uster.
// Quellen: seefeldstrasse14.ch, Verkaufspreisliste 26.10.2026,
// Verkaufsdokumentation 02.11.2026, Käuferbaubeschrieb 04.11.2026,
// Plan Aussenfläche Gartenwohnung. Angaben ohne Gewähr.

// Der Grundriss wurde aus dem Plan 1:100 abgegriffen (Pixel -> Meter).
const PX_PER_M = 37.2;
const OX = 78, OZ = 30;
export const mx = (px) => (px - OX) / PX_PER_M;
export const mz = (py) => (py - OZ) / PX_PER_M;
const r = (x0, x1, z0, z1) => ({ x0: mx(x0), x1: mx(x1), z0: mz(z0), z1: mz(z1) });

export const WALL_H = 2.5; // Annahme, Raumhöhe ist in den Unterlagen nicht angegeben

// Aussenkontur der Wohnung als Vereinigung von Rechtecken
export const outline = [r(78, 585, 30, 385), r(585, 660, 200, 385), r(78, 445, 385, 555)];

export const rooms = [
  { id: 'kueche', name: 'Küche / Essen', area: 23.3, fenster: 13.0, floor: 'parkett', rects: [r(95, 322, 48, 190)],
    note: 'Jahreszeitenzimmer: Fensterfront zur Terrasse vollständig öffenbar' },
  { id: 'wohnen', name: 'Wohnen', area: 28.1, fenster: 4.3, floor: 'parkett', rects: [r(95, 245, 190, 405), r(245, 300, 270, 405)],
    note: 'Offen zu Küche / Essen' },
  { id: 'zimmer1', name: 'Zimmer 1', area: 15.7, fenster: 4.3, floor: 'parkett', rects: [r(330, 490, 48, 190)], note: 'Direkt neben Bad / WC' },
  { id: 'zimmer2', name: 'Zimmer 2', area: 17.2, fenster: 3.4, floor: 'parkett', rects: [r(308, 432, 325, 540)], note: '' },
  { id: 'zimmer3', name: 'Zimmer 3', area: 17.6, fenster: 4.3, floor: 'parkett', rects: [r(95, 300, 412, 540)], note: '' },
  { id: 'korridor', name: 'Entrée / Korridor', area: 19.4, floor: 'parkett', rects: [r(360, 648, 200, 283), r(300, 437, 265, 320)],
    note: 'Wohnungseingang auf der Ostseite, Einbauschränke' },
  { id: 'bad', name: 'Bad / WC', area: 6.7, floor: 'platten', rects: [r(503, 572, 48, 190)], note: 'Badewanne, Doppellavabo' },
  { id: 'dusche', name: 'Dusche / WC', area: 7.0, floor: 'platten', rects: [r(503, 648, 295, 370)], note: 'Bodenebene Dusche, Doppellavabo' },
  { id: 'garderobe', name: 'Garderobe', area: 3.7, floor: 'platten', rects: [r(441, 497, 290, 370)], note: 'Vorraum zur Dusche' },
  { id: 'abstell', name: 'Abstellraum', area: 4.8, floor: 'platten', rects: [r(251, 355, 200, 265)], note: 'Waschturm (Waschmaschine / Tumbler)' },
];

// Durchgänge und Türen (Wandöffnungen über die ganze Höhe)
export const openings = [
  r(432, 465, 188, 202),  // Zimmer 1
  r(535, 568, 188, 202),  // Bad
  r(243, 253, 203, 238),  // Abstellraum
  r(245, 280, 403, 414),  // Zimmer 3
  r(333, 366, 318, 327),  // Zimmer 2
  r(445, 478, 281, 292),  // Garderobe
  r(495, 505, 330, 364),  // Dusche
  r(646, 662, 220, 262),  // Wohnungstür
];

// Fenster (raumhoch, Glas)
export const windows = [
  r(180, 255, 28, 50), r(350, 430, 28, 50),          // oben: Küche, Zimmer 1
  r(76, 97, 55, 185), r(76, 97, 290, 370),           // links: Jahreszeitenzimmer, Wohnen
  r(145, 215, 538, 557), r(305, 380, 538, 557),      // unten: Zimmer 3, Zimmer 2
];

export const terrace = { ...r(30, 78, 45, 185), area: 5.5 };

// Privater Garten 97.0 m2 gemäss Plan "Angabe Aussenfläche Gartenwohnung"
const D = mz(555);
export const garden = { area: 97.0, rects: [
  { x0: -3.5, x1: 0, z0: 0, z1: D + 4.2 },
  { x0: 0, x1: 7.9, z0: D, z1: D + 4.2 },
] };
export const DEPTH = D;
export const BUILDING_LEN = 27.34; // Gebäudelänge gemäss Plan

// Möblierung nur zur Veranschaulichung (nicht im Kaufpreis)
const f = (x0, x1, z0, z1, h, color, y = 0) => ({ ...r(x0, x1, z0, z1), h, color, y });
export const furniture = [
  f(232, 256, 92, 138, 0.92, 0xe9e4dc),            // Kochinsel
  f(299, 321, 52, 186, 2.15, 0xd9d2c7),            // Küchenzeile hoch
  f(331, 385, 88, 152, 0.45, 0xcdbfb3),            // Bett Zimmer 1
  f(468, 489, 120, 186, 2.1, 0xe6e0d6),            // Schrank Zimmer 1
  f(508, 570, 52, 80, 0.55, 0xffffff),             // Badewanne
  f(505, 522, 100, 152, 0.85, 0xe6e0d6),           // Lavabo Bad
  f(120, 186, 245, 272, 0.42, 0x8f8478),           // Sofa 1
  f(120, 186, 330, 357, 0.42, 0x8f8478),           // Sofa 2
  f(134, 172, 290, 312, 0.3, 0x6b5a4e),            // Salontisch
  f(98, 132, 418, 492, 0.45, 0xcdbfb3),            // Bett Zimmer 3
  f(218, 268, 502, 530, 0.74, 0x9b8469),           // Pult Zimmer 3
  f(350, 412, 440, 502, 0.45, 0xcdbfb3),           // Bett Zimmer 2
  f(310, 331, 336, 402, 2.1, 0xe6e0d6),            // Schrank Zimmer 2
  f(365, 427, 201, 224, 2.15, 0xe6e0d6),           // Einbauschränke Entrée
  f(441, 497, 291, 312, 2.15, 0xe6e0d6),           // Garderobenschrank
  f(540, 592, 296, 312, 0.85, 0xe6e0d6),           // Lavabo Dusche
  f(322, 352, 232, 263, 1.75, 0xf4f4f2),           // Waschturm
];
export const diningTable = { x: mx(158), z: mz(128), r: 0.68 };

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
      ['Terrasse', '5.5 m²'],
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
      ['Geschosse', 'UG, Gartengeschoss, EG, 1. und 2. OG, Dachgeschoss'],
      ['Fassade', 'Holzfassade, Satteldach mit Quergiebel'],
      ['Erschliessung', 'Lift, Einstellhalle mit Autolift, Veloraum'],
      ['Grundstück', 'Kat. Nr. C2738'],
    ] },
    { titel: 'Termine und Ablauf', zeilen: [
      ['Baubeginn', 'voraussichtlich Februar / März 2027'],
      ['Bezug', 'Ende 2028'],
      ['Reservation', "Anzahlung CHF 50'000"],
      ['Beurkundung', 'Landanteil und 25 % des Werkpreises'],
      ['Rest', '75 % des Werkpreises in 4 Teilzahlungen nach Baufortschritt'],
      ['Garantie', '5 Jahre, Garantieabnahme nach 2 Jahren'],
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
      ['Totalunternehmung', 'Piiri AG, Zürich'],
      ['Generalunternehmung', 'Werubau AG, Meilen'],
      ['Architektur', 'Jäger Zäh Architekten, Zürich'],
    ] },
  ],
};
