export const sql_run_shadow_tick = `
  UPDATE brain.nodes 
  SET potential = potential + 0.1 
  WHERE id IN (SELECT id FROM brain.nodes ORDER BY random() LIMIT (SELECT count(*)/100 + 1 FROM brain.nodes));
`

export const sql_sleep_tick_begin = `BEGIN`

export const sql_sleep_tick_clean_noise = `
  DELETE FROM brain.edges 
  WHERE weight < 0.001; 
`

export const sql_sleep_tick_decay = `
  UPDATE brain.edges
  SET weight = GREATEST(weight - 0.01, 0.001)
  WHERE weight < 0.2;
`

export const sql_sleep_tick_replay = `
  UPDATE brain.edges 
  SET weight = LEAST(weight + 0.2, 5.0)
  WHERE id IN (
    SELECT id FROM brain.edges 
    WHERE learning_rate > 1.5 
    ORDER BY random() LIMIT 5
  );
`

export const sql_sleep_tick_reset_nodes = `UPDATE brain.nodes SET potential = 0, activation = 0;`

export const sql_sleep_tick_commit = `COMMIT`
