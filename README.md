# perpetual-calendar

Creates a subscribable .ics calendar that is auto-updated with events by scraping the perpetual motion's schedule for weekly games.

# Details

Uses [playwright](https://playwright.dev/docs/intro) to open a headless browser. Grabs an auth token from localStorage, crafts some API requests to fetch upcoming games. Dumps the games as events in an .ics.
Runs on a weekly cron schedule that updates the .ics file through github-actions.

# Setup

`npm i` or `yarn`

Run the scraper and create an .ics

```
npx playwright test get-games
```

# IDEAS

- whatsapp bot to post N days before game. Ask for attendance
- post previous W/L
