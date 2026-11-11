import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
import {
  LayoutDashboard, ClipboardList, BookOpen, Users, BarChart3, Settings, ShieldCheck,
  Search, Bell, Plus, Clock3, CheckCircle2, FileText, Menu, X,
  GraduationCap, CalendarDays, CircleHelp, ArrowUpRight, Info, Download, Pencil,
  Trash2, Play, Pause, Eye, Save, Upload, RotateCcw, Check, AlertTriangle
} from "lucide-react";

type Status = "Aktif" | "Terjadwal" | "Selesai";
type Exam = { id: number; title: string; subject: string; className: string; date: string; duration: number; status: Status; participants: number };
type Question = { id: number; subject: string; className: string; prompt: string; type: "Pilihan ganda" | "Benar/Salah" | "Esai"; answer: string };
type Student = { id: number; name: string; nis: string; className: string };
type Page = "Dashboard" | "Ujian" | "Bank Soal" | "Peserta" | "Hasil & Laporan" | "Pengaturan" | "Anti-Kecurangan" | "Tentang Aplikasi";
type ImportKind = "questions" | "students";
type ImportPreview = { questions: Question[]; students: Student[]; warnings: string[]; detectedSubject: string; detectedClass: string };

const initialExams: Exam[] = [
  { id: 1, title: "Penilaian Harian — Aljabar", subject: "Matematika", className: "X IPA 1", date: "2026-11-11", duration: 60, status: "Aktif", participants: 32 },
  { id: 2, title: "Kuis Sistem Pencernaan", subject: "Biologi", className: "XI IPA 2", date: "2026-11-12", duration: 45, status: "Terjadwal", participants: 30 },
  { id: 3, title: "Latihan Teks Eksplanasi", subject: "Bahasa Indonesia", className: "XII IPS 1", date: "2026-11-10", duration: 50, status: "Selesai", participants: 28 }
];
const initialStudents: Student[] = [
  { id: 1, name: "Andi Saputra", nis: "10231", className: "X IPA 1" },
  { id: 2, name: "Bunga Lestari", nis: "10232", className: "X IPA 1" },
  { id: 3, name: "Citra Amelia", nis: "11201", className: "XI IPA 2" },
  { id: 4, name: "Dimas Pratama", nis: "12211", className: "XII IPS 1" }
];
const initialQuestions: Question[] = [
  { id: 1, subject: "Matematika", className: "X IPA 1", prompt: "Berapakah hasil dari 2x + 4 = 10?", type: "Pilihan ganda", answer: "x = 3" },
  { id: 2, subject: "Biologi", className: "XI IPA 2", prompt: "Lambung merupakan bagian dari sistem pencernaan.", type: "Benar/Salah", answer: "Benar" }
];
const navItems: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard }, { label: "Ujian", icon: ClipboardList },
  { label: "Bank Soal", icon: BookOpen }, { label: "Peserta", icon: Users },
  { label: "Hasil & Laporan", icon: BarChart3 }, { label: "Anti-Kecurangan", icon: ShieldCheck },
  { label: "Pengaturan", icon: Settings }, { label: "Tentang Aplikasi", icon: Info }
];
const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const fmtDate = (date: string) => { if (!date) return "—"; const d = new Date(`${date}T00:00:00`); return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }); };

const cleanHeader = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[\s_./-]+/g, "");
const findColumn = (headers: string[], aliases: string[]) => headers.findIndex(h => aliases.includes(cleanHeader(h)));
const textValue = (value: unknown) => String(value ?? "").trim();
const inferSubject = (fileName: string, rows: Record<string, unknown>[], plainText = "") => {
  const fromRow = rows.map(r => textValue(r.MataPelajaran ?? r.mapel ?? r.Pelajaran ?? r.subject)).find(Boolean);
  if (fromRow) return fromRow;
  const textMatch = plainText.match(/(?:mata\s*pelajaran|mapel|pelajaran)\s*[:=-]\s*([^\r\n]+)/i);
  if (textMatch?.[1]) return textMatch[1].trim();
  const known = ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Fisika", "Kimia", "Biologi", "Sejarah", "Geografi", "Ekonomi", "Sosiologi", "PPKn", "Informatika", "PJOK", "Seni Budaya"];
  return known.find(x => fileName.toLowerCase().includes(x.toLowerCase())) ?? "Belum ditentukan";
};
const inferClass = (fileName: string, rows: Record<string, unknown>[], plainText = "") => {
  const fromRow = rows.map(r => textValue(r.Kelas ?? r.className ?? r.Rombel)).find(Boolean);
  if (fromRow) return fromRow;
  const textMatch = plainText.match(/(?:kelas|rombel)\s*[:=-]\s*([^\r\n]+)/i);
  if (textMatch?.[1]) return textMatch[1].trim();
  const match = fileName.match(/(?:kelas|kls)?[ _-]*(XII|XI|X|12|11|10)[ _-]*(?:IPA|IPS)?[ _-]*\d*/i);
  return match?.[0]?.replace(/[_-]/g, " ").trim() ?? "Semua kelas";
};

async function readImportFile(file: File): Promise<{ rows: Record<string, unknown>[]; plainText: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    const plainText = await file.text();
    const workbook = XLSX.read(plainText, { type: "string" });
    const first = workbook.Sheets[workbook.SheetNames[0]];
    return { rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(first, { defval: "" }), plainText };
  }
  if (ext === "xlsx" || ext === "xls") {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const first = workbook.Sheets[workbook.SheetNames[0]];
    return { rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(first, { defval: "" }), plainText: XLSX.utils.sheet_to_csv(first) };
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { rows: [], plainText: result.value };
  }
  if (ext === "pdf") {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) { const page = await doc.getPage(i); const content = await page.getTextContent(); pages.push(content.items.map(item => ("str" in item ? item.str : "")).join(" ")); }
    return { rows: [], plainText: pages.join("\n") };
  }
  throw new Error("Format belum didukung. Gunakan XLSX, XLS, CSV, DOCX, atau PDF.");
}

function parseQuestionText(text: string, subject: string, className: string): Question[] {
  const normalized = text.replace(/\r/g, "").split("\n").filter(line => !/^(?:mata\s*pelajaran|mapel|pelajaran|kelas|rombel)\s*[:=-]/i.test(line.trim())).join("\n").replace(/\n{2,}/g, "\n");
  const chunks = normalized.split(/(?=(?:^|\s)(?:Soal\s*)?(?:Nomor\s*)?\d{1,3}[.)]\s)/i).map(x => x.trim()).filter(Boolean);
  const parsed: Question[] = [];
  for (const chunk of chunks) {
    const prompt = chunk.replace(/^\s*(?:(?:Soal\s*)?(?:Nomor\s*)?\d{1,3}[.)\s:-])\s*/i, "").split(/\n\s*(?:Kunci(?:\s*Jawaban)?|Jawaban\s*Benar)\s*[:=-]/i)[0].trim();
    if (prompt.length < 8) continue;
    const answerMatch = chunk.match(/(?:Kunci(?:\s*Jawaban)?|Jawaban\s*Benar)\s*[:=-]\s*(.+)/i);
    const type = /(?:^|\s)[A-E][.)]\s/.test(prompt) ? "Pilihan ganda" : /benar\s*\/\s*salah/i.test(prompt) ? "Benar/Salah" : "Esai";
    parsed.push({ id: Date.now() + parsed.length, subject, className, prompt, type, answer: answerMatch?.[1]?.split(/\r?\n/)[0]?.trim() ?? "Perlu diisi" });
  }
  return parsed;
}

function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [exams, setExams] = useState<Exam[]>(() => load("smartujian.exams", initialExams));
  const [students, setStudents] = useState<Student[]>(() => load("smartujian.students", initialStudents));
  const [questions, setQuestions] = useState<Question[]>(() => load("smartujian.questions", initialQuestions));
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState<"exam" | "question" | "student" | null>(null);
  const [importKind, setImportKind] = useState<ImportKind | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [toast, setToast] = useState("");
  const [security, setSecurity] = useState(() => load("smartujian.security", { fullscreen: true, focusWarning: true, shuffle: false, autoSubmit: true, activityLog: true }));
  const [settings, setSettings] = useState(() => load("smartujian.settings", { school: "SMA NEGERI 8 BANDA ACEH", timezone: "Asia/Jakarta (WIB)", language: "Bahasa Indonesia", examDuration: 60, passingGrade: 75, adminName: "Administrator" }));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reportClass, setReportClass] = useState("Semua kelas");
  const [reportExam, setReportExam] = useState("Semua ujian");

  useEffect(() => { localStorage.setItem("smartujian.exams", JSON.stringify(exams)); }, [exams]);
  useEffect(() => { localStorage.setItem("smartujian.students", JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem("smartujian.questions", JSON.stringify(questions)); }, [questions]);
  useEffect(() => { localStorage.setItem("smartujian.security", JSON.stringify(security)); }, [security]);
  useEffect(() => { localStorage.setItem("smartujian.settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(id); }, [toast]);

  const filteredExams = useMemo(() => exams.filter(e => `${e.title} ${e.subject} ${e.className} ${e.status}`.toLowerCase().includes(query.toLowerCase())), [exams, query]);
  const filteredStudents = useMemo(() => students.filter(s => `${s.name} ${s.nis} ${s.className}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const filteredQuestions = useMemo(() => questions.filter(q => `${q.prompt} ${q.subject} ${q.className}`.toLowerCase().includes(query.toLowerCase())), [questions, query]);
  const finished = exams.filter(e => e.status === "Selesai");
  const participantTotal = students.length;
  const questionSubjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));
  const studentClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean)));
  const classCounts = studentClasses.map(className => ({ className, count: students.filter(s => s.className === className).length }));

  function saveExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const item: Exam = { id: editingExam?.id ?? Date.now(), title: String(d.get("title")), subject: String(d.get("subject")), className: String(d.get("className")), date: String(d.get("date")), duration: Number(d.get("duration")), status: (String(d.get("status")) as Status) || "Terjadwal", participants: Number(d.get("participants") || 0) };
    setExams(prev => editingExam ? prev.map(x => x.id === item.id ? item : x) : [item, ...prev]); setEditingExam(null); setModal(null); setToast(editingExam ? "Data ujian diperbarui." : "Ujian berhasil ditambahkan.");
  }
  function saveQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const item: Question = { id: editingQuestion?.id ?? Date.now(), subject: String(d.get("subject")), className: String(d.get("className")), prompt: String(d.get("prompt")), type: String(d.get("type")) as Question["type"], answer: String(d.get("answer")) };
    setQuestions(prev => editingQuestion ? prev.map(x => x.id === item.id ? item : x) : [item, ...prev]); setEditingQuestion(null); setModal(null); setToast("Soal berhasil disimpan.");
  }
  function saveStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    setStudents(prev => [{ id: Date.now(), name: String(d.get("name")), nis: String(d.get("nis")), className: String(d.get("className")) }, ...prev]); setModal(null); setToast("Peserta berhasil ditambahkan.");
  }
  function downloadImportTemplate(kind: ImportKind) {
    const rows = kind === "questions"
      ? [["Pertanyaan", "Mata Pelajaran", "Kelas", "Jenis", "Kunci Jawaban"], ["Contoh: Hasil dari 2 + 2 adalah ...", "Matematika", "X-1", "Pilihan ganda", "4"]]
      : [["Nama", "NIS", "Kelas"], ["Andi Saputra", "10001", "X-1"]];
    const csv = "\uFEFF" + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = kind === "questions" ? "template-import-soal.csv" : "template-import-siswa.csv"; a.click(); URL.revokeObjectURL(url);
  }
  async function handleImportFile(file?: File) {
    if (!file || !importKind) return;
    setImportBusy(true); setImportPreview(null);
    try {
      const { rows, plainText } = await readImportFile(file);
      const subject = inferSubject(file.name, rows, plainText);
      const className = inferClass(file.name, rows, plainText);
      const warnings: string[] = [];
      let importedQuestions: Question[] = [];
      let importedStudents: Student[] = [];
      if (importKind === "students") {
        const headers = rows.length ? Object.keys(rows[0]) : [];
        const nameKey = findColumn(headers, ["nama", "namasiswa", "namalengkap", "name"]);
        const nisKey = findColumn(headers, ["nis", "nisn", "nomorinduksiswa", "nomorinduk"]);
        const classKey = findColumn(headers, ["kelas", "rombel", "class", "classname"]);
        if (nameKey < 0 || nisKey < 0 || classKey < 0) throw new Error("Kolom siswa belum dikenali. Header wajib: Nama, NIS, Kelas.");
        importedStudents = rows.map((r, i) => ({ id: Date.now() + i, name: textValue(r[headers[nameKey]]), nis: textValue(r[headers[nisKey]]), className: textValue(r[headers[classKey]]) })).filter(s => s.name && s.nis && s.className);
        if (!importedStudents.length) warnings.push("Tidak ada baris siswa lengkap yang ditemukan.");
      } else {
        if (rows.length) {
          const headers = Object.keys(rows[0]);
          const promptKey = findColumn(headers, ["pertanyaan", "soal", "question", "prompt"]);
          const subjectKey = findColumn(headers, ["mapel", "matapelajaran", "pelajaran", "subject"]);
          const classKey = findColumn(headers, ["kelas", "rombel", "class", "classname"]);
          const answerKey = findColumn(headers, ["kunci", "kuncijawaban", "jawaban", "answer"]);
          const typeKey = findColumn(headers, ["jenis", "jenissoal", "type"]);
          if (promptKey >= 0) importedQuestions = rows.map((r, i) => {
            const rawType = typeKey >= 0 ? textValue(r[headers[typeKey]]).toLowerCase() : "";
            const questionType: Question["type"] = /benar|salah/.test(rawType) ? "Benar/Salah" : /esai|uraian/.test(rawType) ? "Esai" : "Pilihan ganda";
            return { id: Date.now() + i, subject: subjectKey >= 0 ? textValue(r[headers[subjectKey]]) || subject : subject, className: classKey >= 0 ? textValue(r[headers[classKey]]) || className : className, prompt: textValue(r[headers[promptKey]]), type: questionType, answer: answerKey >= 0 ? textValue(r[headers[answerKey]]) || "Perlu diisi" : "Perlu diisi" };
          }).filter(q => q.prompt);
        }
        if (!importedQuestions.length) importedQuestions = parseQuestionText(plainText, subject, className);
        if (!importedQuestions.length) throw new Error("Soal tidak terbaca. Gunakan tabel dengan kolom Pertanyaan, Mata Pelajaran, Kelas, Jenis, Kunci Jawaban atau teks bernomor 1., 2., dan seterusnya.");
        if (importedQuestions.some(q => q.answer === "Perlu diisi")) warnings.push("Sebagian kunci jawaban belum ditemukan. Periksa sebelum digunakan untuk ujian.");
        if (importedQuestions.some(q => q.subject === "Belum ditentukan")) warnings.push("Mata pelajaran belum terdeteksi; lengkapi atau ubah setelah impor.");
      }
      setImportPreview({ questions: importedQuestions, students: importedStudents, warnings, detectedSubject: subject, detectedClass: className });
    } catch (error) { setToast(error instanceof Error ? error.message : "File gagal dibaca."); }
    finally { setImportBusy(false); }
  }
  function confirmImport() {
    if (!importPreview || !importKind) return;
    if (importKind === "questions") { setQuestions(prev => [...importPreview.questions, ...prev]); setToast(`${importPreview.questions.length} soal berhasil diimpor.`); }
    else {
      const existing = new Set(students.map(s => s.nis.trim().toLowerCase()));
      const fresh = importPreview.students.filter(s => { const key = s.nis.trim().toLowerCase(); if (existing.has(key)) return false; existing.add(key); return true; });
      setStudents(prev => [...fresh, ...prev]);
      setToast(`${fresh.length} siswa diimpor. ${importPreview.students.length - fresh.length} data duplikat dilewati.`);
    }
    setImportKind(null); setImportPreview(null);
  }

  function removeItem<T extends {id:number}>(items: T[], setter: (v:T[])=>void, id:number, label:string) { if (window.confirm(`Hapus ${label} ini?`)) { setter(items.filter(x => x.id !== id)); setToast(`${label} dihapus.`); } }
  function exportCsv() {
    const rows = [["ID", "Nama Ujian", "Mata Pelajaran", "Kelas", "Tanggal", "Durasi Menit", "Status", "Peserta"], ...exams.filter(e => (reportClass === "Semua kelas" || e.className === reportClass) && (reportExam === "Semua ujian" || e.title === reportExam)).map(e => [String(e.id), e.title, e.subject, e.className, e.date, String(e.duration), e.status, String(e.participants)])];
    const csv = "\uFEFF" + rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "laporan-smart-ujian.csv"; a.click(); URL.revokeObjectURL(url); setToast("Laporan CSV berhasil diunduh.");
  }
  function resetDemo() { if (window.confirm("Kembalikan semua data browser ke data awal demo?")) { setExams(initialExams); setStudents(initialStudents); setQuestions(initialQuestions); setSecurity({ fullscreen: true, focusWarning: true, shuffle: false, autoSubmit: true, activityLog: true }); setToast("Data demo berhasil direset."); } }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><img src="/logo-sman8.png" alt="Logo SMA Negeri 8"/></div><div className="brand-copy"><b>SMART UJIAN</b><small>SMA NEGERI 8 BANDA ACEH</small></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X/></button></div>
      <div className="school-switch"><div className="school-avatar"><img src="/logo-sman8.png" alt="Logo sekolah"/></div><div><b>SMA NEGERI 8</b><small>Banda Aceh · Admin</small></div></div>
      <div className="nav-caption">MENU UTAMA</div>
      <nav>{navItems.map(item => <button key={item.label} className={`nav-item ${page === item.label ? "selected" : ""}`} onClick={() => {setPage(item.label); setMobileNav(false);}}><item.icon size={19}/><span>{item.label}</span>{item.label === "Ujian" && <span className="nav-count">{exams.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19}/><b>Butuh bantuan?</b><p>Gunakan menu Pengaturan untuk mengelola preferensi dashboard. Untuk akun resmi, hubungi administrator sekolah.</p></div><div className="profile"><div className="profile-avatar">AD</div><div><b>{settings.adminName}</b><small>Admin sekolah · Mode lokal</small></div></div></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Tutup menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><div className="searchbox"><Search size={17}/><input placeholder="Cari ujian, kelas, peserta..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={14}/></button>}</div><div className="notification-wrap"><button className="icon-button" aria-label="Notifikasi" onClick={() => setNotificationsOpen(v => !v)}><Bell size={19}/>{exams.some(e => e.status === "Aktif") && <i/>}</button>{notificationsOpen && <div className="notification-pop"><b>Notifikasi dashboard</b><p>{exams.filter(e => e.status === "Aktif").length} ujian berstatus aktif.</p><p>{exams.filter(e => e.status === "Terjadwal").length} ujian menunggu jadwal.</p></div>}</div><div className="top-avatar">AD</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">SMA NEGERI 8 BANDA ACEH</div><h1>{page}</h1><p>{page === "Dashboard" ? "Pantau dan kelola aktivitas ujian sekolah." : `Kelola ${page.toLowerCase()} SMART UJIAN.`}</p></div>{(page === "Dashboard" || page === "Ujian") && <button className="primary-btn" onClick={() => {setEditingExam(null);setModal("exam");}}><Plus size={18}/> Buat Ujian</button>}{page === "Bank Soal" && <button className="primary-btn" onClick={() => {setEditingQuestion(null);setModal("question");}}><Plus size={18}/> Tambah Soal</button>}{page === "Peserta" && <button className="primary-btn" onClick={() => setModal("student")}><Plus size={18}/> Tambah Peserta</button>}{page === "Hasil & Laporan" && <button className="primary-btn" onClick={exportCsv}><Download size={17}/> Ekspor CSV</button>}</div>

        {page === "Dashboard" && <>
          <div className="notice"><div className="notice-icon"><GraduationCap size={20}/></div><div><b>Selamat datang di SMART UJIAN</b><p>Dashboard aktif dalam mode penyimpanan lokal pada browser ini. Data belum tersinkron ke perangkat lain atau server sekolah.</p></div><span className="demo-tag">MODE LOKAL</span></div>
          <section className="stats-grid"><Stat icon={<ClipboardList/>} label="Total Ujian" value={String(exams.length)} note="Data pada browser ini" tone="blue"/><Stat icon={<Users/>} label="Peserta Terdaftar" value={String(participantTotal)} note="Daftar peserta lokal" tone="purple"/><Stat icon={<Clock3/>} label="Ujian Berlangsung" value={String(exams.filter(e => e.status === "Aktif").length)} note="Status ujian aktif" tone="orange"/><Stat icon={<CheckCircle2/>} label="Sudah Selesai" value={String(finished.length)} note="Ujian selesai" tone="green"/></section>
          <section className="panel"><div className="panel-head"><div><h2>Ujian terbaru</h2><p>Ubah status, edit, atau hapus data ujian</p></div><button className="text-btn" onClick={() => setPage("Ujian")}>Lihat semua <ArrowUpRight size={16}/></button></div><ExamTable exams={exams.slice(0,5)} onEdit={e=>{setEditingExam(e);setModal("exam");}} onDelete={id=>removeItem(exams,setExams,id,"ujian")} onStatus={(id,status)=>setExams(prev=>prev.map(e=>e.id===id?{...e,status}:e))}/></section>
          <div className="bottom-grid"><section className="panel"><div className="panel-head"><div><h2>Ringkasan sistem</h2><p>Jumlah konten yang tersimpan di browser</p></div></div><Activity icon={<FileText/>} title={`${questions.length} soal tersimpan`} desc="Bank soal lokal"/><Activity icon={<Users/>} title={`${students.length} peserta terdaftar`} desc="Data peserta lokal"/><Activity icon={<ShieldCheck/>} title={`${Object.values(security).filter(Boolean).length} pengaturan aktif`} desc="Preferensi anti-kecurangan"/></section><section className="panel tip-panel"><div className="tip-icon"><CalendarDays/></div><h2>Kelola persiapan ujian</h2><p>Buat jadwal, isi bank soal, daftarkan peserta, lalu ekspor ringkasan ujian untuk dokumentasi sekolah.</p><button className="secondary-btn" onClick={() => setPage("Ujian")}>Kelola jadwal</button></section></div>
        </>}
        {page === "Ujian" && <section className="panel"><div className="panel-head"><div><h2>Daftar ujian</h2><p>Tambah, ubah, hapus, dan ubah status ujian.</p></div><span className="count-pill">{filteredExams.length} ujian</span></div><ExamTable exams={filteredExams} onEdit={e=>{setEditingExam(e);setModal("exam");}} onDelete={id=>removeItem(exams,setExams,id,"ujian")} onStatus={(id,status)=>setExams(prev=>prev.map(e=>e.id===id?{...e,status}:e))}/></section>}
        {page === "Bank Soal" && <section className="panel"><div className="panel-head"><div><h2>Bank soal</h2><p>Kelola pertanyaan dan kunci jawaban di penyimpanan browser.</p></div><div className="row-actions"><button className="secondary-btn" onClick={()=>{setImportKind("questions");setImportPreview(null);}}><Upload size={15}/> Import soal</button><span className="count-pill">{filteredQuestions.length} soal</span></div></div><div className="auto-recap"><div><b>{questionSubjects.length}</b><small>Mata pelajaran terdeteksi</small></div><div><b>{new Set(questions.map(q=>q.className)).size}</b><small>Kelas pada bank soal</small></div><div><b>{questions.length}</b><small>Total soal tersimpan</small></div></div><div className="subject-chips">{questionSubjects.map(subject=><span key={subject}>{subject} <b>{questions.filter(q=>q.subject===subject).length}</b></span>)}</div><div className="table-wrap"><table><thead><tr><th>PERTANYAAN</th><th>MAPEL</th><th>KELAS</th><th>JENIS</th><th>KUNCI JAWABAN</th><th>AKSI</th></tr></thead><tbody>{filteredQuestions.map(q=><tr key={q.id}><td><b>{q.prompt}</b><small>ID: SOAL-{q.id}</small></td><td>{q.subject}</td><td>{q.className}</td><td>{q.type}</td><td>{q.answer}</td><td><div className="row-actions"><button className="action-btn" title="Edit" onClick={()=>{setEditingQuestion(q);setModal("question");}}><Pencil size={15}/></button><button className="action-btn danger" title="Hapus" onClick={()=>removeItem(questions,setQuestions,q.id,"soal")}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!filteredQuestions.length&&<div className="table-empty">Belum ada soal. Klik Tambah Soal untuk membuat soal pertama.</div>}</div></section>}
        {page === "Peserta" && <section className="panel"><div className="panel-head"><div><h2>Daftar peserta</h2><p>Kelola data siswa yang akan mengikuti ujian.</p></div><div className="row-actions"><button className="secondary-btn" onClick={()=>{setImportKind("students");setImportPreview(null);}}><Upload size={15}/> Import siswa</button><span className="count-pill">{filteredStudents.length} peserta</span></div></div><div className="auto-recap"><div><b>{students.length}</b><small>Total siswa terdaftar</small></div><div><b>{studentClasses.length}</b><small>Rombel terdeteksi</small></div><div><b>{new Set(students.map(s=>s.nis)).size}</b><small>NIS unik</small></div></div><div className="subject-chips">{classCounts.map(c=><span key={c.className}>{c.className} <b>{c.count} siswa</b></span>)}</div><div className="table-wrap"><table><thead><tr><th>NAMA SISWA</th><th>NIS</th><th>KELAS</th><th>AKSI</th></tr></thead><tbody>{filteredStudents.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.nis}</td><td>{s.className}</td><td><button className="action-btn danger" title="Hapus peserta" onClick={()=>removeItem(students,setStudents,s.id,"peserta")}><Trash2 size={15}/></button></td></tr>)}</tbody></table>{!filteredStudents.length&&<div className="table-empty">Tidak ada peserta yang cocok dengan pencarian.</div>}</div></section>}
        {page === "Hasil & Laporan" && <section className="panel"><div className="panel-head"><div><h2>Rekap ujian</h2><p>Filter daftar ujian dan unduh laporan CSV. Nilai siswa belum tersedia karena belum ada data pengerjaan.</p></div><span className="count-pill">{exams.length} data</span></div><div className="report-filters"><label>Filter kelas<select value={reportClass} onChange={e=>setReportClass(e.target.value)}><option>Semua kelas</option>{Array.from(new Set(exams.map(e=>e.className))).map(c=><option key={c}>{c}</option>)}</select></label><label>Filter ujian<select value={reportExam} onChange={e=>setReportExam(e.target.value)}><option>Semua ujian</option>{exams.map(e=><option key={e.id}>{e.title}</option>)}</select></label><button className="primary-btn" onClick={exportCsv}><Download size={16}/> Unduh CSV</button></div><ExamTable exams={exams.filter(e=>(reportClass==="Semua kelas"||e.className===reportClass)&&(reportExam==="Semua ujian"||e.title===reportExam))}/><div className="notice report-note"><AlertTriangle size={18}/><p>Laporan ini berisi data jadwal dan peserta, bukan nilai ujian. Penilaian otomatis dan rekap nilai membutuhkan modul pengerjaan ujian dan server.</p></div></section>}
        {page === "Anti-Kecurangan" && <section className="panel"><div className="panel-head"><div><h2>Perlindungan integritas ujian</h2><p>Aktif/nonaktifkan preferensi dan simpan pilihan di browser ini.</p></div><span className="status status-planned">Preferensi lokal</span></div><div className="toggle-list">{([ ["fullscreen","Mode layar penuh","Meminta aplikasi ujian memakai tampilan layar penuh."], ["focusWarning","Peringatan pindah aplikasi","Menyiapkan pencatatan saat halaman kehilangan fokus."], ["shuffle","Acak soal dan opsi","Menandai ujian agar soal dapat diacak saat modul ujian tersedia."], ["autoSubmit","Auto-submit saat waktu habis","Preferensi pengumpulan otomatis setelah durasi habis."], ["activityLog","Log aktivitas ujian","Menyimpan preferensi pencatatan aktivitas untuk modul ujian."] ] as const).map(([key,title,desc])=><div className="toggle-row" key={key}><div><b>{title}</b><p>{desc}</p><small>{security[key] ? "Aktif" : "Nonaktif"} · tersimpan lokal</small></div><label className="switch"><input type="checkbox" checked={security[key]} onChange={e=>setSecurity(prev=>({...prev,[key]:e.target.checked}))}/><span/></label></div>)}</div><div className="notice report-note"><AlertTriangle size={18}/><p>Pengaturan ini belum mengunci perangkat siswa atau mencegah kecurangan secara teknis. Implementasi nyata memerlukan aplikasi Android ujian, backend, dan pengujian perangkat.</p></div></section>}
        {page === "Pengaturan" && <form className="panel settings-form" onSubmit={e=>{e.preventDefault();setToast("Pengaturan berhasil disimpan di browser ini.");}}><div className="panel-head"><div><h2>Pengaturan sekolah</h2><p>Perubahan disimpan otomatis pada browser ini.</p></div><button className="primary-btn" type="submit"><Save size={16}/> Simpan pengaturan</button></div><label>Nama sekolah<input value={settings.school} onChange={e=>setSettings(p=>({...p,school:e.target.value}))}/></label><label>Nama administrator<input value={settings.adminName} onChange={e=>setSettings(p=>({...p,adminName:e.target.value}))}/></label><div className="form-grid"><label>Zona waktu<select value={settings.timezone} onChange={e=>setSettings(p=>({...p,timezone:e.target.value}))}><option>Asia/Jakarta (WIB)</option><option>Asia/Makassar (WITA)</option><option>Asia/Jayapura (WIT)</option></select></label><label>Bahasa<select value={settings.language} onChange={e=>setSettings(p=>({...p,language:e.target.value}))}><option>Bahasa Indonesia</option><option>English</option></select></label><label>Durasi ujian default (menit)<input type="number" min="1" max="300" value={settings.examDuration} onChange={e=>setSettings(p=>({...p,examDuration:Number(e.target.value)}))}/></label><label>KKM / nilai minimum<input type="number" min="0" max="100" value={settings.passingGrade} onChange={e=>setSettings(p=>({...p,passingGrade:Number(e.target.value)}))}/></label></div><div className="settings-actions"><button type="button" className="secondary-btn" onClick={resetDemo}><RotateCcw size={15}/> Reset data demo</button></div></form>}
        {page === "Tentang Aplikasi" && <section className="about-page"><div className="about-hero panel"><img className="about-logo" src="/logo-sman8.png" alt="Logo SMA Negeri 8 Banda Aceh"/><div><div className="eyebrow">INFORMASI APLIKASI · V1.0</div><h2>SMART UJIAN</h2><p>SMA NEGERI 8 BANDA ACEH</p><span className="about-date">11 November 2026</span></div></div><div className="about-grid"><section className="panel"><div className="about-label">Dibuat oleh</div><h3>RAFIYATULLAH</h3><p>Pengembang aplikasi SMART UJIAN.</p></section><section className="panel"><div className="about-label">Tujuan aplikasi</div><p>Aplikasi ini dibuat untuk mempermudah kegiatan ujian di SMA Negeri 8 Banda Aceh, mulai dari pengelolaan jadwal, peserta, pengerjaan ujian, hingga rekap hasil secara lebih teratur.</p></section></div><section className="panel"><div className="about-label">Manfaat aplikasi</div><div className="benefit-list"><p><b>01</b><span>Membantu guru mengatur jadwal dan pelaksanaan ujian.</span></p><p><b>02</b><span>Memudahkan siswa melihat jadwal dan ujian yang ditugaskan.</span></p><p><b>03</b><span>Membantu sekolah merangkum hasil dan laporan ujian.</span></p><p><b>04</b><span>Mengurangi penggunaan kertas jika ujian online diterapkan.</span></p><p><b>05</b><span>Membuat administrasi ujian lebih tertata dan mudah dipantau.</span></p></div></section><section className="panel about-note"><b>Catatan versi 1.0</b><p>Dashboard web versi ini menyimpan data lokal di browser. Login sekolah, sinkronisasi multi-perangkat, pelaksanaan ujian online, dan nilai resmi memerlukan backend yang belum diaktifkan.</p><strong>Tepat Waktu, Raih Prestasi</strong></section></section>}
        <footer>© 2026 SMART UJIAN · SMA NEGERI 8 BANDA ACEH · V1.0 <span>Dibuat oleh RAFIYATULLAH</span></footer>
      </div>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setModal(null);setEditingExam(null);setEditingQuestion(null);}}}><form className="modal" onSubmit={modal==="exam"?saveExam:modal==="question"?saveQuestion:saveStudent}><div className="modal-head"><div><h2>{modal==="exam"?(editingExam?"Edit ujian":"Buat ujian baru"):modal==="question"?(editingQuestion?"Edit soal":"Tambah soal"):"Tambah peserta"}</h2><p>Data akan disimpan di browser yang sedang digunakan.</p></div><button type="button" className="icon-button" onClick={()=>{setModal(null);setEditingExam(null);setEditingQuestion(null);}}><X/></button></div>
      {modal==="exam"&&<><label>Nama ujian<input name="title" required defaultValue={editingExam?.title} placeholder="Contoh: Penilaian Harian Bab 1"/></label><div className="form-grid"><label>Mata pelajaran<input name="subject" required defaultValue={editingExam?.subject} placeholder="Matematika"/></label><label>Kelas<input name="className" required defaultValue={editingExam?.className} placeholder="X IPA 1"/></label><label>Tanggal<input name="date" type="date" required defaultValue={editingExam?.date??new Date().toISOString().slice(0,10)}/></label><label>Durasi (menit)<input name="duration" type="number" min="1" max="300" defaultValue={editingExam?.duration??settings.examDuration} required/></label><label>Status<select name="status" defaultValue={editingExam?.status??"Terjadwal"}><option>Terjadwal</option><option>Aktif</option><option>Selesai</option></select></label><label>Jumlah peserta<input name="participants" type="number" min="0" defaultValue={editingExam?.participants??0}/></label></div></>}
      {modal==="question"&&<><label>Pertanyaan<textarea name="prompt" required defaultValue={editingQuestion?.prompt} rows={3} placeholder="Tulis pertanyaan di sini"/></label><div className="form-grid"><label>Mata pelajaran<input name="subject" required defaultValue={editingQuestion?.subject} placeholder="Matematika"/></label><label>Kelas<input name="className" required defaultValue={editingQuestion?.className} placeholder="X IPA 1"/></label><label>Jenis soal<select name="type" defaultValue={editingQuestion?.type??"Pilihan ganda"}><option>Pilihan ganda</option><option>Benar/Salah</option><option>Esai</option></select></label><label>Kunci jawaban<input name="answer" required defaultValue={editingQuestion?.answer} placeholder="Jawaban benar"/></label></div></>}
      {modal==="student"&&<><label>Nama lengkap<input name="name" required placeholder="Nama siswa"/></label><div className="form-grid"><label>NIS<input name="nis" required placeholder="Nomor induk siswa"/></label><label>Kelas<input name="className" required placeholder="X IPA 1"/></label></div></>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>{setModal(null);setEditingExam(null);setEditingQuestion(null);}}>Batal</button><button className="primary-btn" type="submit"><Check size={16}/> Simpan</button></div></form></div>}
    {importKind && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setImportKind(null);setImportPreview(null);}}}><section className="modal import-modal"><div className="modal-head"><div><h2>{importKind === "questions" ? "Import soal otomatis" : "Import data siswa otomatis"}</h2><p>Unggah file, periksa hasil pembacaan, lalu konfirmasi.</p></div><button type="button" className="icon-button" onClick={()=>{setImportKind(null);setImportPreview(null);}}><X/></button></div>
      {!importPreview && <><div className="import-drop"><Upload size={28}/><b>Pilih file untuk diimpor</b><p>{importKind === "questions" ? "Excel, CSV, Word, atau PDF" : "Excel atau CSV dengan kolom Nama, NIS, Kelas"}</p><input type="file" accept={importKind === "questions" ? ".xlsx,.xls,.csv,.txt,.docx,.pdf" : ".xlsx,.xls,.csv"} onChange={e=>handleImportFile(e.target.files?.[0])}/></div><div className="import-help"><div className="import-template-head"><b>Format yang disarankan</b><button type="button" className="text-btn" onClick={()=>downloadImportTemplate(importKind)}><Download size={14}/> Unduh template CSV</button></div><p>{importKind === "questions" ? "Pertanyaan | Mata Pelajaran | Kelas | Jenis | Kunci Jawaban. Sistem membaca kategori dari kolom atau nama file." : "Nama | NIS | Kelas. Setiap siswa harus memiliki NIS unik agar duplikat bisa dilewati."}</p></div>{importBusy && <p className="import-loading">Sedang membaca dan mengelompokkan file…</p>}</>}
      {importPreview && <><div className="import-summary"><div><b>{importKind === "questions" ? importPreview.questions.length : importPreview.students.length}</b><small>{importKind === "questions" ? "Soal terdeteksi" : "Siswa terdeteksi"}</small></div><div><b>{importKind === "questions" ? new Set(importPreview.questions.map(q=>q.subject)).size : new Set(importPreview.students.map(s=>s.className)).size}</b><small>{importKind === "questions" ? "Mata pelajaran" : "Rombel"}</small></div><div><b>{importKind === "questions" ? new Set(importPreview.questions.map(q=>q.className)).size : new Set(importPreview.students.map(s=>s.className)).size}</b><small>Kelas</small></div></div>{importPreview.warnings.map((w,i)=><div className="import-warning" key={i}><AlertTriangle size={15}/>{w}</div>)}<div className="table-wrap import-preview-table"><table><thead><tr>{importKind === "questions" ? <><th>PERTANYAAN</th><th>MAPEL</th><th>KELAS</th><th>KUNCI</th></> : <><th>NAMA</th><th>NIS</th><th>KELAS</th></>}</tr></thead><tbody>{(importKind === "questions" ? importPreview.questions.slice(0,8) : importPreview.students.slice(0,8)).map((r:any)=><tr key={r.id}>{importKind === "questions" ? <><td>{r.prompt}</td><td>{r.subject}</td><td>{r.className}</td><td>{r.answer}</td></> : <><td>{r.name}</td><td>{r.nis}</td><td>{r.className}</td></>}</tr>)}</tbody></table></div><p className="muted">Pratinjau maksimal 8 baris. Data baru disimpan setelah tombol konfirmasi ditekan.</p></>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>{setImportKind(null);setImportPreview(null);}}>Batal</button>{importPreview && <button type="button" className="primary-btn" onClick={confirmImport}><Check size={16}/> Konfirmasi impor</button>}</div></section></div>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
function Stat({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:string;note:string;tone:string}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function ExamTable({exams,onEdit,onDelete,onStatus}:{exams:Exam[];onEdit:(e:Exam)=>void;onDelete:(id:number)=>void;onStatus:(id:number,s:Status)=>void}) {
  if (!exams.length) return <div className="table-empty">Belum ada ujian yang cocok. Gunakan tombol Buat Ujian untuk menambahkan data.</div>;
  return <div className="table-wrap"><table><thead><tr><th>NAMA UJIAN</th><th>MATA PELAJARAN</th><th>KELAS</th><th>JADWAL</th><th>DURASI</th><th>STATUS</th><th>PESERTA</th><th>AKSI</th></tr></thead><tbody>{exams.map(e=><tr key={e.id}><td><b>{e.title}</b><small>ID: US-{e.id}</small></td><td>{e.subject}</td><td>{e.className}</td><td>{fmtDate(e.date)}</td><td>{e.duration} menit</td><td><select className={`status-select ${e.status}`} value={e.status} onChange={x=>onStatus(e.id,x.target.value as Status)}><option>Terjadwal</option><option>Aktif</option><option>Selesai</option></select></td><td>{e.participants}</td><td><div className="row-actions"><button className="action-btn" title="Edit" onClick={()=>onEdit(e)}><Pencil size={15}/></button><button className="action-btn danger" title="Hapus" onClick={()=>onDelete(e.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}
function Activity({icon,title,desc}:{icon:React.ReactNode;title:string;desc:string}) { return <div className="activity"><div className="activity-icon">{icon}</div><div><b>{title}</b><small>{desc}</small></div></div>; }
export default App;
