import css from '../../styles/site.css?raw';
export function GET() {
  return new Response(css + '\nbody{padding:18px}.wrap{width:100%}.original-treatment{margin-top:0}', {headers:{'Content-Type':'text/css; charset=utf-8'}});
}
