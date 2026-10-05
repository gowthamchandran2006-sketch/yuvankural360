const fs=require("fs");const {JSDOM,VirtualConsole,ResourceLoader}=require("jsdom");
class L extends ResourceLoader{ fetch(u,o){ if(u.startsWith("file://")) return super.fetch(u,o); return null; } }
const dir="C:\\Users\\ELCOT\\Desktop\\vscode\\new\\369\\frontend\\";
(async()=>{
for(const f of ["settings.html","profile.html"]){
  const vc=new VirtualConsole(); const errs=[];
  vc.on("jsdomError",e=>errs.push(e.message));
  const dom=new JSDOM(fs.readFileSync(dir+f,"utf8"),{url:"http://127.0.0.1:5000/"+f,runScripts:"dangerously",resources:new L(),virtualConsole:vc,pretendToBeVisual:true,
    beforeParse(w){ w.fetch=()=>Promise.reject(new Error("offline")); w.confirm=()=>false; }});
  await new Promise(r=>setTimeout(r,800));
  console.log(f+" -> YK defined: "+ (typeof dom.window.YK) +" | errors: "+(errs.length?errs.join(" ; "):"none"));
  dom.window.close();
}})();