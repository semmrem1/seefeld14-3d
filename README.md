# Seefeldstrasse 14, Uster: Wohnung 01 in 3D

Interaktive 3D-Animation der 4.5-Zimmer-Gartenwohnung (Wohnung 01) im Neubauprojekt Seefeldstrasse 14, 8610 Uster.
Läuft direkt im Browser, ohne Build-Schritt.

**Live:** https://semmrem1.github.io/seefeld14-3d/

## Inhalt

- Kamerafahrt vom Gebäude über das Gartengeschoss durch alle Räume bis in den Garten
- Räume anklickbar, mit Flächen gemäss Verkaufsunterlagen und Circa-Massen in Metern
- Begehen-Modus in Augenhöhe (ziehen, antippen, WASD)
- Drei Ausbaulinien für Böden, Küche und Nasszellen umschaltbar
- Sonnenstand für Uster am 15. Juli mit Regler für die Tageszeit
- Eckdaten zu Preis, Flächen, Haustechnik, Terminen und Lage

## Hinweise

Inoffizielle Visualisierung, kein Angebot des Verkäufers. Der Grundriss wurde aus dem Plan 1:100 abgegriffen.
Masse sind gerundete Circa-Werte. Raumhöhe (2.50 m), Möblierung und Gebäudehülle sind schematisch, Materialfarben den Mustern der Ausbaulinien nachempfunden. Ausrichtung gemäss Nordpfeil im Plan. Flächen und Preise gemäss
Verkaufsunterlagen, Stand November 2026, ohne Gewähr. Offizielle Angaben: https://www.seefeldstrasse14.ch/

## Lokal starten

```
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Technik

Statisches HTML mit ES-Modulen und three.js (liegt unter `vendor/`, MIT-Lizenz). Daten in `src/data.js`, Szene in `src/main.js`.
