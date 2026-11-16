import {defaults,normalizeSettings} from '../assets/landing-schema.js';
const schema='CREATE TABLE IF NOT EXISTS portfolio_landing_settings (id INTEGER PRIMARY KEY CHECK (id=1), config TEXT NOT NULL, revision TEXT NOT NULL)';
export async function database(env){
  if(!env.PORTFOLIO_CONFIG)throw new Error('Settings storage is unavailable.');
  const db=env.PORTFOLIO_CONFIG.withSession?env.PORTFOLIO_CONFIG.withSession('first-primary'):env.PORTFOLIO_CONFIG;
  await db.prepare(schema).run();return db;
}
export async function readSettings(db){
  const row=await db.prepare('SELECT config, revision FROM portfolio_landing_settings WHERE id=1').first();
  return row?{config:normalizeSettings(JSON.parse(row.config)),revision:row.revision}:{config:{...defaults},revision:null};
}
