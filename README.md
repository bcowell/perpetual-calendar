# ashl-calendar

# Setup

```
docker run -d --name selenium-chrome-container -p 4444:4444 selenium/standalone-chrome
```
docker run -d -p 4444:4444 -p 7900:7900 --shm-size="2g" selenium/standalone-firefox:4.19.1-20240402


```bash
python main.py --url <your_custom_url>
```

Hit api find schedules id for team
https://canlan2-api.sportninja.net/v1/organizations/F3iSbnnOrSALJPRs/schedules?sort=starts_at&direction=desc
data, find by name "2024 Summer", get id JvdZbRKnsoK1pAQo

API
dropdown contains current season, conference and team division info. Including team id
https://canlan2-api.sportninja.net/v1/schedules/JvdZbRKnsoK1pAQo/children/dropdown

Can query games for our team by id
https://canlan2-api.sportninja.net/v1/schedules/pX6csL93cdmKbdGI/games?exclude_cancelled_games=1&team_id=5ePT0TQM2F9UN4rM&default=1


donwload web driver
https://github.com/mozilla/geckodriver/releases

# TODO
- Just a link to create/subscribe to a calendar
- Github action that fires weekly to update the events

# IDEAS
- whatsapp bot to post N days before game. Ask for attendance post previous W/L

# Resources
- Basic introduction to scraping https://github.com/davidteather/everything-web-scraping/tree/main
- Setting up codespaces https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-python-project-for-codespaces