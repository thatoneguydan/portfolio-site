import {verifyOwner,json,hostAllowed} from '../_auth.js';
export async function onRequestGet({request,env}){
  if(!hostAllowed(request,env))return json({owner:false});
  const owner=await verifyOwner(request,env);
  return json({owner:!!owner});
}
