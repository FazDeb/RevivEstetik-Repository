const pages = import.meta.glob('../../content/*.json', {eager:true,import:'default'});
const entries = import.meta.glob('../../content/treatments/*.json', {eager:true,import:'default'});
export async function getContent() {
 const settings=Object.assign({},...Object.values(pages));
 const treatments=Object.values(entries).sort((a,b)=>(a.order??100)-(b.order??100)||a.title.localeCompare(b.title));
 const slugs=new Set();
 for(const t of treatments){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug)||slugs.has(t.slug))throw new Error(`Invalid or duplicate treatment address: ${t.slug}`);slugs.add(t.slug);}
 return {settings,treatments};
}
