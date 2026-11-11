package id.school.ujian_smart

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.animation.core.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.drawscope.rotate
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Blue = Color(0xFF155EEF)
private val Ink = Color(0xFF182230)
private val Muted = Color(0xFF667085)
private val Pale = Color(0xFFEAF2FF)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { SmartUjianApp() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmartUjianApp() {
    var showSplash by remember { mutableStateOf(true) }
    if (showSplash) {
        StudentLoadingSplash(onFinished = { showSplash = false })
        return
    }
    var role by remember { mutableStateOf<String?>(null) }
    var loggedIn by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf("Beranda") }

    if (!loggedIn) {
        LoginScreen(role = role, onRoleChange = { role = it }, onLogin = { loggedIn = true })
        return
    }

    val items = if (role == "Admin") listOf("Dashboard", "Ujian", "Pengaturan", "Tentang") else listOf("Beranda", "Ujian Saya", "Hasil", "Profil", "Tentang")
    Scaffold(
        containerColor = Color(0xFFF5F8FC),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("SMART UJIAN", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = Ink)
                        Text("SMA NEGERI 8 BANDA ACEH", fontSize = 9.sp, color = Muted, letterSpacing = .5.sp)
                    }
                },
                actions = { IconButton(onClick = { loggedIn = false; role = null }) { Icon(Icons.Default.Logout, "Keluar", tint = Muted) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                val icons = if (role == "Admin") listOf(Icons.Default.Dashboard, Icons.Default.Assignment, Icons.Default.Settings, Icons.Default.Info) else listOf(Icons.Default.Home, Icons.Default.Assignment, Icons.Default.BarChart, Icons.Default.Person, Icons.Default.Info)
                items.forEachIndexed { index, label ->
                    NavigationBarItem(selected = selected == label, onClick = { selected = label }, icon = { Icon(icons[index], label) }, label = { Text(label, fontSize = 9.sp) })
                }
            }
        }
    ) { padding ->
        when (selected) {
            "Beranda", "Dashboard" -> HomeScreen(Modifier.padding(padding), role ?: "Siswa", onOpenExams = { selected = if (role == "Admin") "Ujian" else "Ujian Saya" })
            "Ujian Saya", "Ujian" -> ExamsScreen(Modifier.padding(padding), role ?: "Siswa")
            "Hasil" -> SimpleScreen(Modifier.padding(padding), "Hasil Ujian", "Nilai dan riwayat ujian akan tampil setelah akun terhubung ke server sekolah.")
            "Pengaturan" -> SimpleScreen(Modifier.padding(padding), "Pengaturan", "Atur jadwal, durasi, kelas, dan aturan ujian melalui panel admin setelah backend diaktifkan.")
            "Tentang" -> AboutScreen(Modifier.padding(padding))
            else -> SimpleScreen(Modifier.padding(padding), "Profil", "Profil pengguna dan pengaturan akun tersedia setelah autentikasi sekolah diaktifkan.")
        }
    }
}

@Composable
fun StudentLoadingSplash(onFinished: () -> Unit) {
    val transition = rememberInfiniteTransition(label = "student-walk")
    val step by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(650, easing = LinearEasing), RepeatMode.Restart),
        label = "walking-step"
    )
    LaunchedEffect(Unit) { delay(2600); onFinished() }
    Surface(Modifier.fillMaxSize(), color = Color(0xFF061A49)) {
        Column(
            Modifier.fillMaxSize().padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo_sman8),
                contentDescription = "Logo SMART UJIAN",
                modifier = Modifier.size(112.dp),
                contentScale = ContentScale.Fit
            )
            Spacer(Modifier.height(26.dp))
            Canvas(Modifier.width(180.dp).height(150.dp)) {
                val cx = size.width * 0.48f
                val headY = size.height * 0.22f
                val swing = kotlin.math.sin(step * (2f * Math.PI).toFloat()) * 17f
                // Kepala dan badan pelajar
                drawCircle(Color(0xFFFFD7B0), radius = 13f, center = Offset(cx, headY))
                drawLine(Color(0xFF35B6FF), Offset(cx, headY + 17f), Offset(cx - 3f, headY + 65f), 12f, cap = StrokeCap.Round)
                // Tangan kiri mengayun, tangan kanan memegang buku
                drawLine(Color(0xFFFFD7B0), Offset(cx - 2f, headY + 30f), Offset(cx - 25f, headY + 48f + swing), 8f, cap = StrokeCap.Round)
                drawLine(Color(0xFFFFD7B0), Offset(cx + 2f, headY + 30f), Offset(cx + 30f, headY + 45f), 8f, cap = StrokeCap.Round)
                // Buku di tangan
                drawRoundRect(Color.White, topLeft = Offset(cx + 24f, headY + 31f), size = Size(30f, 39f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(4f))
                drawLine(Color(0xFF2563EB), Offset(cx + 39f, headY + 34f), Offset(cx + 39f, headY + 67f), 2f)
                // Kaki bergerak bergantian
                drawLine(Color(0xFF172554), Offset(cx - 3f, headY + 65f), Offset(cx - 18f + swing, headY + 105f), 10f, cap = StrokeCap.Round)
                drawLine(Color(0xFF172554), Offset(cx - 3f, headY + 65f), Offset(cx + 17f - swing, headY + 105f), 10f, cap = StrokeCap.Round)
                drawLine(Color.White, Offset(cx - 18f + swing, headY + 105f), Offset(cx - 31f + swing, headY + 106f), 7f, cap = StrokeCap.Round)
                drawLine(Color.White, Offset(cx + 17f - swing, headY + 105f), Offset(cx + 30f - swing, headY + 106f), 7f, cap = StrokeCap.Round)
            }
            Spacer(Modifier.height(18.dp))
            Text("SMART UJIAN", color = Color.White, fontSize = 25.sp, fontWeight = FontWeight.ExtraBold)
            Text("SMA NEGERI 8 BANDA ACEH", color = Color(0xFF93C5FD), fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(24.dp))
            LinearProgressIndicator(
                progress = { step },
                modifier = Modifier.width(150.dp).height(4.dp),
                color = Color(0xFF38BDF8),
                trackColor = Color(0xFF1E3A8A)
            )
            Spacer(Modifier.height(10.dp))
            Text("Menyiapkan aplikasi...", color = Color(0xFFCBD5E1), fontSize = 12.sp)
        }
    }
}

@Composable
fun LoginScreen(role: String?, onRoleChange: (String) -> Unit, onLogin: () -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showInfo by remember { mutableStateOf(false) }
    Surface(Modifier.fillMaxSize(), color = Color(0xFFF5F8FC)) {
        Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.logo_sman8),
                contentDescription = "Logo SMA Negeri 8 Banda Aceh",
                modifier = Modifier.size(112.dp),
                contentScale = ContentScale.Fit
            )
            Spacer(Modifier.height(16.dp))
            Text("SMART UJIAN", fontSize = 25.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
            Text("SMA NEGERI 8 BANDA ACEH", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Blue)
            Text("Sistem Ujian Online Sekolah", fontSize = 11.sp, color = Muted)
            Spacer(Modifier.height(25.dp))
            Surface(shape = RoundedCornerShape(18.dp), color = Color.White, border = BorderStroke(1.dp, Color(0xFFE9EEF5)), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(18.dp)) {
                    Text("Masuk ke akun", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Ink)
                    Text("Pilih jenis akun untuk melanjutkan.", fontSize = 11.sp, color = Muted)
                    Spacer(Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Siswa", "Admin").forEach { item ->
                            FilterChip(selected = role == item, onClick = { onRoleChange(item) }, label = { Text(item) }, leadingIcon = { Icon(if (item == "Siswa") Icons.Default.Person else Icons.Default.AdminPanelSettings, null) })
                        }
                    }
                    OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text(if (role == "Siswa") "NIS / Username" else "Username admin") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(14.dp))
                    Button(onClick = { showInfo = true }, modifier = Modifier.fillMaxWidth(), enabled = role != null && username.isNotBlank() && password.isNotBlank()) { Text("Masuk") }
                    if (showInfo) {
                        Text("Mode demo: autentikasi belum terhubung. Tombol login tidak memverifikasi akun sekolah.", color = Color(0xFFB54708), fontSize = 10.sp, modifier = Modifier.padding(top = 10.dp))
                    }
                    Text("Akun resmi sekolah akan aktif setelah Firebase Authentication dikonfigurasi.", fontSize = 10.sp, color = Muted, modifier = Modifier.padding(top = 12.dp))
                }
            }
        }
    }
}

@Composable
fun HomeScreen(modifier: Modifier = Modifier, role: String, onOpenExams: () -> Unit) {
    LazyColumn(modifier.fillMaxSize().padding(horizontal = 18.dp), verticalArrangement = Arrangement.spacedBy(15.dp), contentPadding = PaddingValues(vertical = 20.dp)) {
        item {
            Surface(shape = RoundedCornerShape(18.dp), color = Blue, modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp)) {
                    Text("SMA NEGERI 8 BANDA ACEH", color = Color.White.copy(alpha = .75f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text(if (role == "Admin") "Kelola ujian sekolah." else "Siap mengikuti ujian?", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(6.dp))
                    Text("SMART UJIAN membantu pelaksanaan ujian online secara tertib dan terjadwal.", color = Color.White.copy(alpha = .85f), fontSize = 12.sp)
                    Spacer(Modifier.height(16.dp))
                    Button(onClick = onOpenExams, colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Blue)) { Text(if (role == "Admin") "Kelola ujian" else "Lihat ujian", fontWeight = FontWeight.Bold) }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SummaryCard("Ujian tersedia", "2", Icons.Default.Assignment, Modifier.weight(1f))
                SummaryCard("Sudah selesai", "0", Icons.Default.CheckCircle, Modifier.weight(1f))
            }
        }
        item {
            Text("Jadwal mendatang", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Ink)
            Spacer(Modifier.height(8.dp))
            ExamCard("Penilaian Harian — Matematika", "Matematika • X IPA 1", "12 Nov 2026 • 60 menit", "Terjadwal")
            Spacer(Modifier.height(10.dp))
            ExamCard("Kuis Sistem Pencernaan", "Biologi • X IPA 1", "14 Nov 2026 • 45 menit", "Terjadwal")
        }
        item { Text("Data di layar ini masih contoh. Login dan sinkronisasi server belum aktif.", fontSize = 10.sp, color = Muted) }
    }
}

@Composable
fun SummaryCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
    Surface(modifier, shape = RoundedCornerShape(14.dp), color = Color.White, border = BorderStroke(1.dp, Color(0xFFE9EEF5))) {
        Column(Modifier.padding(14.dp)) {
            Icon(icon, null, tint = Blue, modifier = Modifier.size(19.dp))
            Spacer(Modifier.height(12.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
            Text(title, fontSize = 10.sp, color = Muted)
        }
    }
}

@Composable
fun ExamsScreen(modifier: Modifier = Modifier, role: String) {
    Column(modifier.fillMaxSize().padding(18.dp)) {
        Text(if (role == "Admin") "Kelola Ujian" else "Ujian Saya", fontSize = 23.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
        Text("Contoh daftar ujian SMA Negeri 8 Banda Aceh.", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(16.dp))
        ExamCard("Penilaian Harian — Matematika", "Matematika • X IPA 1", "12 Nov 2026 • 60 menit", "Terjadwal")
        Spacer(Modifier.height(12.dp))
        ExamCard("Kuis Sistem Pencernaan", "Biologi • X IPA 1", "14 Nov 2026 • 45 menit", "Terjadwal")
    }
}

@Composable
fun ExamCard(title: String, detail: String, schedule: String, status: String) {
    Surface(shape = RoundedCornerShape(14.dp), color = Color.White, border = BorderStroke(1.dp, Color(0xFFE9EEF5)), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(15.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(9.dp), color = Pale) {
                    Icon(Icons.Default.Description, null, tint = Blue, modifier = Modifier.padding(9.dp).size(19.dp))
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Ink)
                    Text(detail, fontSize = 10.sp, color = Muted)
                }
                Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFFFFF4E5)) {
                    Text(status, color = Color(0xFFB54708), fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp))
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Schedule, null, tint = Muted, modifier = Modifier.size(14.dp))
                Spacer(Modifier.width(5.dp))
                Text(schedule, fontSize = 10.sp, color = Muted)
            }
        }
    }
}

@Composable
fun SimpleScreen(modifier: Modifier = Modifier, title: String, description: String) {
    Column(modifier.fillMaxSize().padding(22.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.School, null, tint = Blue, modifier = Modifier.size(48.dp))
        Spacer(Modifier.height(15.dp))
        Text(title, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
        Spacer(Modifier.height(8.dp))
        Text(description, color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
    }
}


@Composable
fun AboutScreen(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier.fillMaxSize().padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 20.dp)
    ) {
        item {
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = Color.White,
                border = BorderStroke(1.dp, Color(0xFFE9EEF5)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    Modifier.fillMaxWidth().padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.logo_sman8),
                        contentDescription = "Logo SMA Negeri 8 Banda Aceh",
                        modifier = Modifier.size(124.dp),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(Modifier.height(12.dp))
                    Text("SMART UJIAN", fontSize = 23.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
                    Text("SMA NEGERI 8 BANDA ACEH", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Blue)
                    Text("Versi 1.0 · 11 November 2026", fontSize = 11.sp, color = Muted)
                }
            }
        }
        item {
            AboutInfoCard("Dibuat oleh", "RAFIYATULLAH")
        }
        item {
            AboutInfoCard(
                "Tujuan aplikasi",
                "SMART UJIAN dibuat untuk mempermudah kegiatan ujian di SMA Negeri 8 Banda Aceh melalui pengelolaan jadwal, peserta, pengerjaan, dan hasil ujian secara lebih teratur."
            )
        }
        item {
            AboutInfoCard(
                "Manfaat aplikasi",
                "• Membantu guru mengatur jadwal dan pelaksanaan ujian.\n• Memudahkan siswa melihat ujian yang ditugaskan.\n• Membantu sekolah merangkum hasil dan laporan.\n• Mengurangi penggunaan kertas jika ujian online diterapkan.\n• Membuat administrasi ujian lebih tertata."
            )
        }
        item {
            AboutInfoCard(
                "Catatan penggunaan",
                "Versi ini masih berupa starter/demo. Login, sinkronisasi data, penyimpanan nilai, dan layanan server perlu diintegrasikan serta diuji sebelum digunakan untuk ujian resmi."
            )
        }
        item {
            Text(
                "Tepat Waktu, Raih Prestasi · SMART UJIAN",
                color = Blue,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
            )
        }
    }
}

@Composable
fun AboutInfoCard(title: String, body: String) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color(0xFFE9EEF5)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(title, color = Blue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(7.dp))
            Text(body, color = Ink, fontSize = 12.sp, lineHeight = 18.sp)
        }
    }
}
