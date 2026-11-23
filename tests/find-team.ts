type Options = { teamName: string; dayOfWeek?: string; leagueId?: number };

/**
 * Finds our team and its league in the API's list of seasons. Teams get a new id each
 * season, so they're looked up by name every run. With a league id the search stays in
 * that league; otherwise the weekday separates teams that share a name across leagues.
 */
export const findTeam = (seasons: any[], { teamName, dayOfWeek, leagueId }: Options) => {
  const leagues = seasons.flatMap((season) => season.leagues || []);

  if (leagueId) {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) throw new Error(`No league ${leagueId} in any current season`);
    const team = (league.teams || []).find((t: any) => t.name.trim() === teamName);
    if (!team) {
      const names = (league.teams || []).map((t: any) => t.name.trim()).join(", ");
      throw new Error(`No team "${teamName}" in league ${leagueId}. Teams: ${names}`);
    }
    return { league, team };
  }

  let found: { league: any; team: any } | undefined;
  for (const league of leagues) {
    if (league.weekday !== dayOfWeek) continue;
    const team = (league.teams || []).find((t: any) => t.name.trim() === teamName);
    if (team) found = { league, team };
  }
  if (!found) throw new Error(`Could not find team ${teamName} on ${dayOfWeek}`);
  return found;
};
