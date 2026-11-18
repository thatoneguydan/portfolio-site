import {database,readSettings} from '../_settings.js';
import {hostAllowed} from '../_auth.js';
import {footerProperties,workSectionProperties} from '../../assets/landing-schema.js';

// Read the same saved settings before the document paints. This replaces the
// late client request; Tune still uses the JSON endpoint for ordinary reads.
export async function onRequestGet({request,env}){
  let data=null;
  if(hostAllowed(request,env))try{data=await readSettings(await database(env));}catch{}
  const encoded=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const properties=JSON.stringify(data?{...footerProperties(data.config),...workSectionProperties(data.config)}:{});
  return new Response(`{const settings=${encoded};if(settings){window.portfolioLandingConfig=settings.config;window.portfolioLandingRevision=settings.revision;window.portfolioLandingBootstrapped=true;for(const [name,value] of Object.entries(${properties}))document.documentElement.style.setProperty(name,value);}}`,{
    headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
  });
}
