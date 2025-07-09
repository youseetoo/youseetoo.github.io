/* small helper to turn the CSV you exported from the XLSX
   (keep the sheet exactly as in the template) into a usable json structure */

function parseUC2csv(csvText){
  const rows = Papa.parse(csvText,{skipEmptyLines:true}).data;
  if(rows.length<4) return [];

  // experiment columns start at the column labelled "Experiments"
  const expStart = rows[0].findIndex(h=>h && h.trim().toLowerCase()==="experiments");
  const experiments = [];

  // build column → experiment map (row1 = name, row2 = description, row3 = image-url)
  for(let c=expStart;c<rows[1].length;c++){
    if(rows[1][c] && rows[1][c].trim()){
      experiments.push({
        col:c,
        name: rows[1][c].trim(),
        desc: (rows[2][c]||"").trim(),
        img : (rows[3][c]||"").trim(),
        modules:[],
        boxes:[]
      });
    }
  }

  // rows 4..end hold items; col0 = category ("Boxes" or "" for modules), col1 = item name
  for(let r=4;r<rows.length;r++){
    const cat = (rows[r][0]||"").trim().toLowerCase();
    const item = (rows[r][1]||"").trim();
    if(!item) continue;

    experiments.forEach(e=>{
      const mark = (rows[r][e.col]||"").toString().trim();
      if(mark){
        if(cat.includes("box")) e.boxes.push(item);
        else e.modules.push(item);
      }
    });
  }
  return experiments;
}

/* UI glue */

const listEl   = document.getElementById("expList");
const listTitleEl = document.getElementById("listTitle");
const detailEl = document.getElementById("expDetail");
const boxDetailEl = document.getElementById("boxDetail");
const titleEl  = document.getElementById("expTitle");
const descEl   = document.getElementById("expDesc");
const imgEl    = document.getElementById("expImg");
const modList  = document.getElementById("modulesList");
const boxList  = document.getElementById("boxesList");
const boxTitleEl = document.getElementById("boxTitle");
const boxDescEl = document.getElementById("boxDesc");
const experimentsList = document.getElementById("experimentsList");

let EXP_DATA = [];
let BOX_DATA = [];
let currentMode = 'experiment'; // 'experiment' or 'box'

function buildBoxData() {
  const boxes = new Map();
  
  EXP_DATA.forEach(exp => {
    exp.boxes.forEach(box => {
      if (!boxes.has(box)) {
        boxes.set(box, {
          name: box,
          experiments: []
        });
      }
      boxes.get(box).experiments.push(exp);
    });
  });
  
  return Array.from(boxes.values());
}

function renderExpList(){
  listEl.innerHTML="";
  EXP_DATA.forEach((e,i)=>{
    const a=document.createElement("button");
    a.className="list-group-item list-group-item-action";
    a.textContent=e.name;
    a.addEventListener("click",()=>showExperiment(i));
    listEl.appendChild(a);
  });
}

function renderBoxList(){
  listEl.innerHTML="";
  BOX_DATA.forEach((b,i)=>{
    const a=document.createElement("button");
    a.className="list-group-item list-group-item-action";
    a.textContent=b.name;
    a.addEventListener("click",()=>showBox(i));
    listEl.appendChild(a);
  });
}

function li(txt){const li=document.createElement("li");li.className="list-group-item";li.textContent=txt;return li;}

function showExperiment(idx){
  const e=EXP_DATA[idx];
  titleEl.textContent=e.name;
  descEl.textContent=e.desc;
  if(e.img){imgEl.src=e.img;imgEl.classList.remove("d-none");}
  else imgEl.classList.add("d-none");

  modList.innerHTML=""; e.modules.forEach(m=>modList.appendChild(li(m)));
  boxList.innerHTML=""; e.boxes  .forEach(b=>boxList.appendChild(li(b)));

  [...listEl.children].forEach((c,i)=>c.classList.toggle("active",i===idx));
  detailEl.classList.remove("d-none");
  boxDetailEl.classList.add("d-none");
}

function showBox(idx){
  const b=BOX_DATA[idx];
  boxTitleEl.textContent=b.name;
  boxDescEl.textContent=`This box enables ${b.experiments.length} experiment(s)`;
  
  experimentsList.innerHTML="";
  b.experiments.forEach(exp => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `<strong>${exp.name}</strong><br><small class="text-muted">${exp.desc}</small>`;
    experimentsList.appendChild(li);
  });

  [...listEl.children].forEach((c,i)=>c.classList.toggle("active",i===idx));
  boxDetailEl.classList.remove("d-none");
  detailEl.classList.add("d-none");
}

function switchMode(mode) {
  currentMode = mode;
  
  if (mode === 'experiment') {
    listTitleEl.textContent = 'Experiments';
    renderExpList();
  } else {
    listTitleEl.textContent = 'Boxes';
    BOX_DATA = buildBoxData();
    renderBoxList();
  }
  
  // Hide both detail sections
  detailEl.classList.add("d-none");
  boxDetailEl.classList.add("d-none");
}

/* file loader */

// Auto-load the default CSV after Papa loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Papa to load
  setTimeout(() => {
    fetch('openUC2_Maps_vs_Experiments.csv')
      .then(response => response.text())
      .then(txt => {
        EXP_DATA = parseUC2csv(txt);
        renderExpList();
        detailEl.classList.add("d-none");
        boxDetailEl.classList.add("d-none");
      })
      .catch(err => console.log('Could not auto-load CSV:', err));
  }, 100);
  
  // Mode switcher event listeners
  document.getElementById('experimentMode').addEventListener('change', () => {
    if (document.getElementById('experimentMode').checked) {
      switchMode('experiment');
    }
  });
  
  document.getElementById('boxMode').addEventListener('change', () => {
    if (document.getElementById('boxMode').checked) {
      switchMode('box');
    }
  });
});

document.getElementById("csvFileInput").addEventListener("change",ev=>{
  const file=ev.target.files[0];
  if(!file) return;
  file.text().then(txt=>{
    EXP_DATA=parseUC2csv(txt);
    if (currentMode === 'experiment') {
      renderExpList();
    } else {
      switchMode('box');
    }
    detailEl.classList.add("d-none");
    boxDetailEl.classList.add("d-none");
  });
});