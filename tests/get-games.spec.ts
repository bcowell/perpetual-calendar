import { test, expect } from "@playwright/test";
import ical from "ical-generator";
import fs from "fs";

test("grab auth token and fetch games through api", async ({ page }) => {
  const calendarName = "ASHL Big City Boys S24";
  const iCalFileName = "S24";
  const seasonUrl =
    "https://www.ashl.ca/stats-and-schedules/ashl/etobicoke-summer/#/schedule/JvdZbRKnsoK1pAQo";

  await page.goto(seasonUrl);

  const games = await page.evaluate(async () => {
    const schedulesUrl =
      "https://canlan2-api.sportninja.net/v1/organizations/F3iSbnnOrSALJPRs/schedules?sort=starts_at&direction=desc";
    const seasonDetailsUrl = (seasonId) =>
      `https://canlan2-api.sportninja.net/v1/schedules/${seasonId}/children/dropdown`;
    const gamesUrl = (conferenceId, teamId) =>
      `https://canlan2-api.sportninja.net/v1/schedules/${conferenceId}/games?exclude_cancelled_games=1&team_id=${teamId}&default=1`;

    async function sendRequest(url) {
      try {
        const bearerToken = localStorage.getItem("session_token_iframe");
        console.log(`fetching ${url}`);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
        });

        const responseBody = await res.json();
        console.log(responseBody);

        return responseBody?.data;
      } catch (err) {
        console.error(err);
      }
    }

    async function getGames(
      seasonName = "2024 Summer",
      teamName = "Big City Boys",
      dayOfWeek = "Monday"
    ) {
      const schedules = await sendRequest(schedulesUrl);
      const seasonId = schedules.find((item) => item.name === seasonName)?.id;

      // dropdown contains current season, conference and team division info. Including team id
      const currentSeasonDetailsUrl = seasonDetailsUrl(seasonId);
      const seasonDetails = await sendRequest(currentSeasonDetailsUrl);

      const conferenceId = seasonDetails
        .find((item) => item.name === "Conference")
        ?.schedules.find((s) => s.name === dayOfWeek)?.id;
      let teamId;

      // If your team, like ours, bounces around divisions. Find team across all divisions
      seasonDetails
        .find((item) => item.name === "Division")
        ?.schedules.forEach((division) => {
          division.teams?.forEach((team) => {
            if (team.name === teamName) {
              teamId = team.id;
            }
          });
        });

      const ourGamesUrl = gamesUrl(conferenceId, teamId);
      const games = await sendRequest(ourGamesUrl);

      return games;
    }

    return await getGames();
  });

  const calendar = ical({ name: calendarName });

  games.forEach((game) => {
    const gameId = game.id;
    // const timeZone = game.venue.timezone;
    const startTime = new Date(game.starts_at);
    const endTime = new Date(game.ends_at);
    const homeTeam = game.homeTeam.name;
    const visitingTeam = game.visitingTeam.name;
    const venue = game.venue.name;
    const facility = game.facility.name;
    const streetAddress = game.venue.address.street_1;
    const city = game.venue.address.city;
    const province = game.venue.address.province.iso_3166_2;
    const postalCode = game.venue.address.postal_code;
    const schedule = game.schedule.name;

    calendar.createEvent({
      id: gameId,
      start: startTime,
      end: endTime,
      summary: `${homeTeam} vs ${visitingTeam}`,
      location: `${venue}, ${streetAddress}, ${city}, ${province}, ${postalCode}`,
      description: `${facility}
${schedule}
Home: ${homeTeam}
Away: ${visitingTeam}`,
    });
  });

  fs.writeFile(`./ics/${iCalFileName}.ics`, calendar.toString(), (err) => {
    if (err) throw err;
  });

  expect(games).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        starts_at: expect.any(String),
      }),
    ])
  );
});
