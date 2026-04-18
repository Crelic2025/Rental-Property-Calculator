# Changelog — v6.1

**Released:** 2026-04-17

## New Features

### Statewide MN Market Intelligence
- Added database of 17 Minnesota submarkets with 2026 rent data
- Zip-based auto-detection: enter a zip code and the calculator selects the closest market automatically
- Manual override dropdown to switch markets independently of zip
- Nearest-zip fallback for zip codes not explicitly in the database

### Rent Confidence Signals
- Verified vs. interpolated rent flags shown on unit chips and range bars
- Market banner displays the active market name and a confidence signal (verified / interpolated / estimated)

### Deal Record Improvements
- Saved deal records now store the selected market at the time of analysis
- Enables apples-to-apples comparison when reviewing past deals

## Files Changed
- `index.html` — all changes are self-contained in the single-file app

## Previous Version
See [v5.0 notes in README.md](README.md#version-history)
