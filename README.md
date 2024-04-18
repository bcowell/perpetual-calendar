# ashl-calendar

# Setup

Inside that directory, you can run several commands:

npx playwright test
Runs the end-to-end tests.

npx playwright test --ui
Starts the interactive UI mode.

npx playwright test example
Runs the tests in a specific file.

npx playwright test --debug
Runs the tests in debug mode.

npx playwright codegen
Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test

Visit https://playwright.dev/docs/intro for more information. ✨

## Help

If you want to view selenium runners the password is `secret`

# What the scraper does

1. Go to https://www.ashl.ca/stats-and-schedules/ashl/etobicoke-summer/#/org/F3iSbnnOrSALJPRs
2. Click current season ex. "2024 Summer"
3. Filter > type in team name
4. For each events > date, time, Home/Away teams, rink #

# TODO

- Just a link to create/subscribe to a calendar
- Github action that fires weekly to update the events

# IDEAS

- whatsapp bot to post N days before game. Ask for attendance post previous W/L

# Resources

- Basic introduction to scraping https://github.com/davidteather/everything-web-scraping/tree/main
- Setting up codespaces https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-python-project-for-codespaces
