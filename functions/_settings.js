import {defaults,normalizeSettings} from '../assets/landing-schema.js';
const schema='CREATE TABLE IF NOT EXISTS portfolio_landing_settings (id INTEGER PRIMARY KEY CHECK (id=1), config TEXT NOT NULL, revision TEXT NOT NULL)';
export async function database(env){
  if(!env.PORTFOLIO_CONFIG)throw new Error('Settings storage is unavailable.');
  return env.PORTFOLIO_CONFIG.withSession?env.PORTFOLIO_CONFIG.withSession('first-primary'):env.PORTFOLIO_CONFIG;
}
export async function readSettings(db){
  const read=()=>db.prepare('SELECT config, revision FROM portfolio_landing_settings WHERE id=1').first();
  let row;
  try{row=await read();}
  catch(error){
    if(!/no such table: (?:main\.)?portfolio_landing_settings\b/i.test(String(error?.message)+' '+String(error?.cause?.message)))throw error;
    // Only a new database needs initialization. Concurrent first reads are
    // safe because the table creation is idempotent.
    await db.prepare(schema).run();
    row=await read();
  }
  return row?{config:normalizeSettings(JSON.parse(row.config)),revision:row.revision}:{config:{...defaults},revision:null};
}
