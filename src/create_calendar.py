from icalendar import Calendar, Event

def create_calendar(events):
    cal = Calendar()
    cal.add('prodid', '-//My Events Calendar//example.com//')
    cal.add('version', '2.0')

    for event in events:
        event_obj = Event()
        event_obj.add('summary', event['title'])
        event_obj.add('dtstart', event['date'])
        event_obj.add('dtend', event['date'])  # Assuming events are single-day

        cal.add_component(event_obj)

    return cal.to_ical()
