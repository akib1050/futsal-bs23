export type RatedPlayer = {
  id: string;
  name: string;
  rating: number;
};

export type TeamSplit = {
  teamA: RatedPlayer[];
  teamB: RatedPlayer[];
  avgA: number;
  avgB: number;
  diff: number;
};

function average(players: RatedPlayer[]): number {
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.rating, 0) / players.length;
}

/** Greedy snake draft by rating to balance two teams. */
export function makeBalancedTeams(players: RatedPlayer[]): TeamSplit {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const teamA: RatedPlayer[] = [];
  const teamB: RatedPlayer[] = [];
  let sumA = 0;
  let sumB = 0;

  for (const player of sorted) {
    if (sumA <= sumB) {
      teamA.push(player);
      sumA += player.rating;
    } else {
      teamB.push(player);
      sumB += player.rating;
    }
  }

  // Optional swap pass to reduce average gap
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        const newSumA = sumA - teamA[i].rating + teamB[j].rating;
        const newSumB = sumB - teamB[j].rating + teamA[i].rating;
        const currentDiff = Math.abs(sumA / teamA.length - sumB / teamB.length);
        const nextDiff = Math.abs(
          newSumA / teamA.length - newSumB / teamB.length
        );
        if (nextDiff + 0.001 < currentDiff) {
          const tmp = teamA[i];
          teamA[i] = teamB[j];
          teamB[j] = tmp;
          sumA = newSumA;
          sumB = newSumB;
          improved = true;
        }
      }
    }
  }

  const avgA = average(teamA);
  const avgB = average(teamB);
  return {
    teamA,
    teamB,
    avgA,
    avgB,
    diff: Math.abs(avgA - avgB),
  };
}
