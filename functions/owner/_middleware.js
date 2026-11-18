import {hostAllowed,verifyOwner} from '../_auth.js';

// Static saved pages and their text assets require the same signed owner
// identity as Tune. A hidden menu link is not the access control.
export async function onRequest({request,env,next}){
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
  if(!hostAllowed(request,env))return new Response('Not found',{status:404,headers});
  if(!await verifyOwner(request,env))return new Response('Owner access required.',{status:403,headers});
  const original=await next(),response=new Response(original.body,original);
  for(const [name,value]of Object.entries(headers))response.headers.set(name,value);
  return response;
}
