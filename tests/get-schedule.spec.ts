import { test, expect } from "@playwright/test";
import { parse, isValid, format } from "date-fns";
import { v4 as uuid } from "uuid";
import ical from "ical-generator";
import fs from "fs";
import 'dotenv/config';
import { spiritByTeam, spiritLine } from "./spirit";

const apiBaseUrl = "https://data.perpetualmotion.org/web-app/api";

// Placeholder team used by the API for practice slots
const PLACEHOLDER_TEAM_ID = 1;

// Some leagues leave weekDate blank and only send a label like
// "Tuesday, November 3". The label has no year, so use the year whose weekday
// matches, closest to today (seasons can run past New Year).
const resolveWeekDate = (week: any) => {
  if (week.weekDate) return week.weekDate;

  const [weekday, monthDay] = String(week.dateLabel).split(", ");
  const thisYear = new Date().getFullYear();
  const candidates = [thisYear - 1, thisYear, thisYear + 1]
    .map((year) => parse(`${monthDay} ${year}`, "MMMM d yyyy", new Date()))
    .filter((date) => isValid(date) && format(date, "EEEE") === weekday)
    .sort((a, b) => Math.abs(a.getTime() - Date.now()) - Math.abs(b.getTime() - Date.now()));

  if (!candidates.length) {
    throw new Error(`Could not work out a date for ${week.weekLabel} from "${week.dateLabel}"`);
  }
  return format(candidates[0], "yyyy-MM-dd");
};

test("find schedule and create .ics", async ({ request }) => {
  const scheduleUrl =
    process.env.SCHEDULE_URL ||
    "https://perpetualmotion.org/3-pitch-schedules-and-standings/";
  const teamName = process.env.TEAM_NAME || "McGlovin";
  const dayOfWeek = process.env.DAY_OF_WEEK || "Wednesday";
  const calendarName = process.env.CALENDAR_NAME || "McGlovin 3 Pitch";
  const iCalFileName = process.env.ICAL_FILE_NAME || "mcglovin";

  // Every season/league/team across all sports. Teams are re-created with a new
  // id each season, so our team has to be looked up by name every run.
  const seasonsResponse = await request.get(`${apiBaseUrl}/schedules-standings`);
  expect(
    seasonsResponse.ok(),
    `schedules-standings returned ${seasonsResponse.status()}`
  ).toBeTruthy();
  const seasons = await seasonsResponse.json();

  let league: any;
  let team: any;

  // Each season contains an array of leagues.
  // The day of the week separates teams that share a name across leagues.
  seasons.forEach((season: any) => {
    season.leagues.forEach((division: any) => {
      if (division.weekday !== dayOfWeek) return;
      (division.teams || []).forEach((candidate: any) => {
        if (candidate.name.trim() === teamName) {
          league = division;
          team = candidate;
        }
      });
    });
  });

  if (!team) {
    throw new Error(`Could not find team ID for ${teamName} on ${dayOfWeek}`);
  }

  // The league schedule holds every week's matches plus the venue.
  const scheduleResponse = await request.get(
    `${apiBaseUrl}/schedules-standings/schedule/${league.id}`
  );
  expect(
    scheduleResponse.ok(),
    `schedule/${league.id} returned ${scheduleResponse.status()}`
  ).toBeTruthy();
  const { weeks, venues } = await scheduleResponse.json();

  // Current spirit averages for every team in the league. Optional: a failed
  // request leaves spirit out of the notes rather than failing the calendar.
  const standingsResponse = await request.get(
    `${apiBaseUrl}/schedules-standings/standings/${league.id}`
  );
  const spirit = spiritByTeam(
    standingsResponse.ok() ? await standingsResponse.json().catch(() => null) : null
  );
  if (!standingsResponse.ok()) {
    console.log(`standings/${league.id} returned ${standingsResponse.status()}; leaving spirit out`);
  }
  const spiritReadAt = new Date();

  const venuesById = new Map<number, any>(
    (venues || []).map((venue: any) => [venue.id, venue])
  );

  const teamScheduleHeading = `${team.name} - ${league.name} - ${league.weekday}`;

  let games: Array<any> = [];

  (weeks || []).forEach((week: any) => {
    (week.matches || []).forEach((match: any) => {
      // teamOne is the home/dark side, teamTwo the away/light side.
      const isHomeTeam = match.teamOneID === team.id;
      const isAwayTeam = match.teamTwoID === team.id;

      // Skips other teams' games, and playoff weeks where both sides are still
      // placeholders ("1st" vs "4th") rather than real teams.
      if (!isHomeTeam && !isAwayTeam) return;

      const opponentId = isHomeTeam ? match.teamTwoID : match.teamOneID;
      const opponentName = isHomeTeam ? match.teamTwoName : match.teamOneName;
      const venue = venuesById.get(match.venueID);

      const game = {
        id: uuid(),
        week: week.weekLabel,
        startTime: parse(
          `${resolveWeekDate(week)} ${match.time}`,
          "yyyy-MM-dd h:mm a",
          new Date()
        ),
        opponent:
          opponentId === PLACEHOLDER_TEAM_ID ? "Practice" : opponentName.trim(),
        opponentId: opponentId === PLACEHOLDER_TEAM_ID ? null : opponentId,
        field: (venue?.name || "").trim(),
        fieldHref: venue?.mapsLink || "",
        isHomeTeam,
        isAwayTeam,
      };
      console.log(game);
      games.push(game);
    });
  });

  const calendar = ical({ name: calendarName });

  games.forEach((game) => {
    const gameId = game.id;
    const startTime = new Date(game.startTime);
    let endTime = new Date(game.startTime);

    if (scheduleUrl.includes("ultimate")) {
      endTime.setMinutes(endTime.getMinutes() + 45);
    } else if (scheduleUrl.includes("pickleball")) {
      endTime.setMinutes(endTime.getMinutes() + 30);
    } else {
      endTime.setHours(endTime.getHours() + 1);
      endTime.setMinutes(endTime.getMinutes() + 30);
    }

    const homeTeam = game.isHomeTeam ? teamName : game.opponent;
    const visitingTeam = game.isAwayTeam ? teamName : game.opponent;
    const field = game.field;
    const fieldGoogleMapsHref = game.fieldHref;
    const spiritNote = spiritLine(
      spirit,
      { id: team.id, name: teamName },
      game.opponentId ? { id: game.opponentId, name: game.opponent } : null,
      spiritReadAt
    );

    calendar.createEvent({
      id: gameId,
      start: startTime,
      end: endTime,
      summary: `${homeTeam} vs ${visitingTeam}`,
      location: field,
      description: `${teamScheduleHeading}
  Home: ${homeTeam}
  Away: ${visitingTeam}${spiritNote ? `\n  ${spiritNote}` : ""}
  ${fieldGoogleMapsHref}`,
    });
  });

  fs.writeFileSync(`./ics/${iCalFileName}.ics`, calendar.toString());

  expect(
    games.length,
    `No games found for ${teamName} on ${dayOfWeek} in league ${league?.id}`
  ).toBeGreaterThan(0);

  expect(games.every((game) => isValid(game.startTime))).toBe(true);
});
