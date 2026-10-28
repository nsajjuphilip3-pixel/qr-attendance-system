const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,PASS=process.env.ADMIN_PASSWORD;
if(!PASS){console.error('Set the ADMIN_PASSWORD environment variable first.');process.exit(1)}
const DATA=process.env.DATA_FILE||path.join(__dirname,'data','records.json');
fs.mkdirSync(path.dirname(DATA),{recursive:true});
let rec=[];try{rec=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{}
const save=()=>fs.writeFileSync(DATA,JSON.stringify(rec,null,1));
const tokens=new Set();
const json=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
const body=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch{r({})}})});
const h=s=>crypto.createHash('sha256').update(String(s)).digest();
const eq=(a,b)=>crypto.timingSafeEqual(h(a),h(b));
const isAdmin=req=>tokens.has((req.headers.authorization||'').replace('Bearer ',''));
const norm=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,80);
const open=n=>rec.find(r=>!r.outAt&&r.name.toLowerCase()===n.toLowerCase());
const pages={'/':'index.html','/admin':'admin.html'};
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x'),p=u.pathname;
 try{
  if(req.method==='GET'&&pages[p]){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'public',pages[p])))}
  if(p==='/api/status'&&req.method==='GET'){const n=norm(u.searchParams.get('name')),o=n&&open(n);return json(res,200,{signedIn:!!o,since:o?o.inAt:null})}
  if(p==='/api/scan'&&req.method==='POST'){
   const b=await body(req),n=norm(b.name);if(!n)return json(res,400,{error:'Please enter your name'});
   const o=open(n),now=new Date().toISOString();
   if(b.action==='in'){if(o)return json(res,409,{error:'You are already signed in',since:o.inAt});rec.push({id:crypto.randomUUID(),name:n,inAt:now,outAt:null});save();return json(res,200,{ok:true,at:now})}
   if(b.action==='out'){if(!o)return json(res,409,{error:'You are not signed in'});o.outAt=now;save();return json(res,200,{ok:true,at:now,inAt:o.inAt})}
   return json(res,400,{error:'Bad action'})}
  if(p==='/api/admin/login'&&req.method==='POST'){const b=await body(req);if(!eq(b.password,PASS))return json(res,401,{error:'Wrong password'});const t=crypto.randomBytes(24).toString('hex');tokens.add(t);return json(res,200,{token:t})}
  if(p.startsWith('/api/admin/')){
   if(!isAdmin(req))return json(res,401,{error:'Unauthorized'});
   if(p==='/api/admin/records'&&req.method==='GET')return json(res,200,rec);
   if(p==='/api/admin/signout'&&req.method==='POST'){const b=await body(req),r=rec.find(x=>x.id===b.id&&!x.outAt);if(r){r.outAt=new Date().toISOString();save()}return json(res,200,{ok:true})}
   if(p.startsWith('/api/admin/records/')&&req.method==='DELETE'){const id=p.split('/').pop();rec=rec.filter(r=>r.id!==id);save();return json(res,200,{ok:true})}
  }
  json(res,404,{error:'Not found'})
 }catch(e){json(res,500,{error:'Server error'})}
}).listen(PORT,()=>console.log('Running on http://localhost:'+PORT));
