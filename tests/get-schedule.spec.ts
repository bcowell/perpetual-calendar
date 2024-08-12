import { test, expect } from "@playwright/test";
import { parse } from "date-fns";
import { JSDOM } from "jsdom";
import { v4 as uuid } from "uuid";
import ical from "ical-generator";
import fs from "fs";

global.DOMParser = new JSDOM().window.DOMParser;

test("find schedule and create .ics", async ({ page }) => {
  const teamName = "McGlovin";
  const apiBaseUrl = "https://data.perpetualmotion.org";
  const scheduleUrl =
    "https://perpetualmotion.org/3-pitch-schedules-and-standings/";
  const calendarName = "Perpetual 3 Pitch McGlovin";
  const iCalFileName = "V1.0.0";

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
        return responseText.includes(teamName);
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

  const teamScheduleHeading = await page.getByRole("heading", {
    name: teamName,
  });
  await expect(teamScheduleHeading).toBeVisible();

  // Read data from table rows
  let games: Array<any> = [];
  const rows = page.locator(".matchInfo .table tbody tr");
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = await row.locator("td").allTextContents();

    const gameNumber = cells[0].trim();
    const dateStr = cells[1].trim(); // 'Wed, Aug 07'

    const opponent = row.locator("td:nth-child(3)");
    const opponentTeamName = (await opponent.locator("a").textContent()) || "";
    const opponentInfo = (await opponent.textContent()) || "";
    const [opponentWinLoss, opponentSpiritScore] = opponentInfo
      .replace(opponentTeamName, "")
      .trim()
      .split(" ");

    const result = cells[3].trim();

    const fieldLocator = row.locator("td:nth-child(5) a");
    const field = (await fieldLocator.textContent()) || "";
    const fieldHref = (await fieldLocator.getAttribute("href")) || "";

    const timeStr = cells[5].trim(); // '6:30 PM'
    const shirtColor = cells[6].trim();

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
      shirtColor,
    };
    console.log(game);
    games.push(game);
  }

  const calendar = ical({ name: calendarName });

  games.forEach((game) => {
    const gameId = game.id;
    const startTime = new Date(game.startTime);
    let endTime = new Date(game.startTime);
    endTime.setHours(endTime.getHours() + 1);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const homeTeam = game.shirtColor === "dark" ? teamName : game.opponent;
    const visitingTeam = game.shirtColor === "light" ? teamName : game.opponent;
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
