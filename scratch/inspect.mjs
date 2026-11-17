// One-off: print the API's shape for one team's league, looking for spirit scores.
const api = "https://data.perpetualmotion.org/web-app/api";
const team = process.env.TEAM_NAME, day = process.env.DAY_OF_WEEK;
const get = async (path) => {
  const r = await fetch(`${api}/${path}`);
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
};
const keys = (o) => (o && typeof o === "object" ? Object.keys(o).join(", ") : String(o));
const spirit = (label, o) => {
  const hits = [];
  const walk = (v, path) => {
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) {
      if (/spirit|sotg|sportsman/i.test(k)) hits.push(`${path}.${k} = ${JSON.stringify(x).slice(0, 120)}`);
      if (hits.length < 40) walk(x, `${path}.${k}`);
    }
  };
  walk(o, label);
  console.log(`SPIRIT KEYS in ${label}: ${hits.length ? "\n  " + hits.slice(0, 40).join("\n  ") : "none"}`);
};

const seasons = (await get("schedules-standings")).json;
console.log("season keys:", keys(seasons[0]));
let league, t;
for (const s of seasons) for (const l of s.leagues) if (l.weekday === day)
  for (const c of l.teams || []) if (c.name.trim() === team) { league = l; t = c; }
console.log("league keys:", keys(league));
console.log("team keys:", keys(t));
console.log("our team:", JSON.stringify(t));
console.log("another team:", JSON.stringify(league.teams.find((x) => x.id !== t.id)));
spirit("seasons", seasons);

const sched = await get(`schedules-standings/schedule/${league.id}`);
console.log("schedule top keys:", keys(sched.json));
const week = sched.json.weeks.find((w) => (w.matches || []).some((m) => m.teamOneID === t.id || m.teamTwoID === t.id));
console.log("week keys:", keys(week));
const played = sched.json.weeks.flatMap((w) => w.matches || []).filter((m) => m.teamOneID === t.id || m.teamTwoID === t.id);
console.log("match keys:", keys(played[0]));
console.log("our matches:", JSON.stringify(played.slice(0, 3), null, 1));
spirit("schedule", sched.json);

for (const path of [`schedules-standings/standings/${league.id}`, `schedules-standings/${league.id}/standings`,
                    `standings/${league.id}`, `schedules-standings/league/${league.id}`, `schedules-standings/spirit/${league.id}`]) {
  const r = await get(path);
  console.log(`\nGET ${path} -> ${r.status} ${r.json ? "json" : "text"} ${r.text.length}B`);
  if (r.json) {
    console.log("  top:", Array.isArray(r.json) ? `array[${r.json.length}] of ${keys(r.json[0])}` : keys(r.json));
    console.log("  sample:", JSON.stringify(Array.isArray(r.json) ? r.json[0] : r.json).slice(0, 1500));
    spirit(path, r.json);
  }
}
