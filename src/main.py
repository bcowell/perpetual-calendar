import requests
from argparse import ArgumentParser
from scraper import scrape_events
from create_calendar import create_calendar

def get_dropdown_info():
    url = 'https://canlan2-api.sportninja.net/v1/schedules/JvdZbRKnsoK1pAQo/children/dropdown'
    response = requests.get(url, headers=headers)
    data = response.json()
    return data

def get_team_games(team_id):
    url = 'https://canlan2-api.sportninja.net/v1/schedules/pX6csL93cdmKbdGI/games'
    params = {
        'exclude_cancelled_games': 1,
        'team_id': team_id,
        'default': 1
    }
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    return data


def main(url):
    events = scrape_events(url)

    # dropdown_info = get_dropdown_info()
    # print("Dropdown info:")
    # print(dropdown_info)

    # # Assuming you have the team ID, you can use it to get the team's games
    # team_id = '5ePT0TQM2F9UN4rM'  # Replace with the actual team ID
    # team_games = get_team_games(team_id)
    # print("\nTeam games:")
    # print(team_games)


    # calendar_data = create_calendar(events)

    # Write calendar data to a file
    # with open('events.ics', 'wb') as f:
    #     f.write(calendar_data)

if __name__ == "__main__":
    parser = ArgumentParser(description='Scrape ASHL events to create a calendar.')
    parser.add_argument(
        '--url',
        default='https://www.ashl.ca/stats-and-schedules/ashl/etobicoke-summer/#/schedule/JvdZbRKnsoK1pAQo',
        help='URL of the website containing events'
    )
    args = parser.parse_args()

    main(args.url)
