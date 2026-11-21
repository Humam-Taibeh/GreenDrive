# GreenDrive — Pitch deck outline (Hackathon 2026)

Use this structure in Google Slides or Canva.

## 1. Title

- GreenDrive: AI routes that cut CO₂ without guessing.
- Tagline: Toxic Emerald intelligence on Deep Onyx infrastructure.
- Team: AI Lead & Cyber Security Specialists (logos / university anchors).

## 2. Problem

- Transport emissions are opaque; drivers optimize for time, not carbon.
- Hills, traffic, and detours change fuel burn in ways maps rarely explain.
- No single place merges **real routes**, **terrain**, and **cost / CO₂ per trip**.

## 3. Insight

- **Fastest vs. most efficient** are different objectives; users deserve side-by-side clarity.
- Elevation-aware fuel modeling turns “shorter” into “wasteful” when grades spike.

## 4. Solution — GreenDrive

- Organic liquid UI + glass-native surfaces (premium trust).
- Eco-Copilot briefs each route (Gemini / OpenRouter when a key is set; a local summary otherwise).
- Real routes from **OSRM / OpenStreetMap**, climb measured with **Open-Meteo** elevation — all free, no API key.
- Optional **Firebase** sign-in (Google or email); guests can use everything; preferences sync when signed in.

## 5. Demo flow (live)

1. Landing page and the interactive **impact calculator**.
2. `/map` as a guest: set A and B, compare up to three real routes (time, fuel, cost, CO₂, climb).
3. **Ask AI** for a route briefing.
4. Toggle **English / Arabic (RTL)** and **dark / light**.

## 6. Security & compliance posture

- TLS, least-privilege Firestore rules, no secrets in client bundles beyond public Firebase config.
- Guest mode needs no account; account features are optional.

## 7. Traction / vision

- Hackathon: working vertical slice. Next: live traffic data, real vehicle-consumption data, fleet pilots.

## 8. Team

- **AI Lead** — models, Gemini context, product narrative.
- **Cyber Security Specialists** — authZ, data boundaries, trust UX.

## 9. Ask

- Mentor feedback on self-hosting routing / elevation for production scale.
- Introductions to sustainability programs / mobility partners.
