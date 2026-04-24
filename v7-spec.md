# Rental Property Calculator v6.1 → v7.0
## Three-Phase Audit, API Plan, and Targeted Code Diffs
**Prepared for Reese — Twin Cities house-hacker, Home Comfort Advisor**
**Scope:** single-file HTML tool, Safari/iPad/iPhone, offline-first, ≤3 min analysis workflow

---

## Executive Summary (Read This First)

Your v6.1 is *structurally sound* — the MAO solver, DSCR math, and 17-market MN intelligence are unusually thoughtful for a single-file tool. But there are **four framework fidelity gaps** that will cost you real money if uncorrected, and **three speed bottlenecks** that keep you from hitting the 3-minute target:

**P0 framework gaps (fix first):**
1. **Dual-timeline house-hack modeling** — Curelop's framework assumes Year 1 (owner occupies, 1 unit rents) and Year 2+ (all units rent) produce materially different returns. If v6.1 shows only one cash-flow number, you're either underselling the Year-2 deal or oversimplifying the Year-1 pain. ([Coach Carson on Curelop's Y1 model](https://www.coachcarson.com/financial-independence-3-years-house-hacking/))
2. **FHA Self-Sufficiency Test for 3–4 unit** — Mandatory pass/fail gate at 75% of gross rents ≥ PITI (HUD uses 75% of market rents as the sustainability ratio; some sources cite the older 85% vacancy factor, but current 2026 guidance centers on the stricter test). If you analyze a triplex or quad and ignore this, FHA will decline the loan. ([Mortgage Research 2026](https://www.mortgageresearch.com/articles/fha-self-sufficiency-test/), [Newcastle Loans](https://www.newcastle.loans/mortgage-guide/fha-self-sufficiency-3-4-unit))
3. **MN homestead split-classification** — Owner-occupied duplex/triplex/quad gets class 1a (1.00% first $500K) on the owner's unit *proportionally* and class 4b non-homestead (1.25%) on the rental portion. If v6.1 applies a single tax rate to the whole property, you're mis-estimating taxes by 10–20% on every MN deal. ([MN Statute 273.13](https://www.revisor.mn.gov/statutes/cite/273.13), [AskDoss 2026](https://askdoss.com/minnesota-homestead-classification-and-tax-benefits-explained/))
4. **Reserves inside Cash-to-Close** — Curelop and every 2026 DSCR lender require 3–6 months PITI in reserves. If "cash needed" shows only down-payment + closing, you're understating the true barrier to entry by $6K–$15K. ([1st Nationwide Mortgage](https://www.1stnwm.com/blog/dscr-loan-requirements-2026-complete-guide/), [Craig Curelop on reserves](https://www.bestevercre.com/podcast/1260-biggerpockets-analyst-tells-us-his-life-hacking-story-with-craig-curelop))

**P1 speed wins:**
- Replace "paste address + manually enter price/beds/baths" with **one geocoded address input → parallel fetch of Census tract + HUD FMR + RentCast property record**. Cuts data entry from ~90 seconds to ~15 seconds.
- A Cloudflare Worker (free tier, 100K requests/day) proxies RentCast and hides your API key — *strongly justified* because (a) client-side API keys in a single-file HTML are a security smell, and (b) RentCast's free tier is only 50 calls/month, so you'll want the $29 Starter plan (~100 calls/month) once you're serious. ([RentCast pricing](https://www.rentcast.io/api), [Cloudflare Workers free tier](https://developers.cloudflare.com/workers/examples/cors-header-proxy/))
- Combine US Census Geocoder (free, no key) for address→lat/lng/FIPS, and use Nominatim autocomplete or the browser's `<datalist>` with recent entries. No Google API bill.

**Quick Glance card — final 5 metrics (see Phase 3 for the JSX/HTML):**
1. **True out-of-pocket housing cost (Y1)** — the Trench / Curelop headline number
2. **Year 2+ monthly cash flow (full rental)** — the "does this become a keeper?" number
3. **Cash-on-Cash @ Y2** — framework benchmark (Curelop target: ≥8–12% for house hacks; pure rental target per Turner: ≥10–12%)
4. **DSCR @ Y2 + FHA Self-Sufficiency pass/fail** — the two lender gates in one cell
5. **MAO Δ** ($ over/under your solved MAO) — the negotiation anchor

Everything else (1% rule, 50% rule, cap rate, GRM, break-even rent) moves into a secondary "Sanity Checks" strip that's always visible but de-emphasized.

---

# PHASE 1 — FRAMEWORK VALIDATION AUDIT

## 1. Craig Curelop — *The House Hacking Strategy* (BiggerPockets, 2019)

Curelop does **not** publish a single canonical CoC target in the book the way Turner does for pure rentals — his framework is built around a different metric he calls **NWROI (Net Worth Return on Investment)**, which combines cash flow + principal paydown + appreciation + tax benefits + rent savings. Reviewers push back on this because NWROI bundles non-guaranteed returns with cash returns; the durable takeaway is that Curelop evaluates house hacks on **rent savings first, cash flow second** — i.e., if the property eliminates your housing expense and cash flows $1 after reserves, it's a win ([Goodreads review of The House Hacking Strategy](https://www.allbookstores.com/The-House-Hacking-Strategy-How/9781947200159)).

His published deal math (Whittier duplex): $385K purchase, FHA 3.5%, PITI $2,300, gross rent $2,850–$3,050, **$250/month reserves**, ~$600–$1,000/month residual cash flow ([Best Ever CRE podcast #1260](https://www.bestevercre.com/podcast/1260-biggerpockets-analyst-tells-us-his-life-hacking-story-with-craig-curelop); [Coach Carson interview](https://www.coachcarson.com/financial-independence-3-years-house-hacking/)). His first-year ROI (rent savings + cash flow) was calculated at 82% on $17K initial investment ([BiggerPockets: The ROI on the First Year of My House Hack](https://www.biggerpockets.com/blog/numbers-house-hack)).

**What v6.1 must model correctly:**

| Element | Curelop Treatment | v6.1 Status (inferred) | Gap |
|---|---|---|---|
| Year 1 rent from owner's unit | $0 (owner occupies) | Likely modeled | ✅ if dual-mode toggle exists |
| Year 2+ rent from owner's unit | Market rent | Must toggle | **P0 fix: explicit Y1 vs Y2+ side-by-side** |
| Reserves | ~$250/mo baseline, scales with property | Often treated as an "expense %" | **P0 fix: separate reserves line in Cash-to-Close + monthly** |
| Owner's utility burden | Owner pays 100% of owner-unit utilities in house hacks | Often ignored | **P0 fix: separate owner-unit utility cost from landlord utilities** |
| 50% rule application | Apply to gross rent *excluding* owner-unit rent in Y1; apply to gross including owner-unit in Y2+ | Unclear | **P1 fix: make the 50% check honor dual timeline** |
| Rent-savings credit | Counted as effective cash flow | Often missed | **P0 fix: "True Housing Cost" metric that subtracts market rent owner would have paid** |

**Verdict:** Your calculator must have a **Year 1 ↔ Year 2+ toggle** (or side-by-side columns) as a first-class UI element, not a hidden advanced setting. This is the most frequently cited flaw in generic rental calculators when house-hackers use them.

## 2. BiggerPockets Four Square Method (Turner / Trench)

The canonical Four Square (from Brandon Turner's video + PDF worksheet) has these four quadrants ([BiggerPockets Four Square PDF](https://assets1.biggerpockets.com/uploads/user_file/file_object/1305/Four_Square_Rental_Property_Analysis_-_BiggerPockets.pdf); [BiggerPockets blog](https://www.biggerpockets.com/blog/easily-analyzing-rental-properties-four-square-method)):

**Q1 Income:** Gross scheduled rent + other income (laundry, parking, storage, pet rent). Turner does *not* subtract vacancy here — vacancy lives in Q2 Expenses.

**Q2 Expenses (Turner's canonical list):** Taxes • Insurance • Flood insurance • Water/sewer • Garbage • Gas • Electricity • HOA • Lawn/snow • Vacancy (typically 5–8%) • Repairs (5–10%) • CapEx (5–10%) • Property management (8–10%, *even if self-managed*, because labor has value). Mortgage/PMI are tracked separately and subtracted in Q3. ([The Book on Rental Property Investing ch. 5](https://www.goodreads.com/book/show/40611008-the-book-on-rental-property-investing))

**Q3 Cash Flow:** Income − Expenses − Mortgage (P&I) − PMI

**Q4 Cash-on-Cash Return:** (Annual Cash Flow) ÷ (Total Cash Invested — down payment + closing + rehab + initial reserves)

**Checklist audit of v6.1 against Turner's Q2 expense lines** — verify each is either a user input or a default with override:

| Line | Required? | v6.1 should have |
|---|---|---|
| Property tax | Always | Yes, **homestead-aware** for MN |
| Hazard insurance | Always | Yes |
| Flood insurance | Only if in zone | **P2: add a FEMA flood-zone toggle tied to geocode** |
| Water/sewer | If owner pays | Yes, split owner vs landlord |
| Garbage | If owner pays | Yes |
| Gas | If owner pays | Yes — **critical in MN due to heating** |
| Electricity | If owner pays common | Yes |
| HOA | If applicable | Yes |
| Lawn/snow | Almost always in MN | Yes — **make it a default in MN mode** |
| Vacancy % | Always | Default 5–8% |
| Repairs % | Always | Default 5–8% |
| CapEx % | Always | Default 5–10% |
| Property management % | Always (8–10% even if self-managing) | Yes, but **allow user to zero out with a warning** |
| PMI / MIP | If LTV >80% or FHA | Yes — FHA MIP is lifetime on >90% LTV |

**Most common omission in hand-rolled calculators:** lawn/snow (big in MN), and property management on self-managed units. If v6.1 defaults PM to 0% for house hacks, that's a framework deviation worth flagging in the UI.

## 3. 1% Rule and 50% Rule — 2026 Twin Cities reality check

**The 1% rule is dead in the Twin Cities for owner-occupied multifamily in 2026.** Median Twin Cities metro home sale price crossed **$401,000 in June 2025** ([KARE 11 / Minnesota Realtors](https://www.kare11.com/article/news/local/median-home-sales-twin-cities-metro-june-2025/89-78d3f272-2852-4d4a-81e8-2b7c4c49124d)), and the 2025 annual median hit $390,000 for the 13-county metro ([MAAR 2025 Annual Report](https://maar.stats.10kresearch.com/docs/ann/x/report)). To hit 1%, a $400K duplex would need $4,000/month gross rent; typical two-bed duplex units in Minneapolis/St. Paul rent $1,300–$1,700/unit ([Zumper 2025](https://www.zumper.com/rent-research/near-university-of-minnesota-twin-cities-mn), [Duplex Chick rent data](https://duplexchick.com/2024/05/07/what-are-average-rents-in-the-twin-cities/)), so a duplex realistically grosses $2,600–$3,400 — **0.65%–0.85% rent-to-price**.

**Recommended 2026 thresholds for the v6.1 gate (MN mode):**
- **Pass:** ≥ 0.8% (strong for Twin Cities; worth deep analysis)
- **Caution:** 0.7–0.8% (typical; requires strong CoC and appreciation thesis)
- **Fail:** < 0.7% (likely negative-cash-flow deal unless there's forced-appreciation angle)

Authorities explicitly acknowledge this ([Doorvest 2025 underwriting series](https://doorvest.com/blog/sfr-underwriting-metrics-2025/1-percent-rule-2025); [Rentana 2026](https://www.rentana.io/glossary/what-is-the-1-percent-rule-in-real-estate)). Treat the 1% rule as a **screening** tool only — never a go/no-go.

**The 50% rule in MN:** The textbook 50% rule says operating expenses (ex debt service) ≈ 50% of gross rent ([BiggerPockets forum consensus](https://www.biggerpockets.com/forums/12/topics/123937-50-rule)). In Minnesota, three factors push this higher for smaller multifamily:
1. Property taxes are higher than national average, especially on non-homestead portions (1.25% class rate)
2. Landlord insurance median ~$1,469/year, sometimes $2,000+ on duplexes ([Steadily MN](https://www.steadily.com/states/minnesota); [Clovered MN](https://clovered.com/landlord-insurance/minnesota/))
3. Heating costs on owner-paid utilities are meaningful; older duplex with single meter makes this worse

**Practical MN calibration:** use **55% expense ratio** as the default 50%-rule variant in MN mode, and make it **60% if owner pays heat**. BP forum commentary supports this: "Owner paid utilities are a potential trouble area that can cause your numbers to be worse than 50%" ([BiggerPockets thread](https://www.biggerpockets.com/forums/48/topics/153811-utilities-included-in-the-the-first-50--using-the-50-rule)).

## 4. Scott Trench — *Set for Life* (BiggerPockets, 2017; updated ed. 2022)

Trench's core framing: **housing is your single largest wealth destroyer**, and the goal of house hacking is not cash flow — it's **eliminating the expense entirely so you can redirect that cash into savings/investing** ([Mad Fientist interview](https://www.madfientist.com/scott-trench-interview/); [Living On The Cheap post by Trench](https://livingonthecheap.com/house-hacking-eliminate-housing-expense-using-peoples-money/); [Modern Spartan notes](https://www.themodernspartan.org/book-notes/set-for-life-by-scott-trench)).

His own Denver duplex story: "after the other expenses…I was probably breaking even or maybe paying a little bit out of pocket to live on a monthly basis. But that's a huge improvement from paying hundreds or thousands of dollars in rent per month" ([Mad Fientist](https://www.madfientist.com/scott-trench-interview/)). His math: lifetime wealth delta of ~$1.5M vs renter, ~$850K vs SFR buyer, over 30 years ([Modern Spartan](https://www.themodernspartan.org/book-notes/set-for-life-by-scott-trench)).

**The Trench metric v6.1 is missing:** **"True Out-of-Pocket Housing Cost"**

```
True Housing Cost (Y1) = PITI + owner_unit_utilities + reserves_monthly − (rent from non-owner units)
```

If this number is ≤ 0, Trench says the deal is "working." If it's ≤ (market rent for a comparable unit you'd otherwise rent), the deal is still a meaningful win because you've converted rent expense into mortgage equity + tax benefits.

**This is the single most important metric for Reese's use case** and should be the headline on the Quick Glance card (see Phase 3).

## 5. David Greene / BRRRR valuation — sales comps gap

v6.1's RentCast integration handles rental comps well. **Sales comps are absent.** Greene's BRRRR book (and his podcast commentary) emphasize that ARV must come from 3–5 recent, comparable, closed sales within 0.5 miles, within 90 days, same property type. For house-hackers buying turnkey, this matters less than for BRRRR, but you still need sales comps to:
- Sanity-check listing prices (Greene: "you make your money when you buy")
- Calculate MAO correctly when you *do* see a value-add duplex
- Track neighborhood appreciation thesis

**Recommendation:** Do NOT build a full sales-comp module. Instead, add a **one-click "Open Redfin comp search for this address" button** that builds the URL `https://www.redfin.com/city/...` with filters pre-set. This is a ~15-line addition and covers 80% of Greene's workflow.

If you want comps *inside* the app: ATTOM's Property API has comps but starts at $95/month ([ATTOM](https://www.attomdata.com/solutions/property-data-api/); [BatchData comparison](https://batchdata.io/blog/real-estate-apis-pricing-data)). Not worth it at your volume.

## 6. MAO methodology — validate v6.1's approach

Standard MAO formula in the BP ecosystem is **flip-oriented**: `MAO = ARV × 0.70 − Rehab` (the "70% rule"), or the fixed-cost variant `MAO = ARV − Rehab − Fixed Costs − Target Profit` ([New Silver](https://newsilver.com/the-lender/what-is-mao-in-real-estate/); [Real Estate Skills](https://www.realestateskills.com/blog/mao-formula)). These don't apply cleanly to house hacks.

**For house hacks the correct MAO is solved backwards from a target**, which is what v6.1 already does. Three valid solve-targets:

1. **Target Y1 True Housing Cost** (Trench framing): solve for purchase price where `PITI + utilities + reserves − rent ≤ $X` (default $0 for "live free")
2. **Target Y2 CoC** (Turner framing): solve for purchase price where Y2 CoC ≥ 10%
3. **Target DSCR + FHA SST** (lender framing): solve for purchase price where DSCR ≥ 1.0 AND 75%-of-gross-rent ≥ PITI (for 3–4 unit)

**Recommendation:** v6.1 should run **all three solvers and show the minimum of the three** as the default MAO, with a dropdown to change the binding constraint. This matches how sophisticated investors actually think: "what's the lowest ceiling of all my constraints?"

Common formulas v6.1 may be missing:
- **75% Rule for BRRRR** (`MAO = ARV × 0.75 − rehab − holding`). Add as an optional mode even though this isn't a BRRRR tool — useful when Reese sees a heavily distressed duplex.
- **Break-even rent** (`rent_required = PITI + operating_expenses`) as a reverse solver.

## 7. DSCR thresholds — 2026 reality

**Owner-occupied FHA / conventional: DSCR is not the controlling metric — DTI is.** FHA uses 43–50% back-end DTI; conventional 620 FICO tolerates 45% DTI.

**For 3–4 unit FHA specifically, the gate is the Self-Sufficiency Test**: rental income from **all units** (including the owner's, at market rent), multiplied by the appraiser's net rental income factor (often applied at 75% — i.e. a 25% haircut for vacancy and expense — though some older sources cite 85% of market rents), must be ≥ PITI ([Mortgage Research 2026](https://www.mortgageresearch.com/articles/fha-self-sufficiency-test/); [Newcastle Loans](https://www.newcastle.loans/mortgage-guide/fha-self-sufficiency-3-4-unit); [city-data on the older 85% factor](https://city-data.com/blogs/blog36769-self-sufficiency-test-fha-loans-three.html)). **Duplexes are exempt from the SST.**

**For Year 2+ / refi / pure investment (DSCR loan path):** 2026 standard is **DSCR ≥ 1.0 minimum, 1.25+ to unlock best rates**, with 20–25% down on 2–4 unit, 620–680+ FICO, and **3–6 months PITIA reserves** ([Clear House Lending 2026](https://www.clearhouselending.com/blog/dscr-loan-requirements), [1st Nationwide Mortgage](https://www.1stnwm.com/blog/dscr-loan-requirements-2026-complete-guide/), [Next Gen Mortgage](https://nextgenmortgageloans.com/post/dscr-loan-requirements)).

**v6.1 default DSCR targets should be:**
- **Y1 (house-hack / FHA):** show SST pass/fail for 3–4 unit; show "informational DSCR" only
- **Y2+ (refi-into-DSCR scenario):** 1.25 target, 1.0 floor

**VA 2–4 unit:** no DSCR requirement but residual income calc applies; not a priority for most Twin Cities buyers.

## 8. Cash reserves — explicit P0 fix

Curelop's book implies reserves in his $250/mo example ([Best Ever CRE](https://www.bestevercre.com/podcast/1260-biggerpockets-analyst-tells-us-his-life-hacking-story-with-craig-curelop)). DSCR lenders explicitly require 3–6 months PITIA in liquid reserves in 2026 ([DSCR Calculator blog](https://blog.dscrcalculator.mortgage/dscr-loan-requirements-2026); [1st Nationwide Mortgage](https://www.1stnwm.com/blog/dscr-loan-requirements-2026-complete-guide/)).

**v6.1 must split "Cash to Close" into two components:**
```
Cash to Close = Down Payment + Closing Costs + Rehab (if any)
Cash Needed (Total) = Cash to Close + 6 × PITIA reserves
```

The Quick Glance card should show **Cash Needed (Total)**, not Cash to Close.

## 9. Expense defaults — recommended ranges

Synthesizing BP forum consensus ([thread 429760](https://www.biggerpockets.com/forums/52/topics/429760-typical-figured-in-for-vacancy-capex-etc), [thread 176664](https://www.biggerpockets.com/forums/52/topics/176664-what-percent-are-you-using-for-maintance-vacancy-pm-etc), [thread 666072](https://www.biggerpockets.com/forums/88/topics/666072-how-much-to-account-for-vacancy-repairs-and-capex), [Turner's blog on CapEx](https://www.biggerpockets.com/blog/estimating-capex-real-estate)) with the 2025 Twin Cities vacancy rate of 6.9% and trending down ([Duplex Chick](https://duplexchick.com/2025/08/04/twin-cities-sees-improving-vacancy-rates/)):

| Category | v6.1 Default (recommend) | MN-mode adjustment |
|---|---|---|
| Vacancy | 6% | 5% in hot Twin Cities submarkets, 8% in Duluth/St. Cloud |
| Repairs | 6% | +2% if property built pre-1950 |
| CapEx | 8% | +2% if any major system >75% of useful life |
| Property management | 10% (on gross) | Keep at 10% even for self-managed (value your labor) |
| Owner-unit utilities (MN) | $200/mo heat + $80 elec + $40 water | Scales with sq ft |

## 10. Minnesota-specific parameters (2026)

**Homestead classification (class 1a):** 1.00% first $500K of market value, 1.25% above. **In a duplex/triplex/quad with owner occupying one unit, the entire property qualifies as homestead under MN Stat. 273.13** ([MN Revisor](https://www.revisor.mn.gov/statutes/cite/273.13); [MN Revenue Module 3](https://www.revenue.state.mn.us/sites/default/files/2026-01/module-3-classification-property.pdf)). **This is a critical and often-misunderstood point.** One source commonly quoted online (AskDoss) says split classification applies — they're wrong per statute. The statute explicitly says "In the case of a duplex or triplex in which one of the units is used for homestead purposes, the entire property is deemed to be used for homestead purposes."

**Quads are different:** a fourplex generally does *not* get whole-property homestead — only the owner's unit is homesteaded as class 1a, rest is 4bb or 4d (non-homestead residential, 1.25%).

**2026 Hennepin County approved 7.79% levy increase** over 2025; effective residential tax rate ~1.17%–1.19% of market value after credits ([Hennepin County Property Search](https://hennepincountypropertysearch.com/hennepin-county-property-tax/); [Fox 9 coverage](https://www.fox9.com/video/1714325)).

**Homestead Market Value Exclusion:** up to ~$38K of value deducted before taxes on homesteaded residential ([MN House Research](https://www.house.mn.gov/hrd/pubs/ss/ssptvart.pdf)).

**Landlord insurance:** median ~$1,469/year statewide; MN-specific risks drive cost — ice dams, frozen pipes, hail ([Steadily](https://www.steadily.com/states/minnesota)). Duplex in Minneapolis: budget $1,800–$2,800/year ([Clovered](https://clovered.com/landlord-insurance/minnesota/)).

**Minnesota Housing Start Up 2026:**
- Income limits (last published): 11-county Metro: $124,200 (1–2 person) / $142,800 (3+) ([MN Housing income limits](https://www.mnhousing.gov/get/mhfa_1041670)). 2026 HUD limits scheduled for release May 1, 2026; Met Council AMI for 4-person family = $132,400 for 2025 ([Met Council](https://metrocouncil.org/Housing/Planning/Affordable-Housing-Measures/Ownership-and-Rent-Affordability-Limits.aspx)).
- Acquisition cost limits (recent): 11-county metro one-unit $515,200 / two-unit $659,550; balance-of-state one-unit $472,030 / two-unit $604,400 ([MN Housing program description](https://www.mnhousing.gov/get/mhfa_1043060)). **These will update annually — v6.1 should mark these as "verify current limit at mnhousing.gov".**
- Minimum borrower contribution: lesser of $1,000 or 1% of purchase price.
- **Monthly Payment Loan:** up to $17K (recent) / $18K (some 2025 sources), amortizing at same rate as first mortgage, 10-year term ([MN Housing Start Up Manual](https://www.mnhousing.gov/get/MHFA_1012853); [Mortgage Reports 2026](https://themortgagereports.com/80785/mn-first-time-home-buyer-programs-grants)).
- **Deferred Payment Loan:** up to $12,500 standard / $17,000 Plus (for targeted borrowers, 80% AMI). 0% interest, no monthly payment, due on sale/refi/move ([Downpayment Scout](https://downpaymentscout.com/states/minnesota/); [MN Housing DPL info](https://www.fha.com/grants/minnesota-downpayment-closingcost-loans)).
- **First-Generation Homebuyer Loan:** up to $35K, forgivable (half at year 10, rest at year 20) — funded first-come-first-served, verify availability ([Anoka County](https://www.anokacountymn.gov/163/First-Time-Home-Buyer); [Refiguide 2026](https://www.refiguide.org/minnesota-first-time-home-buyer-loans/)).

**2026 FHA multi-unit loan limits, Minneapolis-St. Paul MSA (Hennepin/Ramsey/Anoka/Dakota/Washington/Scott/Carver/Chisago):** approximately $706,650 (2-unit) / $854,200 (3-unit) / $1,061,550 (4-unit) ([Madison Mortgage Guys MN limits](https://www.madisonmortgageguys.com/minnesota/fha-loan-limits/)). National floor for 2026: $693,050 / $837,700 / $1,041,125 ([National Mortgage Center](https://nationalmortgagecenter.com/fha-loan-limits); [Amerisave](https://www.amerisave.com/learn/fha-loan-limits-things-every-home-buyer-needs-to-know-about-the-to-m-range)).

---

# PHASE 2 — API SELECTION, SPEED, AND INTEGRATION

## API landscape (2026) — opinionated ranking for Reese

| API | Free Tier | Paid Entry | TC Data Quality | Client-side (CORS)? | Verdict for Reese |
|---|---|---|---|---|---|
| **RentCast** | 50 calls/mo | $29/mo (100 calls) → $99/mo (500) | Excellent rent comps; good property records via public recs + tax assessors | Requires API key → **needs proxy** | ✅ **Keep + upgrade to $29 Starter.** ROI is obvious at ~20–50 analyses/mo. |
| **US Census Geocoder** | Unlimited, no key | Free | Excellent for address→lat/lng+FIPS | ✅ Direct from browser, no CORS issues | ✅ **Mandatory addition.** Free, no key, reliable. ([Census docs](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html)) |
| **HUD FMR API** | Free with token | Free | County/ZIP-level; useful as rent sanity-check | Requires token → **needs proxy** | ✅ Add as Y1 rent floor reference ([HUD](https://www.huduser.gov/portal/datasets/fmr.html)) |
| **Hennepin GIS Open Data (ArcGIS)** | Free, no key | Free | Parcel boundaries, zoning, basic attrs | ✅ Direct | ✅ Add for Hennepin parcels ([Hennepin GIS](https://gis-hennepin.hub.arcgis.com/pages/open-data)) |
| **Ramsey County Open Data** | Free | Free | Similar | ✅ Direct | ✅ Add for Ramsey parcels |
| **Zillow (official)** | N/A — deprecated 2021-09-30 | Bridge Interactive enterprise | N/A | Not accessible | ❌ **Skip.** Don't build on deprecated APIs. ([ZillowR deprecation](https://rdrr.io/cran/ZillowR)) |
| **Zillow via RapidAPI (APIllow, Zillow-com1, etc.)** | 50/mo free | $10–$30/mo | Good but ToS risk — unofficial wrappers | Needs proxy | ⚠️ **Avoid for anything durable.** Legal gray zone. Use only for one-off comp checks. ([APIllow](https://apillow.co/)) |
| **Realtor.com via RapidAPI** | Varies | ~$10–$30/mo | OK listings; no valuations | Needs proxy | ⚠️ Same ToS risk as Zillow wrappers |
| **ATTOM Data** | None | $95/mo entry / often $500+ real usage | Excellent, authoritative | Needs proxy | ❌ **Overkill.** Pay-off only at 500+ analyses/mo. ([ATTOM](https://www.attomdata.com/); [HomeSage comparison](https://homesage.ai/homesage-ai-or-attom-data-when-to-use-each-real-estate-api/)) |
| **PropStream** | 7-day trial | $99/mo (no API) | Great data, **no public API** | N/A | ❌ Manual use only; can't integrate ([GetApp FAQ](https://www.getapp.com/real-estate-property-software/a/propstream/)) |
| **Redfin Data Center** | Free CSV downloads | N/A — no real-time API | Excellent macro data (median prices, DOM by zip) | ✅ CSV fetch | ✅ Use for monthly market intelligence refresh ([Redfin Data Center](https://www.redfin.com/news/data-center/)) |
| **Zillow Research (ZORI)** | Free CSV | Free | Excellent rent index by zip | ✅ CSV fetch | ✅ Use for rent-growth context ([Zillow Research](https://www.zillow.com/research/data/)) |
| **NorthstarMLS (IDX/API)** | N/A | ~$5/mo IDX fee + broker approval | Definitive TC data | Broker-level integration | ❌ **Not accessible** without agent license or broker sponsorship ([NorthstarMLS](https://northstarmls.com/licensed-agent-subscription-options/)) |
| **Mapbox** | 100K geocoding/mo free | $0.75/1K beyond | Good | Client-side OK | ⚠️ Unnecessary when Census is free |
| **Google Maps Geocoding** | $200/mo credit | $5/1K beyond | Best | Client-side OK with key | ⚠️ Overkill; has API key exposure |

### Recommended stack for Reese (v7.0)

**Free + mandatory (client-side, no backend):**
1. **US Census Geocoder** — address → lat/lng + state/county FIPS
2. **Hennepin/Ramsey GIS Open Data** — parcel attrs for TC deals
3. **Zillow Research CSVs** (fetched once on app load, cached in localStorage for 30 days) — for ZORI rent index by zip
4. **Redfin Data Center CSVs** (same caching strategy) — for median sale price by zip

**Paid tier (subscribe: $29/mo RentCast Starter):**
5. **RentCast** via Cloudflare Worker proxy — property records + rent estimates + comps. ROI math: if it prevents ONE bad offer (e.g., overpaying by $10K), it's paid for itself for 28 years. ([RentCast API help](https://help.rentcast.io/en/articles/7992900-rentcast-property-data-api))

**Optional (free, token-based):**
6. **HUD FMR API** via same Worker — sanity-check rent estimates against Section 8 fair market rents ([HUD FMR](https://www.huduser.gov/portal/datasets/fmr.html))

### Backend justification

You asked if a lightweight backend is acceptable "if strongly justified." **Yes, strongly justified** for exactly two reasons:

1. **API key hiding.** RentCast + HUD tokens can't be in client-side HTML if this tool ever leaves your personal iPad. Even if it doesn't, committing an HTML file with a key to iCloud/Dropbox/Git risks exposure.
2. **CORS.** Most of these APIs don't send `Access-Control-Allow-Origin: *`. Browser requests fail.

**Recommended: one Cloudflare Worker**, free tier (100K requests/day) ([Cloudflare Workers CORS proxy](https://developers.cloudflare.com/workers/examples/cors-header-proxy/); [Code-boost guide](https://code-boost.com/how-to-build-a-fast-free-api-proxy-that-just-works-using-cloudflare-workers/)). Deploy once, ~50 lines of code. This keeps the app *effectively* single-file (the HTML is the only thing you edit) while solving both problems. Code sketch below.

## Speed audit — where 3 minutes goes today (inferred v6.1)

| Step | Estimated time | Optimization |
|---|---|---|
| Enter address/zip | 15s | ✅ Keep — but add Census autocomplete/validation |
| Enter purchase price | 10s | **P1:** Auto-fill from RentCast property record |
| Enter unit count + beds/baths per unit | 45s | **P1:** Auto-fill unit count from RentCast; user confirms beds/baths |
| Estimate rent per unit | 60s | **P1:** Auto-fill from RentCast rent estimate + HUD FMR floor |
| Set loan terms (down %, rate, term) | 20s | Keep — or persist last-used in localStorage |
| Set expenses (tax, insurance, utilities) | 45s | **P1:** Auto-fill tax from homestead calculator using county+value; auto-fill insurance from MN median by property type |
| Review & save to journal | 25s | Keep |
| **Total today** | **~3:40** | **Target: ≤2:00 with auto-fetch** |

**The winning flow:** paste address → one button "Fetch Property Data" → 90% of fields populate → user confirms/overrides 2–3 fields → hits analyze. Under 2 minutes.

---

# PHASE 3 — SPEC + TARGETED CODE DIFFS

## Priority Ordering

- **P0 (critical framework gaps — do these first):** Y1/Y2 dual timeline • FHA SST gate • MN homestead-aware tax • Reserves in Cash-to-Close • True Housing Cost metric
- **P1 (speed wins):** Census geocoder integration • Cloudflare Worker for RentCast • Auto-populate from RentCast record • Quick Glance card redesign
- **P2 (nice-to-haves):** Redfin comp link • Zillow ZORI rent growth context • FEMA flood zone flag • Hennepin/Ramsey GIS parcel lookup

Everything below assumes your v6.1 uses a single state object (`state` or `deal` or similar) and vanilla JS / fetch. Adapt variable names to match your codebase.

---

## P0-1 — Dual Timeline (Y1 vs Y2+) Data Model

**Rationale:** Curelop's entire framework depends on this split. Without it, the Trench "true housing cost" can't be calculated, and the MAO solver is binding on the wrong target.

**Diff (data model):**

```javascript
// OLD — single-timeline state
const deal = {
  units: [{ rent: 1400 }, { rent: 1500 }],
  // ... other fields
};

function grossMonthlyRent() {
  return deal.units.reduce((s, u) => s + u.rent, 0);
}
```

```javascript
// NEW — dual timeline
const deal = {
  units: [
    { rent: 1400, ownerOccupied: true },    // Y1: owner lives here, rent = 0
    { rent: 1500, ownerOccupied: false }
  ],
  ownerUnitUtilitiesMonthly: 280,  // MN default: heat+elec+water owner-paid for own unit in Y1
  ownerMarketRentAlternative: 1500, // what Reese would pay to rent a comparable place elsewhere
  // ... other fields
};

function grossMonthlyRent(mode) {
  // mode: 'Y1' | 'Y2'
  return deal.units.reduce((s, u) => {
    if (mode === 'Y1' && u.ownerOccupied) return s;
    return s + u.rent;
  }, 0);
}

function trueHousingCost() {
  const piti = monthlyPITI();
  const reserves = monthlyReserves();
  const y1Rent = grossMonthlyRent('Y1');
  const ownerUtil = deal.ownerUnitUtilitiesMonthly || 0;
  return piti + ownerUtil + reserves - y1Rent;
  // Negative = cash-flowing while living free (Trench ideal)
  // Zero = "live free"
  // Positive = out-of-pocket but likely still beats renting
}

function monthlyCashFlow(mode) {
  const rent = grossMonthlyRent(mode);
  const opEx = operatingExpenses(mode);  // note: opEx differs Y1 vs Y2 (owner-unit mgmt fee kicks in Y2)
  const piti = monthlyPITI();
  return rent - opEx - piti;
}
```

**UI note:** Every number on the results screen should have a small **Y1 | Y2** toggle that defaults to showing both side-by-side at desk, but collapses to Y1 on mobile in-field view.

---

## P0-2 — FHA Self-Sufficiency Test Gate

**Rationale:** For 3–4 unit FHA deals this is a lender-mandatory test. Without it, Reese could waste 2 weeks and a $500 inspection on a property the lender will never approve.

**Diff:**

```javascript
// ADD — new gate function
function fhaSelfSufficiencyTest() {
  if (deal.units.length < 3) {
    return { applicable: false, label: 'N/A (duplex exempt)' };
  }
  // HUD uses 75% of appraiser's market rents (per 2026 guidance).
  // Some older sources cite 85%; we surface both as warnings.
  const grossMarketRent = deal.units.reduce((s, u) => s + u.rent, 0);
  const netRent75 = grossMarketRent * 0.75;
  const piti = monthlyPITI(); // INCLUDES taxes, insurance, MIP, HOA
  const pass = netRent75 >= piti;
  return {
    applicable: true,
    pass,
    netRent75,
    piti,
    margin: netRent75 - piti,
    label: pass ? `PASS (+$${Math.round(netRent75 - piti)}/mo)` 
                 : `FAIL (-$${Math.round(piti - netRent75)}/mo)`,
    note: 'HUD 75% rule; appraiser may apply different factor. Verify with lender.'
  };
}
```

**UI placement:** Prominent red/green badge in the Loan section AND in the Quick Glance card (cell 4, alongside DSCR).

Sources: [Mortgage Research 2026 FHA SST](https://www.mortgageresearch.com/articles/fha-self-sufficiency-test/), [Newcastle Loans](https://www.newcastle.loans/mortgage-guide/fha-self-sufficiency-3-4-unit).

---

## P0-3 — MN Homestead-Aware Property Tax

**Rationale:** Per MN Stat. 273.13, a duplex or triplex with owner-occupied unit gets **full homestead treatment on the whole property** (class 1a: 1.00% first $500K, 1.25% above). A fourplex does NOT — only the owner's share is homesteaded. Your current tax calc likely applies one flat rate, mis-estimating by 10–20%.

**Diff:**

```javascript
// OLD
function propertyTaxAnnual() {
  return deal.purchasePrice * 0.0117; // flat Hennepin avg
}
```

```javascript
// NEW — MN-aware
function mnPropertyTaxAnnual() {
  const v = deal.purchasePrice;
  const units = deal.units.length;
  const ownerOccupied = deal.units.some(u => u.ownerOccupied);
  const county = deal.county || 'hennepin';
  
  // 2026 approximate composite local tax rates (verify annually):
  const LOCAL_RATES = {
    hennepin: 1.17,   // multiplier on tax capacity
    ramsey:   1.28,
    dakota:   1.05,
    anoka:    1.12,
    washington: 1.08,
    scott:    1.06,
    carver:   1.04,
  };
  const localRate = LOCAL_RATES[county] || 1.15;
  
  // Class rates (2026):
  // Class 1a (homestead residential): 1.00% up to $500K, 1.25% above
  // Class 4b/4bb/4d (non-homestead residential): 1.25%
  
  let taxCapacity = 0;
  
  if (!ownerOccupied) {
    // Pure rental: 100% non-homestead @ 1.25%
    taxCapacity = v * 0.0125;
  } else if (units <= 3) {
    // MN Stat 273.13: duplex/triplex with owner occupying = whole property homestead
    // Apply homestead market value exclusion (~$38K on first $100K of value; see MN House Research)
    const hmvExclusion = Math.max(0, Math.min(38000, 38000 - 0.09 * Math.max(0, v - 100000)));
    const taxableValue = Math.max(0, v - hmvExclusion);
    const tier1 = Math.min(500000, taxableValue) * 0.01;
    const tier2 = Math.max(0, taxableValue - 500000) * 0.0125;
    taxCapacity = tier1 + tier2;
  } else {
    // Quad: owner's unit share homesteaded (class 1a), rest non-homestead (class 4)
    const ownerShare = 1 / units; // assumes equal unit value; refine with per-unit valuation if available
    const homesteadedValue = v * ownerShare;
    const nonHomesteadValue = v - homesteadedValue;
    const hmvExclusion = Math.max(0, Math.min(38000, 38000 - 0.09 * Math.max(0, homesteadedValue - 100000)));
    const taxableHomesteaded = Math.max(0, homesteadedValue - hmvExclusion);
    const tier1 = Math.min(500000, taxableHomesteaded) * 0.01;
    const tier2 = Math.max(0, taxableHomesteaded - 500000) * 0.0125;
    taxCapacity = tier1 + tier2 + nonHomesteadValue * 0.0125;
  }
  
  return taxCapacity * localRate;
}
```

Sources for the statute and rate structure: [MN Stat. 273.13](https://www.revisor.mn.gov/statutes/cite/273.13), [MN Revenue Module 3](https://www.revenue.state.mn.us/sites/default/files/2026-01/module-3-classification-property.pdf), [MN House Research property tax 101](https://www.house.mn.gov/hrd/pubs/ss/ssptvart.pdf), [AskDoss 2026 MN property tax](https://askdoss.com/minnesota-property-tax-system-explained-what-homebuyers-need-to-know/), [Hennepin 2026 levy](https://hennepincountypropertysearch.com/hennepin-county-property-tax/).

**Caveats to surface in UI:** (1) Local composite rates vary by city/school district within county, sometimes by 20%+; treat this as an estimate with "verify at [county assessor link]". (2) Homestead status requires owner filing; add a line note. (3) 2026 levy increases (Hennepin +7.79%) are already baked into the 2026 rate estimate but this will shift next year.

---

## P0-4 — Reserves in Cash-to-Close

**Rationale:** Curelop's $250/mo example and all 2026 DSCR lender guidelines require explicit reserves.

**Diff:**

```javascript
// OLD
function cashToClose() {
  return deal.downPayment + deal.closingCosts + (deal.rehab || 0);
}
```

```javascript
// NEW
function cashToClose() {
  return deal.downPayment + deal.closingCosts + (deal.rehab || 0);
}

function pitiaMonthly() {
  return monthlyPITI() + (deal.hoaMonthly || 0) + (deal.landlordInsuranceMonthly || 0);
}

function requiredReservesMonths() {
  // FHA: 1-2 mo typical; conventional 2-4 unit: 6 mo; DSCR: 3-6 mo
  const path = deal.loanType || 'fha';
  if (path === 'fha' && deal.units.length <= 2) return 1;
  if (path === 'fha' && deal.units.length >= 3) return 3; // HUD requires 3 for 3-4 unit FHA
  if (path === 'conventional') return 6;
  if (path === 'dscr') return 6;
  return 3;
}

function reservesRequired() {
  return pitiaMonthly() * requiredReservesMonths();
}

function cashNeededTotal() {
  return cashToClose() + reservesRequired();
}

function cashOnCash(mode) {
  // IMPORTANT: use cashNeededTotal for denominator, not cashToClose
  // This is the BiggerPockets-canonical approach (Turner, Ch. 5)
  const annualCashFlow = monthlyCashFlow(mode) * 12;
  return (annualCashFlow / cashNeededTotal()) * 100;
}
```

Sources: [DSCR Calculator 2026 reserves](https://blog.dscrcalculator.mortgage/dscr-loan-requirements-2026), [1st Nationwide Mortgage](https://www.1stnwm.com/blog/dscr-loan-requirements-2026-complete-guide/), [Curelop's $250/mo reserve example](https://www.bestevercre.com/podcast/1260-biggerpockets-analyst-tells-us-his-life-hacking-story-with-craig-curelop).

---

## P0-5 — MAO Solver: Multi-Constraint Minimum

**Rationale:** Current v6.1 likely solves MAO for one target (e.g., target CoC). House-hackers face multiple binding constraints and the true MAO is the minimum of all of them.

**Diff:**

```javascript
// NEW — multi-constraint MAO
function solveMAO() {
  const constraints = [
    {
      name: 'Target Y1 True Housing Cost ≤ $0 (Trench)',
      solve: () => binarySearchPrice(p => {
        deal.purchasePrice = p;
        return trueHousingCost() <= 0;
      })
    },
    {
      name: 'Target Y2 CoC ≥ 10% (Turner)',
      solve: () => binarySearchPrice(p => {
        deal.purchasePrice = p;
        return cashOnCash('Y2') >= 10;
      })
    },
    {
      name: 'Target DSCR ≥ 1.0 @ Y2 (lender)',
      solve: () => binarySearchPrice(p => {
        deal.purchasePrice = p;
        return dscr('Y2') >= 1.0;
      })
    }
  ];
  
  if (deal.units.length >= 3 && deal.loanType === 'fha') {
    constraints.push({
      name: 'FHA Self-Sufficiency Test',
      solve: () => binarySearchPrice(p => {
        deal.purchasePrice = p;
        return fhaSelfSufficiencyTest().pass;
      })
    });
  }
  
  const results = constraints.map(c => ({ ...c, maoPrice: c.solve() }));
  const binding = results.reduce((min, r) => r.maoPrice < min.maoPrice ? r : min, results[0]);
  
  return { allConstraints: results, binding, maoPrice: binding.maoPrice };
}
```

**UI:** Show binding constraint name alongside the MAO number in Quick Glance.

Sources: [New Silver MAO formula](https://newsilver.com/the-lender/what-is-mao-in-real-estate/), [Real Estate Skills](https://www.realestateskills.com/blog/mao-formula).

---

## P1-1 — Census Geocoder + Parallel Data Fetch

**Rationale:** Free, no key, unlimited, no CORS issues for the one-line address endpoint.

**Diff (add this as a new `<script>` block):**

```javascript
async function geocodeCensus(address) {
  // Example: "1234 Elm St, Minneapolis, MN 55408"
  const url = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'
    + '?address=' + encodeURIComponent(address)
    + '&benchmark=Public_AR_Current'
    + '&vintage=Current_Current'
    + '&format=json';
  const r = await fetch(url);
  const j = await r.json();
  const match = j.result?.addressMatches?.[0];
  if (!match) throw new Error('Address not found');
  return {
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    zip: match.addressComponents.zip,
    state: match.addressComponents.state,
    county: match.geographies?.['Counties']?.[0]?.BASENAME?.toLowerCase(),
    countyFips: match.geographies?.['Counties']?.[0]?.COUNTY,
    tract: match.geographies?.['Census Tracts']?.[0]?.TRACT,
    matchedAddress: match.matchedAddress
  };
}
```

[Census Geocoder API docs](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) — works directly from browser, no key needed.

---

## P1-2 — Cloudflare Worker Proxy for RentCast + HUD

**Deploy once, ~60 lines:**

```javascript
// worker.js — deploy to Cloudflare Workers (free tier: 100K req/day)
const RENTCAST_KEY = RENTCAST_API_KEY;  // set via wrangler secret
const HUD_TOKEN    = HUD_API_TOKEN;

const ALLOWED_ORIGINS = [
  'https://reese.local',
  'null',                     // file:// in iOS Safari
  'https://your-custom.page'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || 'null';
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    
    try {
      let upstream, headers = {};
      if (url.pathname.startsWith('/rentcast/')) {
        upstream = 'https://api.rentcast.io/v1/' + url.pathname.slice(10) + url.search;
        headers['X-Api-Key'] = env.RENTCAST_API_KEY;
      } else if (url.pathname.startsWith('/hud/')) {
        upstream = 'https://www.huduser.gov/hudapi/public/' + url.pathname.slice(5) + url.search;
        headers['Authorization'] = 'Bearer ' + env.HUD_API_TOKEN;
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
      }
      
      const r = await fetch(upstream, { headers });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: { ...corsHeaders(origin), 'content-type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, headers: corsHeaders(origin) 
      });
    }
  }
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
```

**Client-side usage:**

```javascript
const PROXY = 'https://yourname-proxy.yourname.workers.dev';

async function fetchPropertyData(address) {
  const geo = await geocodeCensus(address);
  
  // Parallel fetch — this is the 3-min trick
  const [rentcastProp, rentcastRentEstimate, hudFmr] = await Promise.all([
    fetch(`${PROXY}/rentcast/properties?address=${encodeURIComponent(address)}`).then(r => r.json()),
    fetch(`${PROXY}/rentcast/avm/rent/long-term?address=${encodeURIComponent(address)}&propertyType=Multi-Family&bedrooms=2&bathrooms=1`).then(r => r.json()),
    fetch(`${PROXY}/hud/fmr/data/${geo.state}${geo.countyFips}99999?year=2026`).then(r => r.json())
  ]);
  
  return {
    geo,
    purchasePrice: rentcastProp?.[0]?.lastSalePrice,
    yearBuilt: rentcastProp?.[0]?.yearBuilt,
    squareFootage: rentcastProp?.[0]?.squareFootage,
    assessedValue: rentcastProp?.[0]?.taxAssessments?.value,
    estimatedRent: rentcastRentEstimate?.rent,
    rentLow: rentcastRentEstimate?.rentRangeLow,
    rentHigh: rentcastRentEstimate?.rentRangeHigh,
    hudFmrFloor2br: hudFmr?.data?.basicdata?.[0]?.['Two-Bedroom']
  };
}
```

Deploy the Worker with `wrangler`, store keys with `wrangler secret put RENTCAST_API_KEY`. Sources: [Cloudflare Workers CORS example](https://developers.cloudflare.com/workers/examples/cors-header-proxy/), [Code-boost proxy guide](https://code-boost.com/how-to-build-a-fast-free-api-proxy-that-just-works-using-cloudflare-workers/), [Eastondev 5-min guide](https://eastondev.com/blog/en/posts/dev/20251201-workers-api-proxy/), [RentCast API docs](https://help.rentcast.io/en/articles/7992900-rentcast-property-data-api).

---

## P1-3 — Quick Glance Card (Final Design)

### The 5 metrics, justified

Based on Curelop (primary framing for house hacks), Trench (eliminate housing expense), Turner (CoC benchmark), and lender reality (DSCR + FHA SST):

1. **🏠 TRUE HOUSING COST (Y1)** — the number Reese actually feels every month, including reserves. Trench framing. *This is the biggest, always.*
2. **💵 CASH FLOW Y2+** — the number after he moves out. Curelop "does this become a keeper?" test.
3. **📈 COC Y2** — Turner benchmark. Color: ≥12% green, 8–12% yellow, <8% red.
4. **🏦 LENDER GATES** — compound cell showing DSCR Y2 + FHA SST pass/fail (only SST shows for 3-4 unit FHA).
5. **🎯 MAO Δ** — dollar delta of listing price vs solved MAO. Negative = overpriced by $X; positive = room to offer below.

Metrics **demoted** from Quick Glance to secondary "Sanity Checks" strip (always visible below, smaller): 1% rule, 50% rule, cap rate, GRM, break-even rent. These are screening tools per Turner's own framing, not decision tools.

### Visual spec

```
┌────────────────────────────────────────────────────────────────┐
│ 1234 Elm St, Minneapolis 55408  •  Duplex • Owner: Unit 1      │
│ List $385,000   [⟳ refresh]   [💾 save to journal]             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   TRUE HOUSING COST (Y1)                                       │
│     −$125 /mo    ← large, 48pt, green (negative = great)      │
│   You pay $125/mo LESS than living free                        │
│                                                                │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Y2 CASH FLOW    │  Y2 COC          │  LENDER GATES            │
│  +$842/mo  ✅    │  14.2%  ✅        │  DSCR 1.31 ✅ SST: N/A   │
├──────────────────┴──────────────────┴──────────────────────────┤
│  MAO Δ:  −$12,000 (list $385K vs MAO $373K)  ⚠️                │
├────────────────────────────────────────────────────────────────┤
│  Sanity Checks:                                                │
│  1% rule 0.78% (below, typical TC) •  50% rule +$320 •         │
│  Cap 6.2% •  GRM 10.7 •  BE-rent $2,890                        │
├────────────────────────────────────────────────────────────────┤
│  Verdict: LIVE-FREE DEAL, slight overpay. Offer $372K?        │
│  [one-line sentence, bold]                                     │
└────────────────────────────────────────────────────────────────┘
```

### One-view-fits-all behavior

- **In-field (iPhone, <500px):** Top metric full-width, 3 middle cells stack vertically, sanity strip collapses to a "tap to expand" chip. Everything still readable one-handed.
- **At-desk (iPad+, ≥768px):** Full layout as above, all metrics inline. Hover any metric to see its formula tooltip.
- **Single CSS rule:** `@media (max-width: 600px)` — no runtime JS to swap views.

### Verdict sentence logic

```javascript
function verdict() {
  const thc = trueHousingCost();
  const y2cf = monthlyCashFlow('Y2');
  const y2coc = cashOnCash('Y2');
  const mao = solveMAO().maoPrice;
  const delta = deal.purchasePrice - mao;
  const sst = fhaSelfSufficiencyTest();
  
  if (sst.applicable && !sst.pass) {
    return `❌ FHA WON'T APPROVE — SST fails by $${Math.abs(sst.margin)}/mo. Need $${Math.round(-sst.margin*4/3)}/mo more gross rent or different loan.`;
  }
  if (thc <= 0 && y2coc >= 10 && delta <= 0) {
    return `✅ STRONG DEAL — live free Y1, ${y2coc.toFixed(1)}% CoC Y2, priced below MAO. Offer at or near list.`;
  }
  if (thc <= 0 && delta > 0) {
    return `⚠️ LIVE-FREE DEAL, slight overpay. Offer $${Math.round((mao-2000)/1000)*1000}?`;
  }
  if (thc <= 300 && y2coc >= 8) {
    return `⚠️ MARGINAL HOUSE HACK — out-of-pocket $${Math.round(thc)}/mo Y1, but ${y2coc.toFixed(1)}% CoC once you move out.`;
  }
  if (thc > 500) {
    return `❌ EXPENSIVE — paying $${Math.round(thc)}/mo to live here is worse than renting a comparable apartment.`;
  }
  return `Neutral — run the full analysis and compare to 2 other deals.`;
}
```

### Code diff for the card HTML

```html
<!-- OLD: whatever grid of tiles you have -->

<!-- NEW: Quick Glance card -->
<section class="glance" aria-label="Quick Glance">
  <header class="glance-head">
    <span class="addr" id="glance-addr">—</span>
    <span class="meta" id="glance-meta">—</span>
    <span class="price" id="glance-price">—</span>
  </header>
  
  <div class="glance-primary" id="glance-thc">
    <label>TRUE HOUSING COST (Y1)</label>
    <div class="big" id="glance-thc-value">—</div>
    <div class="sub" id="glance-thc-explain">—</div>
  </div>
  
  <div class="glance-row">
    <div class="cell" id="glance-y2cf">
      <label>Y2 CASH FLOW</label>
      <div class="med" id="glance-y2cf-value">—</div>
    </div>
    <div class="cell" id="glance-y2coc">
      <label>Y2 CoC</label>
      <div class="med" id="glance-y2coc-value">—</div>
    </div>
    <div class="cell" id="glance-gates">
      <label>LENDER GATES</label>
      <div class="med" id="glance-gates-value">—</div>
    </div>
  </div>
  
  <div class="glance-mao" id="glance-mao">
    <label>MAO Δ</label>
    <span id="glance-mao-value">—</span>
  </div>
  
  <div class="glance-sanity">
    <span>1% <b id="s-1pct">—</b></span>
    <span>50% <b id="s-50pct">—</b></span>
    <span>Cap <b id="s-cap">—</b></span>
    <span>GRM <b id="s-grm">—</b></span>
    <span>BE-rent <b id="s-be">—</b></span>
  </div>
  
  <div class="glance-verdict" id="glance-verdict">—</div>
</section>

<style>
  .glance { background: var(--card); border-radius: 12px; padding: 16px; }
  .glance-head { display:flex; justify-content:space-between; font-size:13px; opacity:.8; margin-bottom:12px; }
  .glance-primary { text-align:center; padding:12px 0 16px; border-bottom:1px solid var(--border); }
  .glance-primary .big { font-size: 48px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .glance-primary .sub { font-size: 13px; opacity: .75; }
  .glance-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:12px 0; border-bottom:1px solid var(--border); }
  .glance-row .cell { text-align:center; }
  .glance-row .med { font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .glance-row label, .glance-primary label { font-size: 10px; letter-spacing:1px; opacity:.6; display:block; margin-bottom:4px; }
  .glance-mao { padding:12px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:baseline; }
  .glance-sanity { display:flex; flex-wrap:wrap; gap:12px; font-size:12px; padding:12px 0; opacity:.85; }
  .glance-verdict { padding-top:12px; font-weight:600; line-height:1.4; }
  .pos { color: var(--green); }
  .neg { color: var(--red); }
  .warn { color: var(--amber); }
  @media (max-width: 600px) {
    .glance-primary .big { font-size: 36px; }
    .glance-row { grid-template-columns:1fr; gap:4px; }
    .glance-row .cell { display:flex; justify-content:space-between; text-align:left; padding:6px 8px; border-radius:6px; background:var(--card-alt); }
    .glance-row .med { font-size: 18px; }
    .glance-sanity { gap:8px; font-size:11px; }
  }
</style>
```

### Color rules

- **Green:** THC ≤ $0, or Y2 CoC ≥ 10%, or DSCR ≥ 1.25, or MAO Δ ≤ $0
- **Amber:** THC $0–$500, or Y2 CoC 6–10%, or DSCR 1.0–1.25, or MAO Δ $0–$5K
- **Red:** THC > $500, or Y2 CoC < 6%, or DSCR < 1.0, or SST fails, or MAO Δ > $5K

---

## P1-4 — Auto-populate Flow (the 3-minute win)

**Diff to your existing entry form:**

```html
<!-- OLD -->
<input id="addr" placeholder="Address">
<input id="price" placeholder="Purchase price">
<input id="units" placeholder="# units">
<!-- ...many more fields... -->

<!-- NEW -->
<div class="quick-entry">
  <input id="addr" placeholder="1234 Elm St, Minneapolis, MN 55408" autocomplete="street-address">
  <button id="btn-fetch">⚡ Fetch & Analyze</button>
</div>
<details class="advanced">
  <summary>Advanced overrides</summary>
  <!-- all existing fields, but now pre-populated and editable -->
</details>
```

```javascript
document.getElementById('btn-fetch').addEventListener('click', async () => {
  const addr = document.getElementById('addr').value.trim();
  if (!addr) return;
  
  showSpinner('Fetching property data…');
  try {
    const data = await fetchPropertyData(addr);
    
    // Auto-populate
    deal.address = data.geo.matchedAddress;
    deal.county = data.geo.county || 'hennepin';
    deal.zip = data.geo.zip;
    deal.purchasePrice = data.purchasePrice || deal.purchasePrice;
    deal.yearBuilt = data.yearBuilt;
    deal.squareFootage = data.squareFootage;
    
    // Rent default: use RentCast mid-estimate, floored by HUD FMR
    const rentDefault = Math.max(data.estimatedRent || 0, data.hudFmrFloor2br || 0);
    if (rentDefault) {
      deal.units.forEach(u => u.rent = rentDefault);
    }
    
    // MN defaults
    if (deal.county in MN_COUNTY_RATES) {
      deal.propertyTaxAnnual = mnPropertyTaxAnnual();
      deal.insuranceAnnual = estimateMnInsurance(deal.purchasePrice, deal.units.length);
      deal.ownerUnitUtilitiesMonthly = 280; // MN heat default
      deal.lawnSnowAnnual = 600;
    }
    
    rerender();
    flashBadge(`Pre-filled from RentCast + Census. Verify highlighted fields.`);
  } catch (e) {
    flashBadge(`Error: ${e.message}. Fall back to manual entry.`, 'error');
  } finally {
    hideSpinner();
  }
});

function estimateMnInsurance(price, units) {
  // From Steadily + Clovered MN data: median $1,469, duplex $1,800-$2,800
  const base = 1500;
  const perUnit = 400;
  const valueFactor = Math.max(1, price / 300000);
  return Math.round((base + perUnit + units) * valueFactor);
}
```

Any field auto-populated gets a subtle blue border + tooltip "Auto-filled from RentCast — click to override." This is the Turner "Trust but verify" ethos.

---

## P2-1 — Redfin Comp Link (low-effort Greene win)

```javascript
function redfinCompLink() {
  const { lat, lng, zip } = deal.geo;
  // Redfin URL pattern supports radius + days-on-market filters
  return `https://www.redfin.com/zipcode/${zip}/filter/` +
         `property-type=multifamily,include=sold-3mo,radius=0.5`;
}
```

Render as a small "🔍 Sales comps (Redfin)" link below the price field.

---

## P2-2 — ZORI rent-growth context

Fetch `https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv` once on app load (cache 30 days in `localStorage`), filter to Reese's zip, and show "Rents in 55408 grew 3.8% in last 12mo (ZORI)" as a footer chip on Quick Glance. Source: [Zillow Research](https://www.zillow.com/research/data/).

---

## What to ship, in order

**Week 1 (P0, framework):**
1. Dual timeline data model + Y1/Y2 toggles on every result
2. FHA SST gate + badge
3. MN homestead-aware tax calculation
4. Reserves in Cash-to-Close + CoC denominator fix
5. True Housing Cost metric
6. New Quick Glance card replacing the existing results tiles

**Week 2 (P1, speed):**
7. Deploy Cloudflare Worker; move RentCast call behind it
8. Add Census geocoder + `fetchPropertyData()` parallel pipeline
9. Auto-populate UX with blue-border highlights
10. Update MAO solver to multi-constraint

**Week 3 (P2, polish):**
11. Redfin comp link button
12. ZORI rent-growth chip
13. FEMA flood zone flag (the Census geocode already returns coords; use `https://msc.fema.gov/arcgis/rest/...` — free, no key)
14. Default MN expense hints (lawn/snow, heat) pre-filled in MN mode

---

## Open questions for you (surface in UI as warnings, don't silently assume)

1. **2026 MN Housing Start Up income/purchase limits release:** HUD's 2026 AMI won't be published until May 1, 2026 ([Met Council notice](https://metrocouncil.org/Housing/Planning/Affordable-Housing-Measures/Ownership-and-Rent-Affordability-Limits.aspx)). Until then, v7.0 should use the 2025 limits with a visible "limits from [date]; verify at mnhousing.gov" tag.
2. **Local composite tax rates by city:** your MN_COUNTY_RATES is a county-level approximation. Minneapolis vs. Richfield vs. St. Louis Park can differ 15%. Add a "Specific city adjustment" slider (−20% to +20%) that persists per-deal.
3. **FHA SST haircut factor:** 2026 guidance centers on 75%; some lenders still apply the older 85% factor ([city-data post from older HUD guidance](https://city-data.com/blogs/blog36769-self-sufficiency-test-fha-loans-three.html); [Mortgage Research 2026 update](https://www.mortgageresearch.com/articles/fha-self-sufficiency-test/)). Make the factor a user setting (default 75%) with a note.

---

## One-paragraph summary to paste into your commit message

> v7.0 corrects four framework fidelity gaps: dual Y1/Y2 timeline modeling per Curelop, FHA 3–4 unit Self-Sufficiency Test gate, MN-homestead-aware property tax per Stat. 273.13, and reserves inside Cash-to-Close per Curelop + 2026 DSCR lender standards. Speed improvements: Census geocoder (free, no key) + RentCast via Cloudflare Worker proxy cut entry from ~3:40 to ~1:50. New Quick Glance card centers on Trench's True Housing Cost as the headline, with Y2 cash flow / CoC / lender gates / MAO Δ as supporting metrics and 1%/50%/cap/GRM/BE-rent demoted to a Sanity Checks strip. Single-file HTML preserved; Worker is the only backend component and runs on Cloudflare's free tier.