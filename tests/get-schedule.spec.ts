import { test, expect } from "@playwright/test";
import { parse } from "date-fns";
import { JSDOM } from "jsdom";
import { v4 as uuid } from "uuid";
import ical from "ical-generator";
import fs from "fs";
import 'dotenv/config';

global.DOMParser = new JSDOM().window.DOMParser;

const addressLookup = {
  "Centennial High School": "289 College Ave. West",
  "Colonial Drive Park": "209 Colonial Dr.",
  "Earl Brimblecombe Park": "17 Elmira Rd. North",
  "Exhibition Park": "Kathleen St.",
  "Guelph Lake Sports Fields": "664 Woodlawn Rd East",
  "Hugh Gurhre Park": "111 Forest St.",
  "Marden Park": "7391 Marden Rd.",
  "Margaret Greene Park": "80 Westwood Rd.",
  "Norm Jary Park": "22 Shelldale Crescent",
  "Pine Ridge Park": "87 Pine Ridge Drive",
  "Riverside Park": "709 Woolwich St.",
  "Royal City Park": "139 Gordon St.",
  "W.E. Hamilton Park": "275 Scottsdale Drive",
  "University of Guelph – East & West": "South Ring Rd E & Stone Rd E",
  "University of Guelph – Main Diamond": "South Ring Rd E & College Ave.",
};

test("find schedule and create .ics", async ({ page }) => {
  const scheduleUrl =
    process.env.SCHEDULE_URL ||
    "https://perpetualmotion.org/3-pitch-schedules-and-standings/";
  const teamName = process.env.TEAM_NAME || "McGlovin";
  const dayOfWeek = process.env.DAY_OF_WEEK || "Wednesday";
  const calendarName = process.env.CALENDAR_NAME || "McGlovin 3 Pitch";
  const iCalFileName = process.env.ICAL_FILE_NAME || "mcglovin";

  const apiBaseUrl = "https://data.perpetualmotion.org";

  page.on("console", (msg) => {
    console.log(msg);
  });

  // page.on("response", (response) =>
  //   console.log("<<", response.status(), response.url())
  // );

  // Listen for each day of the week's schedule request/response
  const url = "/schedule.php";
  const responsePromise = page.waitForResponse(
    async (response) => {
      if (response.url().includes(url)) {
        const responseText = await response.text();

        // now there's a tuesday team that copied our name...
        return (
          responseText.includes(dayOfWeek) && responseText.includes(teamName)
        );
      }
      return false;
    },
    { timeout: 5000 }
  );

  await page.goto(scheduleUrl);

  const response = await responsePromise;
  const responseText = await response.text();

  // Lookup our teams current id
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(responseText, "text/html");

  const element = htmlDoc.querySelector(`a.team-link[title="${teamName}"]`);
  const teamUrl = element?.getAttribute("href");

  // Go to our teams current season schedule page
  // https://data.perpetualmotion.org/web-app/team/13501
  await page.goto(apiBaseUrl + teamUrl);

  const teamScheduleHeading = await page
    .getByRole("heading", {
      name: teamName,
    })
    .textContent();
  // await expect(teamScheduleHeading).to();

  // Read data from table rows
  let games: Array<any> = [];
  const rows = page.locator(".matchInfo .table tbody tr");
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = await row.locator("td").allTextContents();

    const gameNumber = cells[0].trim();
    const dateStr = cells[1].trim(); // 'Wed, Aug 07'

    let opponentTeamName: string;
    let opponentInfo: string;
    let opponentWinLoss: string;
    let opponentSpiritScore: string;

    if (cells[2].trim() === "PRACTICE") {
      opponentTeamName = "Practice";
      opponentWinLoss = "N/A";
      opponentSpiritScore = opponentInfo = "N/A"
    } else {
      const opponent = row.locator("td:nth-child(3)");
      opponentTeamName = (await opponent.locator("a").textContent()) || "";
      opponentInfo = (await opponent.textContent()) || "";
      [opponentWinLoss, opponentSpiritScore] = opponentInfo
        .replace(opponentTeamName, "")
        .trim()
        .split(" ");
    }

    const result = cells[3].trim();

    const fieldLocator = row.locator("td:nth-child(5) a");
    const field = (await fieldLocator.textContent()) || "";
    const fieldHref = (await fieldLocator.getAttribute("href")) || "";

    const timeStr = cells[5].trim(); // '6:30 PM'
    // For some reason Dave has this as Dark/Light in some cases and Home/Away in others
    const homeOrAwayIndicator = cells[6].trim().toLowerCase(); // Dark/Light, Home/Away
    const isHomeTeam = (homeOrAwayIndicator === "dark" || homeOrAwayIndicator === "home");
    const isAwayTeam = (homeOrAwayIndicator === "light" || homeOrAwayIndicator === "away");

    const game = {
      id: uuid(),
      gameNumber,
      startTime: parse(
        `${dateStr} ${timeStr}`,
        "EEE, MMM dd h:mm a",
        new Date()
      ),
      opponent: opponentTeamName.trim(),
      opponentWinLoss,
      opponentSpiritScore,
      result,
      field: field.trim(),
      fieldHref,
      isHomeTeam,
      isAwayTeam,
    };
    console.log(game);
    games.push(game);
  }

  const calendar = ical({ name: calendarName });

  games.forEach((game) => {
    const gameId = game.id;
    const startTime = new Date(game.startTime);
    let endTime = new Date(game.startTime);

    if (scheduleUrl.includes("ultimate")) {
      endTime.setMinutes(endTime.getMinutes() + 45);
    } else {
      endTime.setHours(endTime.getHours() + 1);
      endTime.setMinutes(endTime.getMinutes() + 30);
    }

    const homeTeam = game.isHomeTeam ? teamName : game.opponent;
    const visitingTeam = game.isAwayTeam ? teamName : game.opponent;
    const field = game.field;
    const fieldGoogleMapsHref = game.fieldHref;

    calendar.createEvent({
      id: gameId,
      start: startTime,
      end: endTime,
      summary: `${homeTeam} vs ${visitingTeam}`,
      location: field,
      description: `${teamScheduleHeading}
  Home: ${homeTeam}
  Away: ${visitingTeam}
  ${fieldGoogleMapsHref}`,
    });
  });

  fs.writeFile(`./ics/${iCalFileName}.ics`, calendar.toString(), (err) => {
    if (err) throw err;
  });

  expect(games).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        startTime: expect.any(Date),
      }),
    ])
  );
});
