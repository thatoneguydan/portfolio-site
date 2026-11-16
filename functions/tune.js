import {verifyOwner,hostAllowed} from './_auth.js';
export async function onRequestGet({request,env}){
  if(!hostAllowed(request,env))return new Response('Not found',{status:404});
  const owner=await verifyOwner(request,env);
  if(!owner)return new Response('Owner sign-in has not been configured yet.',{status:403,headers:{'Cache-Control':'no-store'}});
  // Access's own cookie may be path-scoped to /tune. Preserve the signed,
  // verified token in a root-scoped HttpOnly cookie for the owner API.
  return new Response(null,{status:302,headers:{
    Location:'/#tune',
    'Set-Cookie':`portfolio_owner=${owner.token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${Math.max(0,owner.expires-Math.floor(Date.now()/1000))}`,
    'Cache-Control':'no-store'
  }});
}
