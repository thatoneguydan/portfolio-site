// Validate Access at the origin too, including deployment aliases.
const certCache = new Map();
const decode = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export function tokenFrom(request) {
  const header=request.headers.get('Cf-Access-Jwt-Assertion');
  if(header)return header;
  return (request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('portfolio_owner='))?.slice(16)||'';
}
export async function verifyOwner(request, env, fetchKeys = fetch) {
  const issuer=env.TUNE_ACCESS_ISSUER,audience=env.TUNE_ACCESS_AUD,owner=env.TUNE_OWNER_EMAIL;
  if(!issuer||!audience||!owner||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))return null;
  const token=tokenFrom(request);if(!token||token.length>12000)return null;
  try{
    const parts=token.split('.');if(parts.length!==3)return null;
    const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const now=Math.floor(Date.now()/1000);
    if(header.alg!=='RS256'||!header.kid||claims.iss!==issuer||!Number.isFinite(claims.exp)||claims.exp<=now)return null;
    if(claims.nbf&&claims.nbf>now+30)return null;
    if(![].concat(claims.aud||[]).includes(audience)||String(claims.email||'').toLowerCase()!==owner.toLowerCase())return null;
    let certs=certCache.get(issuer);
    if(!certs||certs.until<Date.now()||!certs.keys.some(k=>k.kid===header.kid)){
      const response=await fetchKeys(issuer+'/cdn-cgi/access/certs');if(!response.ok)return null;
      const data=await response.json();if(!Array.isArray(data.keys))return null;
      certs={keys:data.keys,until:Date.now()+300000};certCache.set(issuer,certs);
    }
    const jwk=certs.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return valid?{email:claims.email,expires:claims.exp,token}:null;
  }catch{return null;}
}
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const hostAllowed=(request,env)=>new URL(request.url).hostname===(env.TUNE_HOST||'dantylersmith-redesign.pages.dev');
