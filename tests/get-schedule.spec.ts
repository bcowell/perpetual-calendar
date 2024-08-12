import { test, expect } from "@playwright/test";
import ical from "ical-generator";
import fs from "fs";

test("find schedule and create .ics", async ({ page }) => {
  const teamName = "McGlovin";
  const seasonCode = "S24";
  const scheduleUrl =
    "https://perpetualmotion.org/3-pitch-schedules-and-standings/";
  const calendarName = `${teamName} ${seasonCode}`;
  const iCalFileName = `${teamName}-${seasonCode}`;

  await page.goto(scheduleUrl);

  const teamPageDropdowns = await page
    .getByRole("button", { name: "Team Pages" })
    .all();

  for (const row of teamPageDropdowns) {
    await row.click();
    await page.waitForTimeout(2000);
  }

  await page.getByText(/McGlovin/i).click();

  //   const calendar = ical({ name: calendarName });

  //   games.forEach((game) => {
  //     const gameId = game.id;
  //     const startTime = new Date(game.starts_at);
  //     let endTime = new Date(game.starts_at);
  //     endTime.setHours(endTime.getHours() + 1);

  //     const homeTeam = game.homeTeam.name;
  //     const visitingTeam = game.visitingTeam.name;
  //     const venue = game.venue.name;
  //     const facility = game.facility.name;
  //     const streetAddress = game.venue.address.street_1;
  //     const city = game.venue.address.city;
  //     const province = game.venue.address.province.iso_3166_2;
  //     const postalCode = game.venue.address.postal_code;
  //     const schedule = game.schedule.name;

  //     calendar.createEvent({
  //       id: gameId,
  //       start: startTime,
  //       end: endTime,
  //       summary: `${homeTeam} vs ${visitingTeam}`,
  //       location: `${venue}, ${streetAddress}, ${city}, ${province}, ${postalCode}`,
  //       description: `${facility}
  // ${schedule}
  // Home: ${homeTeam}
  // Away: ${visitingTeam}`,
  //     });
  //   });

  //   fs.writeFile(`./ics/${iCalFileName}.ics`, calendar.toString(), (err) => {
  //     if (err) throw err;
  //   });

  //   expect(games).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({
  //         starts_at: expect.any(String),
  //       }),
  //     ])
  //   );
});
