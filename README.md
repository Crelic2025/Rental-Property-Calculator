# Rental Property Calculator — House Hack Edition

A single-file HTML/JavaScript deal analysis tool for evaluating 2–4 unit residential investment properties, specifically calibrated for owner-occupied “house hacking” in the Minneapolis/St. Paul metro area.

Built around the **BiggerPockets Four Square Method** and the conservative underwriting principles from Craig Curelop’s *The House Hacking Strategy*, Brandon Turner’s *The Book on Rental Property Investing*, and a custom quantitative framework for the Minnetonka, MN market.

-----

## What This Is

A production-quality rental property underwriting tool designed for a first-time house hacker who wants to:

- Evaluate 10–20 potential deals per week in under 2 minutes each
- Apply institutional-grade financial gates (not just rules of thumb)
- Reverse-engineer the maximum price they should offer on any property
- Avoid common rookie mistakes (optimistic rents, missing reserves, ignoring stress scenarios)

It’s a **single HTML file** — no backend, no build process, no dependencies except a couple of free CDN fonts. Open it in any modern browser (or upload to a hosting service) and it just works.

**Calibration:** Defaults are set for the Minnetonka, MN market as of 2026. Tax buffers, rent ranges, market heuristics, and framework constants reflect local conditions. Most of the logic is universal, but the rent benchmarks and the 7% Minnetonka property tax buffer are region-specific.

-----

## Who This Is For

- **First-time owner-occupant investors** looking at 2–4 unit properties (duplex, triplex, fourplex)
- People using **FHA (3.5% down)** or **low-down-payment Conventional (5%)** loans
- Buyers who plan to live in one unit while renting the others
- Anyone screening listings from Zillow, Realtor.com, or MLS feeds daily
- Investors who want **conservative, math-driven** decisions rather than gut calls

**Not designed for:**

- Single-family flips or BRRRR strategies (no ARV/rehab modeling)
- 5+ unit commercial multifamily (different financing rules)
- Short-term/vacation rentals (no seasonality modeling)
- Heavy value-add deals requiring significant renovation (repair budget is hard-capped at $8,000)

-----

## Core Framework Sources

The calculator synthesizes principles from three primary sources:

1. **The House Hacking Strategy** by Craig Curelop (BiggerPockets Publishing)
1. **The Book on Rental Property Investing** by Brandon Turner (BiggerPockets Publishing)
1. **Quantitative Systems for Multifamily Acquisition** — a Minnetonka-specific framework document synthesizing BP methodology with local market data (macroeconomic forecasts, rent ranges, 2026 property tax levy increases, FHA self-sufficiency requirements)

Supplementary reference: **The Book on Managing Rental Properties** by Brandon & Heather Turner (informs management fee and reserve defaults).

-----

## Features

### 1. Two Operating Modes

**⚡ Rapid Screen Mode** — For high-throughput deal evaluation

- Enter just 3 things: address, asking price, total monthly rent
- Instant pass/fail verdict on all critical gates
- Shows MAO (maximum allowable offer) in real time
- Uses your saved defaults for everything else
- Designed to evaluate a lead in under 30 seconds

**⊞ Full Analysis Mode** — Deep-dive underwriting

- Per-unit rent inputs with bedroom-type dropdowns
- All 8 input sections (property, rents, financing, expenses, reserves, your situation, capital, MAO targets)
- Line-item breakdown of both scenarios
- All return metrics (Cap Rate, Cash-on-Cash, DSCR, etc.)
- Full gate analysis with binding constraint identification

Toggle between modes anytime. The “Open Full Analysis →” button in rapid mode copies the current inputs into full mode automatically.

### 2. The Two-Underwriting Mandate

Every deal is analyzed **twice**:

- **Scenario A (Live-In)** — You occupy one unit; tenants offset your mortgage. Shows your net monthly housing cost. Must be at or below your comfort cap ($3,200 default).
- **Scenario B (Move-Out)** — All units rented, you’ve moved out. Shows stabilized cash flow. **Must be ≥ $0 or deal is rejected.**

This dual analysis is a non-negotiable framework rule. A deal that only works while you’re living there is a liability, not an investment.

### 3. The MAO Solver (Maximum Allowable Offer)

The single most valuable feature. Reverse-engineers the highest purchase price where **every gate simultaneously passes**, given your rent comps, financing, and targets.

Runs 6 constraints in parallel:

1. Scenario B cash flow constraint
1. Stress test constraint
1. Scenario A comfort cap constraint
1. Capital adequacy constraint (reserves remain above minimum)
1. FHA Self-Sufficiency constraint (for 3–4 unit FHA loans only)
1. Optional Cash-on-Cash Return target constraint

The constraint producing the lowest MAO is marked as **BINDING** — this tells you *which gate* is limiting your offer price, so you know exactly what to negotiate on.

### 4. Saved Defaults System

Via `localStorage`, the tool remembers everything that doesn’t change between deals:

- Loan type, interest rate, term, closing cost %
- Property tax, insurance, utilities, snow/lawn costs
- All four reserve rates (vacancy, maintenance, CapEx, management)
- Your comfort cap, total cash available, living expenses
- Zip code, MAO targets
- RentCast API key (if set)

**Per-deal fields that are cleared on “New Deal”:** address, purchase price, repair budget, unit rents, other income.

### 5. RentCast API Integration (Optional, $20/mo)

For users who want automated rent comp lookups:

- Paste your RentCast API key into the ⚙ API Key settings
- Each unit gets a “Pull Comps” button
- One tap calls the RentCast API with your zip + bedroom count
- Returns up to 5 active listings with addresses, beds/baths, sqft, and asking rents
- Auto-calculates low/median/conservative (median −5%) summary
- “Use $X” button auto-fills the conservative rent into the field

**Without an API key, the calculator works identically** — Pull Comps buttons just don’t appear. The manual Zillow/Google comp links remain functional.

### 6. Manual Comp Link Buttons

Each unit row has 3 quick-access buttons that open search sites pre-filtered to your zip code:

- **Zillow** — `zillow.com/homes/for_rent/{zip}/`
- **Google** — returns results from multiple rental sites in one search
- **Craigslist** (full analysis only) — pre-filters zip + bedroom count + 5-mile radius

### 7. Quick Screens (60-Second Heuristics)

Three rapid pass/fail metrics based on BP’s industry-standard rules of thumb:

- **1% Rule** — Monthly rent ÷ (price + repairs) ≥ 1%
- **50% Rule** — (Gross rent × 50%) − P&I ≥ $0
- **GRM (Gross Rent Multiplier)** — Price ÷ annual rent ≤ 10 (strong), 10–15 (typical), >15 (high)

### 8. Stress Test

Simulates a recessionary shock: income drops 10%, expenses rise 15%, simultaneously. **If cash flow goes negative under stress, the deal is automatically rejected.** This is a critical gate — no exceptions.

### 9. FHA Self-Sufficiency Test

For FHA loans on 3- and 4-unit properties only, the federal rule that 75% of total gross rent must cover the full PITI payment. Automatically activated/deactivated based on property type and loan selection. Duplexes and conventional loans are exempt.

### 10. Capital Adequacy Gate

The four-bucket capital model:

1. Down payment (3.5% FHA or 5% Conventional)
1. Closing costs (2–4% of loan amount)
1. Repairs (hard cap $8,000)
1. Emergency reserve (must be ≥ 3 months of PITI + living expenses)

Visual progress bar shows capital deployment. If remaining reserves fall below the 3-month minimum, the gate fails — you’re over-extended for this deal even if every other test passes.

### 11. Comprehensive Help System

Every confusing section has a **?** help button that opens a plain-English walkthrough:

- How to find rents (step-by-step with worked example)
- What reserve rates mean (with dollar examples)
- Why comfort cap exists and how to set yours
- Why two scenarios (the “house hack trap” explained)
- What quick screens tell you
- How the stress test simulates real-world events
- The four capital buckets explained
- How to use the MAO as a negotiation anchor

Designed for first-time investors who’ve never underwritten a property before.

### 12. Market Range Indicators

Each unit’s rent input shows a visual range bar based on the Minnetonka PDF’s market data:

- Studio: $1,200–$1,337
- 1 BR: $1,475–$1,708
- 2 BR: $1,705–$2,159
- 3 BR: $2,475–$3,375
- 4 BR: $2,800–$3,600

Green = within market range, red = below market (likely under-comping), amber = above market range (likely optimistic).

-----

## Key Metrics Calculated

|Metric                          |Formula                          |Purpose                                            |
|--------------------------------|---------------------------------|---------------------------------------------------|
|**GSI** (Gross Scheduled Income)|Σ unit rents + other income      |Total theoretical monthly revenue at 100% occupancy|
|**EGI** (Effective Gross Income)|GSI − vacancy loss               |Expected actual collected revenue                  |
|**NOI** (Net Operating Income)  |EGI − operating expenses         |Unlevered earning power (excludes debt service)    |
|**Cash Flow**                   |NOI − P&I − MIP/PMI              |Monthly cash in/out of your pocket                 |
|**Cap Rate**                    |(Annual NOI ÷ Purchase Price)    |Unlevered yield — used to compare properties       |
|**Cash-on-Cash**                |(Annual CF ÷ Total Cash In)      |Leveraged yield on actual cash deployed            |
|**DSCR**                        |Annual NOI ÷ Annual Debt Service |Lender’s debt coverage ratio (want 1.25x+)         |
|**PITI**                        |P&I + Taxes + Insurance + MIP/PMI|Full monthly mortgage obligation                   |
|**1% Rule**                     |Monthly Rent ÷ (Price + Repairs) |Rapid screening heuristic                          |
|**50% Rule**                    |(GSI × 50%) − P&I                |Rapid cash flow estimate                           |
|**GRM**                         |Price ÷ Annual Rent              |Price-to-rent multiplier                           |
|**Stressed NOI**                |(EGI × 0.9) − (OpEx × 1.15)      |Recession scenario NOI                             |
|**Stressed CF**                 |Stressed NOI − P&I − MIP         |Recession scenario cash flow                       |
|**MAO**                         |min(all 6 constraint solutions)  |Highest price where every gate passes              |

-----

## Conservative Defaults (from the Minnetonka PDF framework)

|Input                    |Default     |Rationale                                          |
|-------------------------|------------|---------------------------------------------------|
|Vacancy                  |7%          |Conservative floor even in tight markets           |
|Maintenance              |8% of GSI   |PDF-mandated minimum                               |
|CapEx Reserve            |8% of GSI   |Covers roof/HVAC/water heater replacements         |
|Property Management      |8% of GSI   |Always modeled to protect exit optionality         |
|Property Tax Buffer      |+7%         |Accounts for Minnetonka’s 7.935% 2026 levy increase|
|Comfort Cap              |$3,200/mo   |PDF-mandated maximum net housing cost              |
|Repair Budget Cap        |$8,000      |Hard ceiling — above this isn’t a house hack       |
|Emergency Reserve        |3 months    |PDF minimum; 6 months preferred                    |
|Interest Rate            |7.0%        |2026 market rate for owner-occupied multifamily    |
|FHA Down Payment         |3.5%        |Federal minimum                                    |
|Conventional Down Payment|5%          |Low-down-payment threshold                         |
|FHA MIP                  |0.55% annual|Permanent for FHA loans                            |
|Conventional PMI         |0.80% annual|Drops off at 20% equity                            |

-----

## Technical Specifications

### File Structure

- **1 file:** `rental-property-calculator-v5.html`
- **~2,800 lines** including HTML, embedded CSS, embedded JavaScript
- **No build step**, no package manager, no dependencies to install

### External Dependencies (CDN-loaded at runtime)

- `fonts.googleapis.com` — DM Sans + DM Mono fonts
- `api.rentcast.io` — Only if user provides API key (optional feature)

### Browser Support

- **Primary target:** iOS Safari (mobile-first design)
- **Also tested:** Chrome, Firefox, Edge (desktop and mobile)
- **Minimum:** ES2020 support (async/await, optional chaining, nullish coalescing)

### Storage

- **localStorage** for saved defaults and RentCast API key
- No cookies, no backend, no tracking
- All data stays on your device

### Responsive Design

- Three breakpoints: 700px (tablet) and 420px (phone)
- Mobile-first CSS — works well on iPhone screens
- Touch targets sized for iPad field use

-----

## Setup & Usage

### Quick Start

1. Download the HTML file
1. Open it in any browser (or host it on GitHub Pages, Netlify, etc.)
1. Fill in your defaults (financing terms, reserves, your cash situation)
1. Tap **💾 Save My Defaults** — they persist across browser sessions
1. For each new deal: tap **＋ New Deal**, enter address + price + rent, read the verdict

### Optional: RentCast API Setup

1. Sign up at [rentcast.io](https://rentcast.io) (~$20/mo Starter plan = ~100 API calls)
1. Copy your API key from the RentCast dashboard
1. In the calculator, tap **⚙ API Key**
1. Paste your key, tap **Save Key**
1. Each unit now has a **Pull Comps** button that fetches live rent comps

### Typical Workflow (per deal)

1. Tap **＋ New Deal** (keeps your saved defaults, clears per-deal fields)
1. Stay in Rapid Screen mode
1. Enter address, asking price, and estimated total monthly rent (gut estimate)
1. Read the verdict — is it worth deeper analysis?
1. If it passes or is borderline: tap **Open Full Analysis →**
1. Refine individual unit rents with comp links or RentCast
1. Review all gates in detail
1. Use the MAO as your negotiation anchor — offer at or below MAO only

-----

## Version History

**v5.0** (Current) — Comprehensive help system with plain-English walkthroughs for every section. Bedroom-type dropdowns with auto-filled defaults from market ranges. Visual range indicators per unit.

**v4.0** — Rapid Screen mode added. Saved defaults via localStorage. New Deal button. Toast notifications. RentCast API integration.

**v3.0** — Full UI overhaul to light theme with collapsible cards. Beginner-friendly explanations added to every section. DSCR and GRM metrics added.

**v2.0** — Fixed critical Cap Rate bug (was using monthly NOI instead of annual). Fixed owner utility share in Scenario A. Added “Other Income” field. Added MAO target inputs for advanced users. Added NOI subtotal line to Scenario B.

**v1.0** — Initial build. Dark terminal UI. Two-underwriting mandate, MAO solver, stress test, capital gate, FHA test, manual comp links.

-----

## Known Limitations

### By Design

- **No multi-year projections** — speculative appreciation and rent growth are intentionally excluded. The framework is conservative: only model what’s knowable today.
- **No rehab modeling** — the $8,000 repair cap exists because heavy value-add is outside the scope of this strategy.
- **No 5+ unit properties** — commercial multifamily uses different financing rules, cap rate benchmarks, and DSCR requirements.
- **Single-family properties not supported** — the tool specifically models tenant-offset scenarios that require multiple units.

### Technical

- **No batch mode** — you evaluate one deal at a time. This is intentional; BP’s advice is that 20 deeply-analyzed deals beats 200 superficially-screened ones.
- **No auto-populate from MLS or Zillow** — these services don’t expose public APIs, and scraping violates their terms of service.
- **localStorage only** — saved defaults don’t sync across devices. If you use the calculator on both your phone and iPad, you’ll need to set them up separately.
- **RentCast API costs** — free plan is very limited; reliable comping requires the $20/mo Starter tier.

### Regional Calibration

- Market rent ranges are hard-coded for Minnetonka, MN. Users in other markets should update `MARKET_RANGES` in the JS or mentally adjust.
- The 7% property tax buffer is specific to Minnetonka’s 2026 levy. Other Minnesota cities will differ.
- Snow/lawn default of $100/mo reflects MN climate realities.

-----

## Design Philosophy

### Math First, Emotion Second

Every gate is deterministic. There are no “feelings” or “gut calls.” The calculator either passes a deal or rejects it. If you find yourself wanting to override a critical gate failure, the framework says don’t.

### Conservative Underwriting

Every default is biased toward the cautious side:

- Higher vacancy assumptions than market reality
- Higher expense reserves than strictly necessary
- Lower rent estimates than the seller claims
- Higher property tax projections than current bill

This isn’t pessimism — it’s buffer. Real estate is a 30-year hold, and protection against bad years matters more than optimizing for good ones.

### The Two-Underwriting Mandate

The single most important rule embedded in this tool: **a deal must work both as a live-in property AND as a stabilized rental after you move out.** A deal that only passes Scenario A is a trap — you’ll be unable to move without the property becoming a money pit.

### Reserves Are Sacred

The capital adequacy gate exists specifically to prevent investors from draining their cash pool to zero on closing day. A property that leaves you with $2,000 in the bank is one boiler failure away from a crisis. The 3-month reserve minimum is the floor, not the target.

### Management Always Modeled

Even self-managers must model the property management fee (8% default). This preserves exit optionality. If the deal only works because of your free labor, it’s not an investment — it’s a second job.

-----

## Contributing / Customization

### Adjusting for Your Market

To calibrate for a city other than Minnetonka:

1. **Property tax buffer** — Edit the `monthlyTax` calculation in `calc()`. The default `(annualTax * 1.07) / 12` reflects Minnetonka’s 2026 levy. Your city’s buffer may be 3–5%, or zero if taxes are stable.
1. **Rent ranges** — Edit the `MARKET_RANGES` constant at the top of the script. Update `low`, `high`, and `default` values for Studio through 4BR based on comps for your city.
1. **Interest rate** — Update the default value in the HTML `<input id="rate">` element.
1. **Loan defaults** — If you’re in a non-FHA state or using different programs, edit the default values in the financing section.

### Adding Metrics

The core calculation engine is in the `calc()` function. New metrics can be added by:

1. Computing the value from existing variables
1. Rendering it in the `returnCards` innerHTML block
1. Optionally adding it to the gate checklist in the verdict logic

### Forking for Other Strategies

This codebase could be adapted for:

- **BRRRR investors** — remove two-underwriting mandate, add ARV/rehab modeling
- **Small commercial (5–10 unit)** — adjust cap rate benchmarks, remove FHA test, adjust financing assumptions
- **Short-term rental (STR) analysis** — replace long-term vacancy with seasonal occupancy modeling
- **Other markets** — most regional calibration lives in `MARKET_RANGES` and the tax buffer

-----

## Credits & Attribution

- **Framework basis:** BiggerPockets Four Square Method (publicly documented)
- **House Hacking methodology:** *The House Hacking Strategy* by Craig Curelop
- **Underwriting rigor:** *The Book on Rental Property Investing* by Brandon Turner
- **Management defaults:** *The Book on Managing Rental Properties* by Brandon & Heather Turner
- **Local market data:** Minnetonka 2026 quantitative framework (synthesized from MN city assessor data, Minneapolis Fed forecasts, BP market analyses)
- **RentCast API:** Optional rent comp integration via rentcast.io
- **Typography:** DM Sans and DM Mono via Google Fonts

-----

## License

This tool is provided as-is for personal, non-commercial use. The underlying methodology (Four Square Method, two-underwriting rule, etc.) is from published BiggerPockets content and is widely available. The specific implementation, UI design, and MAO solver algorithm in this file are MIT-licensed — feel free to fork, modify, and redistribute with attribution.

**No warranty.** This is an educational tool, not financial advice. All real estate decisions carry risk. Verify all numbers independently with your lender, agent, CPA, and attorney before making an offer.

-----

## Support

This is a personal project with no formal support channel. If you find a bug or want to suggest an improvement, open an issue on GitHub. If you fork it and make it better for your market or strategy, consider linking back so others can benefit.

**Core maintenance principle:** If a future version breaks a formula that was previously verified against BiggerPockets methodology, that’s a critical bug — not a feature request. The math is the foundation; the UI is just a wrapper around it.

-----

*“Deals that survive this exhaustive mathematical gauntlet are not merely speculative bets; they are highly optimized financial instruments engineered to yield continuous, long-term solvency.”*

— Minnetonka Quantitative Framework, 2026
