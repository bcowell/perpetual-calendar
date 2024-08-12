# perpetual-calendar

Creates a subscribable .ics calendar with events by scraping the perpetual motion's schedule for weekly games.

# Details

Uses [playwright](https://playwright.dev/docs/intro) to open a headless browser.
Lookup team internal id to query the API and parse HTML response to then dump the games as events in an .ics.
Runs manually through github-actions.

Subscribe to a specific calendar by going to https://github.com/bcowell/perpetual-calendar/raw/main/ics/CALENDAR.ics

Substituting in your calendar filename.

# Setup

`npm i` or `yarn`

Run the scraper and create an .ics

```
npx playwright test get-schedule
```

# IDEAS

- whatsapp bot to post N days before game. Ask for attendance
- post previous W/L
