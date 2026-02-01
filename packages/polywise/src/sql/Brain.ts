export const sql_runShadowTick = `
  UPDATE brain.nodes 
  SET potential = potential + 0.1 
  WHERE id IN (SELECT id FROM brain.nodes ORDER BY random() LIMIT (SELECT count(*)/100 + 1 FROM brain.nodes));
`

export const sql_sleepTickBegin = `BEGIN`

export const sql_sleepTickCleanNoise = `
  DELETE FROM brain.edges 
  WHERE weight < 0.001; 
`

export const sql_sleepTickDecay = `
  UPDATE brain.edges
  SET weight = GREATEST(weight - 0.01, 0.001)
  WHERE weight < 0.2;
`

export const sql_sleepTickReplay = `
  UPDATE brain.edges 
  SET weight = LEAST(weight + 0.2, 5.0)
  WHERE id IN (
    SELECT id FROM brain.edges 
    WHERE learning_rate > 1.5 
    ORDER BY random() LIMIT 5
  );
`

export const sql_sleepTickResetNodes = `UPDATE brain.nodes SET potential = 0, activation = 0;`

export const sql_sleepTickCommit = `COMMIT`
