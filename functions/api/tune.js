import {verifyOwner,json,hostAllowed} from '../_auth.js';
import {database,readSettings} from '../_settings.js';
import {normalizeSettings} from '../../assets/landing-schema.js';
export async function onRequestPut({request,env}){
  if(!hostAllowed(request,env)||!await verifyOwner(request,env))return json({error:'Owner sign-in required.'},403);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required.'},415);
  if(Number(request.headers.get('Content-Length'))>96000)return json({error:'Settings are too large.'},413);
  try{
    const text=await request.text();if(text.length>96000)return json({error:'Settings are too large.'},413);
    const body=JSON.parse(text),db=await database(env),current=await readSettings(db);
    if(body.revision!==current.revision)return json({error:'Settings changed in another session. Reload them before saving.',...current},409);
    const config=normalizeSettings(body.config),revision=crypto.randomUUID();
    const result=current.revision
      ?await db.prepare('UPDATE portfolio_landing_settings SET config=?, revision=? WHERE id=1 AND revision=?').bind(JSON.stringify(config),revision,current.revision).run()
      :await db.prepare('INSERT OR IGNORE INTO portfolio_landing_settings (id,config,revision) VALUES (1,?,?)').bind(JSON.stringify(config),revision).run();
    if(result.meta?.changes!==1)return json({error:'Settings changed in another session. Reload them before saving.'},409);
    return json({config,revision});
  }catch(error){return json({error:error.message==='Settings storage is unavailable.'?error.message:'Invalid settings.'},400);}
}
