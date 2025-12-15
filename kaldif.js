let data = [];
let grafik = null;

// daftar default watt untuk tiap barang
const defaultWatt = {
  "Pilih Barang": 0,
  "Kulkas": 150,
  "AC": 1100,
  "Setrika": 300,
  
  "Lampu": 10,
  "Kipas Angin": 50,
  "Mesin Cuci": 400,
  "TV": 100,
  "Rice Cooker": 300
};

function add(n = '', w = 0, j = 0, h = 0) {
  // Validasi: kalau ada niblai negatif, langsung stop
  if (w < 0 || j < 0 || h < 0) {
    alert("Nilai tidak boleh negatif!");
    return;
  }

  // Paksa nilai jadi mutlak (opsional, biar aman)
  let watt   = Math.abs(parseFloat(w));
  let jumlah = Math.abs(parseInt(j));
  let jam    = Math.abs(parseFloat(h));

  if (isNaN(watt)) watt = 0;
  if (isNaN(jumlah)) jumlah = 0;
  if (isNaN(jam)) jam = 0;

  data.push({ nama: n, watt: watt, jumlah: jumlah, jam: jam, custom: false });
  render();
}

function contoh(){
  add("AC",1100,1,8);
  add("Kulkas",150,1,24);
  add("Lampu",10,6,6);
}

function render(){
  let tb = document.getElementById("tabel");
  tb.innerHTML = "";

  data.forEach((d,i)=>{
    tb.innerHTML += `
      <tr>
        <td data-label="Nama Barang">
          <select onchange="handleSelect(${i}, this.value)">
            <option value="Pilih Barang" ${d.nama==="Pilih Barang"?"selected":""}>Pilih Barang</option>
            <option value="Kulkas" ${d.nama==="Kulkas"?"selected":""}>Kulkas</option>
            <option value="AC" ${d.nama==="AC"?"selected":""}>AC</option>
            <option value="Setrika" ${d.nama==="Setrika"?"selected":""}>Setrika</option>
            <option value="Lampu" ${d.nama==="Lampu"?"selected":""}>Lampu</option>
            <option value="Kipas Angin" ${d.nama==="Kipas Angin"?"selected":""}>Kipas Angin</option>
            <option value="Mesin Cuci" ${d.nama==="Mesin Cuci"?"selected":""}>Mesin Cuci</option>
            <option value="TV" ${d.nama==="TV"?"selected":""}>TV</option>
            <option value="Rice Cooker" ${d.nama==="Rice Cooker"?"selected":""}>Rice Cooker</option>
            <option value="lainnya" ${d.custom?"selected":""}>Barang lainnya</option>
          </select>

          ${d.custom ? `
            <input type="text"
              value="${d.nama}"
              placeholder="Nama barang..."
              onchange="upd(${i},'nama',this.value)">
          ` : ""}
        </td>

        <td data-label="Daya (W)">
          <input type="number" min="0"
            value="${d.watt}"
            onchange="upd(${i},'watt',this.value)">
        </td>

        <td data-label="Jumlah">
          <input type="number" min="0"
            value="${d.jumlah}"
            onchange="upd(${i},'jumlah',this.value)">
        </td>

        <td data-label="Waktu">
          <div class="time-picker">
            <select class="jam" onchange="updManualWaktu(${i})">
              ${[...Array(25).keys()].map(j =>
                `<option value="${j}" ${Math.floor(d.jam)===j?"selected":""}>
                  ${String(j).padStart(2,"0")}
                </option>`
              ).join("")}
            </select>
            :
            <select class="menit" onchange="updManualWaktu(${i})">
              ${[...Array(60).keys()].map(m =>
                `<option value="${m}" ${Math.round((d.jam%1)*60)===m?"selected":""}>
                  ${String(m).padStart(2,"0")}
                </option>`
              ).join("")}
            </select>
          </div>
        </td>

        <td data-label="Aksi">
          <button onclick="hapus(${i})" class="outline">Hapus</button>
        </td>
      </tr>
    `;
  });
}


function handleSelect(i, val){
  if(val==="lainnya"){
    data[i].custom = true;
    data[i].nama = "";
  } else {
    data[i].custom = false;
    data[i].nama = val;
    // set watt default sesuai barang
    if(defaultWatt[val]){
      data[i].watt = defaultWatt[val];
    }
  }
  render();
}

function upd(i,f,v){
  let val = Number(v);
  if(val < 0){
    showToast("⚠️ Nilai tidak boleh negatif!");
    val = Math.abs(val); // otomatis jadi mutlak
  }
  data[i][f] = (f==="nama") ? v : val;
}

function hapus(i){
  data.splice(i,1);
  render();
}

function resetTabel(){
  data=[];
  render();
  document.getElementById("kwh").innerText="0";
  document.getElementById("tagihan").innerText="Rp 0";
  document.getElementById("boros").innerText="-";
  document.getElementById("hemat").innerText="Rp 0";
  document.getElementById("rek").innerHTML="";
  if(grafik){ grafik.destroy(); }
}

function hitung(){
  const tarif = Number(document.getElementById("tarif").value);

  if(data.length===0){
    alert("Masukkan peralatan dulu!");
    return;
  }

  let hasil = data.map(x=>{
    let kwh = x.watt*x.jumlah*x.jam/1000*hari;
    let biaya = kwh * tarif;
    return {...x,kwh,biaya};
  });

  let totalKWH = hasil.reduce((a,b)=>a+b.kwh,0);
  let totalBiaya = hasil.reduce((a,b)=>a+b.biaya,0);
  document.getElementById("kwh").innerText = totalKWH.toFixed(1);
  document.getElementById("tagihan").innerText = "Rp "+totalBiaya.toLocaleString("id-ID");

  hasil.sort((a,b)=>b.biaya-a.biaya);
  let boros = hasil[0];
  document.getElementById("boros").innerText = boros.nama;

  let hemat = boros.watt*boros.jumlah/1000 * tarif * hari;
  document.getElementById("hemat").innerText = "Rp "+hemat.toLocaleString("id-ID");

  if(grafik) grafik.destroy();
  grafik = new Chart(document.getElementById("grafik"),{
    type:"bar",
    data:{
      labels:hasil.map(h=>h.nama),
      datasets:[{
        data:hasil.map(h=>h.kwh),
        backgroundColor:"rgba(15,98,254,0.8)"
      }]
    }
  });

  let ul = document.getElementById("rek");
  ul.innerHTML = `
    <li>Kurangi pemakaian <b>${boros.nama}</b></li>
    <li>Gunakan peralatan hemat energi.</li>
    <li>Matikan alat bila tidak dipakai.</li>
  `;
}

// --- Catatan Harian ---
let logHarian = JSON.parse(localStorage.getItem("logHarian")) || [];
renderLog();

function catatHari(){
  let tanggal = new Date().toISOString().slice(0,10);
  data.forEach(d=>{
    logHarian.push({
      tanggal,
      nama: d.nama,
      watt: d.watt,
      jumlah: d.jumlah,
      jam: d.jam
    });
  });
  localStorage.setItem("logHarian", JSON.stringify(logHarian));
  renderLog();

  // setelah catat, reset tabel peralatan
  resetTabel();
}

function renderLog(){
  let tb = document.getElementById("logTabel");
  if(!tb) return;
  tb.innerHTML = "";
  logHarian.forEach((l,i)=>{
    tb.innerHTML += `<tr>
      <td>${l.tanggal}</td>
      <td>${l.nama}</td>
      <td>${l.watt}</td>
      <td>${l.jumlah}</td>
      <td>${convertJamToText(l.jam)}</td>
      <td class="aksi">
        <button onclick="editLog(${i})">Edit</button>
        <button class="hapus" onclick="hapusLog(${i})">Hapus</button>
      </td>
    </tr>`;
  });
}

let editIndex = null;

function editLog(i){
  editIndex = i;
  const item = logHarian[i];

  editNama.value = item.nama;
  editWatt.value = item.watt;
  editJumlah.value = item.jumlah;

  isiSelect(editJam, 0, 24, Math.floor(item.jam));
  isiSelect(editMenit, 0, 59, Math.round((item.jam % 1) * 60));

  modalEdit.classList.remove("hidden");
}

function simpanEdit(){
  if(editIndex === null) return;

  const jam = Number(editJam.value);
  const menit = Number(editMenit.value);

  if(
    isNaN(jam) || jam < 0 || jam > 24 ||
    isNaN(menit) || menit < 0 || menit > 59
  ){
    showToast("⚠️ Waktu tidak valid");
    return;
  }

  logHarian[editIndex] = {
    ...logHarian[editIndex],
    nama: editNama.value,
    watt: Number(editWatt.value),
    jumlah: Number(editJumlah.value),
    jam: jam + (menit / 60)
  };

  localStorage.setItem("logHarian", JSON.stringify(logHarian));
  renderLog();
  tutupModal();
}


function hapusLog(i){
  logHarian.splice(i,1);
  localStorage.setItem("logHarian", JSON.stringify(logHarian));
  renderLog();
}

function resetLog(){
  logHarian = [];
  localStorage.removeItem("logHarian");
  renderLog();
}

function hitungLog(){
  const tarif = Number(document.getElementById("tarif").value);
  if(logHarian.length===0){ alert("Belum ada catatan harian!"); return; }

  // agregasi per alat
  let hasilMap = {};
  logHarian.forEach(l=>{
    if(!hasilMap[l.nama]) hasilMap[l.nama] = {watt:l.watt, jumlah:l.jumlah, jam:0};
    hasilMap[l.nama].jam += l.jam;
  });

  let hasil = Object.keys(hasilMap).map(nama=>{
    let h = hasilMap[nama];
    let kwh = h.watt*h.jumlah*h.jam/1000;
    let biaya = kwh * tarif;
    return {nama, watt:h.watt, jumlah:h.jumlah, jam:h.jam, kwh, biaya};
  });

  tampilkanHasil(hasil, tarif);
}

// fungsi umum untuk menampilkan hasil
function tampilkanHasil(hasil, tarif){
  let totalKWH = hasil.reduce((a,b)=>a+b.kwh,0);
  let totalBiaya = hasil.reduce((a,b)=>a+b.biaya,0);
  document.getElementById("kwh").innerText = totalKWH.toFixed(1);
  document.getElementById("tagihan").innerText = "Rp "+totalBiaya.toLocaleString("id-ID");

  hasil.sort((a,b)=>b.biaya-a.biaya);
  let boros = hasil[0];
  document.getElementById("boros").innerHTML = " " + boros.nama;

  let hemat = boros.watt*boros.jumlah/1000 * tarif; // potensi hemat per hari
  document.getElementById("hemat").innerHTML =" Rp " + hemat.toLocaleString("id-ID");
  
  if (grafik) grafik.destroy();

grafik = new Chart(document.getElementById("grafik"), {
  type: "bar",
  data: {
    labels: hasil.map(h => h.nama),
    datasets: [{
      data: hasil.map(h => h.kwh),
      backgroundColor: hasil.map((h, i) =>
        i === 0
          ? "rgba(239,68,68,0.9)"   // 🔥 paling boros
          : "rgba(34,211,238,0.8)" // normal
      ),
      borderRadius: 8
    }]
  },
  options: {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.raw.toFixed(2)} kWh`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});


  let ul = document.getElementById("rek");
ul.innerHTML = hasil.map(h =>
  `<li>${smartInsight(h, totalKWH)}</li>`
).join("");

}

// ==== HELP BUTTON SCRIPT ====

const helpBtn = document.getElementById("helpBtn");
const helpPopup = document.getElementById("helpPopup");
const closeHelp = document.getElementById("closeHelp");

helpBtn.addEventListener("click", () => {
    helpPopup.style.display = "flex";
});

closeHelp.addEventListener("click", () => {
    helpPopup.style.display = "none";
});

helpPopup.addEventListener("click", (e) => {
    if (e.target === helpPopup) {
        helpPopup.style.display = "none";
    }
}); 

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("courier", "bold"); // pakai font monospaced biar sejajar
  doc.setFontSize(14);

  let y = 20;

  // Header
  doc.text("LAPORAN PENGELUARAN LISTRIK", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);

  // Ringkasan
  const today = new Date().toLocaleDateString("id-ID");
  const totalKWH = document.getElementById("kwh").innerText;
  const totalTagihan = document.getElementById("tagihan").innerText;
  const boros = document.getElementById("boros").innerText;
  const hemat = document.getElementById("hemat").innerText;

  // Label dibuat sama panjang, titik dua sejajar
  doc.text(`Tanggal Cetak   : ${today}`, 14, y); y += 8;
  doc.text(`Total Pemakaian : ${totalKWH} kWh`, 14, y); y += 8;
  doc.text(`Total Tagihan   : ${totalTagihan}`, 14, y); y += 8;
  doc.text(`Paling Boros    : ${boros}`, 14, y); y += 8;
  doc.text(`Potensi Hemat   : ${hemat}`, 14, y); y += 12;

  // Garis sebelum tabel
  doc.setLineWidth(0.5);
  doc.line(14, y, 195, y);
  y += 6;

  // Tabel Catatan Harian
  const rows = logHarian.map(l => [
    l.tanggal,
    l.nama,
    `${l.watt} W`,
    l.jumlah,
    convertJamToText(l.jam)
  ]);

  doc.autoTable({
    head: [["Tanggal", "Nama Barang", "Daya", "Jumlah", "Jam"]],
    body: rows,
    startY: y,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3, halign: "left" },
    headStyles: { fillColor: [30, 55, 83], textColor: 255, fontStyle: "bold" }
  });

  // Footer
  const footerY = doc.lastAutoTable.finalY + 10;
  doc.line(14, footerY, 195, footerY);
  doc.text("*** Terima kasih telah menggunakan ***", 105, footerY + 6, { align: "center" });
  doc.text("=== Energy Optimizer ===", 105, footerY + 12, { align: "center" });
  doc.line(14, footerY + 18, 195, footerY + 18);

  doc.save("laporan_tagihan.pdf");
}

function generateStruk() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });

  doc.setFont("courier", "normal");
  doc.setFontSize(11);

  let y = 10;

  // Header
  doc.text("=== STRUK PENGELUARAN LISTRIK ===", 40, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.5);
  doc.line(5, y, 75, y);
  y += 6;

  // Ringkasan
  const today = new Date().toLocaleDateString("id-ID");
  const totalKWH = document.getElementById("kwh").innerText;
  const totalTagihan = document.getElementById("tagihan").innerText;
  const boros = document.getElementById("boros").innerText;
  const hemat = document.getElementById("hemat").innerText;

  doc.text(`Tanggal : ${today}`, 6, y); y += 6;
  doc.text(`Total   : ${totalKWH} kWh`, 6, y); y += 6;
  doc.text(`Tagihan : ${totalTagihan}`, 6, y); y += 6;
  doc.text(`Boros   : ${boros}`, 6, y); y += 6;
  doc.text(`Hemat   : ${hemat}`, 6, y); y += 6;

  doc.line(5, y, 75, y);
  y += 6;
  doc.text("Detail Barang:", 6, y); y += 6;

  // Detail barang dengan wrap nama panjang + angka+satuan sejajar
  doc.setFontSize(9);
  logHarian.forEach(l => {
    const namaWrapped = doc.splitTextToSize(l.nama, 22);

    const jumlah = l.jumlah + "x";
    const jam = convertJamToText(l.jam);
    const watt   = l.watt + "W";

    // Baris pertama: sejajar dengan garis kiri & kanan
    doc.text(namaWrapped[0], 6, y);   // sejajar kiri
    doc.text(jumlah, 32, y);          // jumlah agak ke kanan
    doc.text(jam, 46, y);             // jam di tengah
    doc.text(watt, 72, y, { align: "right" }); // watt sejajar kanan
    y += 5;

    // Baris tambahan untuk nama panjang (hanya nama)
    for (let i = 1; i < namaWrapped.length; i++) {
      doc.text(namaWrapped[i], 6, y);
      y += 5;
    }
  });
  doc.setFontSize(11);

  // Footer
  y += 4;
  doc.line(5, y, 75, y); y += 6;
  doc.text("*** Terima kasih telah menggunakan***", 40, y, { align: "center" }); y += 6;
  doc.text("=== Energy Optimizer ===", 40, y, { align: "center" }); y += 6;
  doc.line(5, y, 75, y);

  doc.save("struk_listrik.pdf");
}

// Toggle step accordion
document.querySelectorAll(".step-header").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const body = btn.nextElementSibling;
    // Tutup semua step lain
    document.querySelectorAll(".step-body").forEach(b=>{
      if(b !== body) b.style.display = "none";
    });
    // Toggle step yang diklik
    body.style.display = body.style.display === "block" ? "none" : "block";
  });
});

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000); // hilang setelah 3 detik
}

function convertJamToText(jamDecimal){
  let jam = Math.floor(jamDecimal);
  let menit = Math.round((jamDecimal % 1) * 60);
  return `${String(jam).padStart(2,"0")}:${String(menit).padStart(2,"0")}`;
}

function updManualWaktu(i){
  const row = document.querySelectorAll("#tabel tr")[i];
  if(!row) return;

  const jam = Number(row.querySelector(".jam").value);
  const menit = Number(row.querySelector(".menit").value);

  if(
    isNaN(jam) || jam < 0 || jam > 24 ||
    isNaN(menit) || menit < 0 || menit > 59
  ){
    showToast("⚠️ Waktu tidak valid");
    return;
  }

  data[i].jam = jam + (menit / 60);
}

function isiSelect(el, min, max, selected){
  el.innerHTML = "";
  for(let i=min;i<=max;i++){
    el.innerHTML += `
      <option value="${i}" ${i===selected?"selected":""}>
        ${String(i).padStart(2,"0")}
      </option>`;
  }
}

function tutupModal(){
  modalEdit.classList.add("hidden");
}

function smartInsight(item, totalKwh) {
  const persen = (item.kwh / totalKwh) * 100;

  if (item.nama.toLowerCase().includes("ac") && persen > 40) {
    return "❄️ AC menyumbang >40% pemakaian. Naikkan suhu 1–2°C untuk lebih hemat.";
  }

  if (persen > 30) {
    return `⚠️ ${item.nama} sangat boros (${persen.toFixed(1)}%). Kurangi durasi pemakaian.`;
  }

  if (persen < 10) {
    return `✅ ${item.nama} sudah efisien. Pertahankan pemakaiannya.`;
  }

  return `ℹ️ ${item.nama} pemakaian masih normal.`;
}

const rekomendasiWatt = {
  "ac": { min: 600, max: 800 },
  "kulkas": { min: 90, max: 120 },
  "lampu": { min: 5, max: 9 },
  "mesin cuci": { min: 250, max: 350 },
  "tv": { min: 60, max: 90 },
  "rice cooker": { min: 200, max: 300 }
};

const saranRealistis = {
  "ac": [
    "Naikkan suhu AC ke 26–27°C",
    "Gunakan timer saat tidur",
    "Pastikan pintu dan jendela tertutup rapat"
  ],
  "mesin cuci": [
    "Cuci pakaian dalam kondisi penuh (full load)",
    "Hindari mencuci sedikit-sedikit",
    "Gunakan mode air dingin jika tersedia"
  ],
  "lampu": [
    "Matikan lampu di ruangan kosong",
    "Manfaatkan cahaya matahari di siang hari"
  ],
  "tv": [
    "Aktifkan eco mode",
    "Kurangi tingkat kecerahan layar"
  ],
  "kulkas": [
    "Jangan sering buka-tutup pintu",
    "Pastikan karet pintu tertutup rapat",
    "Atur suhu sesuai kebutuhan"
  ]
};

function saranNyata() {
  if (!logHarian || logHarian.length === 0) {
    showToast("⚠️ Belum ada data pemakaian");
    return;
  }

  let map = {};
  logHarian.forEach(l => {
    if (!map[l.nama]) {
      map[l.nama] = { watt: l.watt, jam: 0 };
    }
    map[l.nama].jam += l.jam;
  });

  let hasil = Object.keys(map).map(nama => {
    let h = map[nama];
    let kwh = h.watt * h.jam / 1000;
    return { nama, ...h, kwh };
  });

  hasil.sort((a, b) => b.kwh - a.kwh);
  let target = hasil[0];

  let key = target.nama.toLowerCase();
  let tips = saranRealistis[key];

  if (!tips) {
    showToast(`ℹ️ Gunakan ${target.nama} secara bijak untuk menghemat listrik`);
    return;
  }

  showToast(
    `💡 ${target.nama} boros → tips nyata:\n• ${tips.join("\n• ")}`
  );
}