const $ = (id) => document.getElementById(id);
const formFields = ["fullName","jobTitle","location","email","phone","website","summary","skills","projects","certifications","languages"];
let experience = [];
let education = [];
let activeSection = "personal";
let currentTemplate = "modern";

const escapeHTML = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeText = (value) => escapeHTML(value.trim());
const defaultData = {
  fullName:"",jobTitle:"",location:"",email:"",phone:"",website:"",
  summary:"",skills:"",projects:"",certifications:"",languages:""
};

function readData(){
  const data = {};
  formFields.forEach(id => data[id] = $(id).value || "");
  return data;
}
function saveLocal(){
  try{
    localStorage.setItem("resumecraft-data", JSON.stringify({data:readData(),experience,education,template:currentTemplate}));
    $("saveStatus").innerHTML = "<i></i> Saved in this browser";
  }catch(e){ $("saveStatus").textContent = "Local save unavailable"; }
}
function loadLocal(){
  try{
    const saved = JSON.parse(localStorage.getItem("resumecraft-data") || "null");
    if(!saved) return;
    Object.entries(saved.data || {}).forEach(([id,value])=>{if($(id)) $(id).value=value;});
    experience = Array.isArray(saved.experience)?saved.experience:[];
    education = Array.isArray(saved.education)?saved.education:[];
    currentTemplate = ["modern","classic","minimal"].includes(saved.template)?saved.template:"modern";
  }catch(e){ console.warn("Could not load saved resume",e); }
}
function makeEntry(type, item={}, index=0){
  const isExp = type === "experience";
  const title = isExp ? "Experience" : "Education";
  const fields = isExp
    ? [["role","Job title","e.g. Product Designer"],["company","Company","Company name"],["place","Location","City, Country"],["dates","Dates","Jan 2023 – Present"],["description","Highlights","Describe your contribution and results..."]]
    : [["degree","Degree / qualification","e.g. B.Tech in Computer Science"],["school","School / institution","Institution name"],["place","Location","City, Country"],["dates","Dates","2021 – 2025"],["description","Details","Relevant coursework, achievements..."]];
  return `<div class="entry-card" data-type="${type}" data-index="${index}">
    <div class="entry-card-head"><span>${title} ${index+1}</span><button class="remove-entry" type="button" data-remove="${type}" data-index="${index}">Remove</button></div>
    <div class="entry-grid">${fields.map(([key,label,placeholder])=>`<label class="field ${key==="description"?"full":""}"><span>${label}</span>${key==="description"?`<textarea rows="2" data-type="${type}" data-index="${index}" data-key="${key}" placeholder="${placeholder}">${escapeHTML(item[key]||"")}</textarea>`:`<input data-type="${type}" data-index="${index}" data-key="${key}" value="${escapeHTML(item[key]||"")}" placeholder="${placeholder}">`}</label>`).join("")}</div>
  </div>`;
}
function renderEntryForms(){
  $("experienceList").innerHTML = experience.map((item,i)=>makeEntry("experience",item,i)).join("");
  $("educationList").innerHTML = education.map((item,i)=>makeEntry("education",item,i)).join("");
}
function setSection(name){
  activeSection=name;
  document.querySelectorAll(".form-section").forEach(s=>s.classList.toggle("active",s.id===`section-${name}`));
  document.querySelectorAll(".section-tab").forEach(t=>{
    const active=t.dataset.section===name;t.classList.toggle("active",active);t.setAttribute("aria-selected",String(active));
  });
}
function entryHTML(item, titleKey, subKey){
  const title=safeText(item[titleKey]||"");
  const sub=safeText([item[subKey],item.place].filter(Boolean).join(" · "));
  const dates=safeText(item.dates||"");
  const desc=safeText(item.description||"");
  if(!title&&!sub&&!dates&&!desc) return "";
  return `<div class="resume-entry"><div class="resume-entry-top"><strong>${title||"Untitled"}</strong><span class="date">${dates}</span></div>${sub?`<div class="subline">${sub}</div>`:""}${desc?`<p class="description">${desc}</p>`:""}</div>`;
}
function renderPreview(){
  const d=readData();
  $("previewName").textContent=d.fullName.trim()||"Your Name";
  $("previewTitle").textContent=d.jobTitle.trim()||"Your Professional Title";
  const contact=[d.location,d.email,d.phone,d.website].filter(v=>v.trim());
  $("previewContact").innerHTML=(contact.length?contact:["City, Country","you@example.com","+91 00000 00000"]).map(v=>`<span>${safeText(v)}</span>`).join("");
  $("previewSummary").textContent=d.summary.trim()||"Your professional summary will appear here. Add a few sentences about your experience, strengths, and career goals.";
  $("previewExperience").innerHTML=experience.map(e=>entryHTML(e,"role","company")).filter(Boolean).join("")||'<p class="empty-hint">Your work experience will appear here.</p>';
  $("previewEducation").innerHTML=education.map(e=>entryHTML(e,"degree","school")).filter(Boolean).join("")||'<p class="empty-hint">Your education will appear here.</p>';
  const skills=d.skills.split(",").map(s=>s.trim()).filter(Boolean);
  $("previewSkills").innerHTML=skills.length?skills.map(s=>`<span class="skill-chip">${safeText(s)}</span>`).join(""):'<span class="skill-chip">Your skills</span>';
  const extras=[];
  [["Projects",d.projects],["Certifications",d.certifications],["Languages",d.languages]].forEach(([label,value])=>{if(value.trim()) extras.push(`<div class="resume-entry"><strong>${label}</strong><p class="description">${safeText(value)}</p></div>`);});
  $("previewExtras").innerHTML=extras.join("")||'<p class="empty-hint">Add projects, certifications, or languages to strengthen your resume.</p>';
  $("resumePreview").className=`resume-paper template-${currentTemplate}`;
  updateProgress();
}
function updateProgress(){
  const d=readData();
  const filled=formFields.filter(id=>d[id].trim()).length;
  const extraCount=experience.filter(e=>Object.values(e).some(v=>String(v).trim())).length+education.filter(e=>Object.values(e).some(v=>String(v).trim())).length;
  const percent=Math.min(100,Math.round((filled+Math.min(extraCount,2))/(formFields.length+2)*100));
  $("progressBar").style.width=percent+"%";$("completionLabel").textContent=percent+"% complete";
}
function setTemplate(template){
  currentTemplate=template;
  $("templateSelect").value=template;
  document.querySelectorAll(".template-card").forEach(c=>c.classList.toggle("selected",c.dataset.template===template));
  renderPreview();saveLocal();
}
function downloadPDF(){window.print();}

formFields.forEach(id=>$(id).addEventListener("input",()=>{renderPreview();saveLocal();}));
document.querySelectorAll(".section-tab").forEach(tab=>tab.addEventListener("click",()=>setSection(tab.dataset.section)));
document.querySelectorAll(".next-btn").forEach(btn=>btn.addEventListener("click",()=>setSection(btn.dataset.next)));
document.querySelectorAll(".prev-btn").forEach(btn=>btn.addEventListener("click",()=>setSection(btn.dataset.prev)));
$("addExperience").addEventListener("click",()=>{experience.push({});renderEntryForms();saveLocal();});
$("addEducation").addEventListener("click",()=>{education.push({});renderEntryForms();saveLocal();});
document.addEventListener("input",e=>{
  const el=e.target;
  if(!el.matches("[data-type][data-key]"))return;
  const list=el.dataset.type==="experience"?experience:education;
  list[Number(el.dataset.index)][el.dataset.key]=el.value;
  renderPreview();saveLocal();
});
document.addEventListener("click",e=>{
  const btn=e.target.closest("[data-remove]");
  if(!btn)return;
  const list=btn.dataset.remove==="experience"?experience:education;
  list.splice(Number(btn.dataset.index),1);renderEntryForms();renderPreview();saveLocal();
});
$("templateSelect").addEventListener("change",e=>setTemplate(e.target.value));
document.querySelectorAll(".template-card").forEach(c=>c.addEventListener("click",()=>setTemplate(c.dataset.template)));
$("downloadBtn").addEventListener("click",downloadPDF);
$("finishBtn").addEventListener("click",()=>{setSection("personal");$("paperStage").scrollIntoView({behavior:"smooth",block:"center"});});
$("zoomBtn").addEventListener("click",()=>$("paperStage").scrollIntoView({behavior:"smooth",block:"center"}));
$("resetBtn").addEventListener("click",()=>{
  if(!confirm("Clear your resume details and start over?"))return;
  localStorage.removeItem("resumecraft-data");$("resumeForm").reset();experience=[];education=[];currentTemplate="modern";
  renderEntryForms();setTemplate("modern");setSection("personal");renderPreview();
});
loadLocal();renderEntryForms();setTemplate(currentTemplate);renderPreview();
