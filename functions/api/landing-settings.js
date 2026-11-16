import {database,readSettings} from '../_settings.js';
import {json,hostAllowed} from '../_auth.js';
export async function onRequestGet({request,env}){
  if(!hostAllowed(request,env))return json({config:null,revision:null});
  try{return json(await readSettings(await database(env)));}
  catch{return json({config:null,revision:null});}
}
