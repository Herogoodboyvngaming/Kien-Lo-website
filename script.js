// ------------------- HỆ THỐNG AUTH (client-side) -------------------
const USERS_KEY = "kienlo_users"; // mảng users
const CURRENT_USER_KEY = "kienlo_current_user";

let currentUser = null;

// Rank theo ngày
const rankLevels = [
  { days: 0,    rank: "Khách",           color: "#aaa" },
  { days: 7,    rank: "Tân binh",         color: "#90e0ef" },
  { days: 15,   rank: "Chiến binh",       color: "#48cae4" },
  { days: 30,   rank: "Kỵ sĩ kiên trì",   color: "#00b4d8" },
  { days: 50,   rank: "Thợ săn cám dỗ",   color: "#0096c7" },
  { days: 75,   rank: "Cao thủ",          color: "#0077b6" },
  { days: 100,  rank: "Thần thánh kiên lọ", color: "#00ff9d", glow: true }
];

function getRank(days) {
  let current = rankLevels[0];
  for (let level of rankLevels) {
    if (days >= level.days) current = level;
  }
  return current;
}

// Load user từ localStorage
function loadCurrentUser() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("currentUser").textContent = currentUser.username;
    document.getElementById("authModal").style.display = "none";
  } else {
    document.getElementById("authModal").style.display = "block";
    showLogin();
  }
}

// Đăng ký
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;

  if (pass !== confirm) return alert("Mật khẩu xác nhận không khớp!");
  if (pass.length < 6) return alert("Mật khẩu phải ≥ 6 ký tự!");

  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.some(u => u.email === email || u.username.toLowerCase() === username.toLowerCase())) {
    return alert("Tên hoặc Gmail đã được sử dụng!");
  }

  users.push({ username, email, password: pass, days: 0, violations: 0 });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  alert("Đăng ký thành công! Hãy đăng nhập nhé.");
  showLogin();
}

// Đăng nhập
function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("loginIdentifier").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const user = users.find(u => 
    u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
  );

  if (!user || user.password !== pass) {
    return alert("Tên/Gmail hoặc mật khẩu sai!");
  }

  currentUser = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  
  document.getElementById("userInfo").classList.remove("hidden");
  document.getElementById("currentUser").textContent = user.username;
  document.getElementById("authModal").style.display = "none";
  
  loadUserProgress();
}

// Quên mk (giả lập - chỉ cho đổi mk nếu đúng thông tin cũ)
function handleForgot(e) {
  e.preventDefault();
  const identifier = document.getElementById("forgotIdentifier").value.trim().toLowerCase();
  const oldPass = document.getElementById("forgotOldPass").value;
  const newPass = document.getElementById("forgotNewPass").value;

  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const userIndex = users.findIndex(u => 
    u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
  );

  if (userIndex === -1 || users[userIndex].password !== oldPass) {
    return alert("Thông tin không đúng!");
  }

  if (newPass.length < 6) return alert("Mật khẩu mới ≥ 6 ký tự!");

  users[userIndex].password = newPass;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  alert("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
  showLogin();
}

// Đăng xuất
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  currentUser = null;
  location.reload();
}

// Chuyển form
function showLogin() { 
  document.getElementById("loginForm").classList.remove("hidden"); 
  document.getElementById("registerForm").classList.add("hidden"); 
  document.getElementById("forgotForm").classList.add("hidden"); 
}
function showRegister() { 
  document.getElementById("registerForm").classList.remove("hidden"); 
  document.getElementById("loginForm").classList.add("hidden"); 
  document.getElementById("forgotForm").classList.add("hidden"); 
}
function showForgot() { 
  document.getElementById("forgotForm").classList.remove("hidden"); 
  document.getElementById("loginForm").classList.add("hidden"); 
  document.getElementById("registerForm").classList.add("hidden"); 
}
function closeModal() {
  if (currentUser) document.getElementById("authModal").style.display = "none";
}

// ------------------- HỆ THỐNG KIÊN LỌ -------------------
const DAYS_KEY = "kien_lo_days";
const VIOLATION_KEY = "kien_lo_violations";

let days = 0;
let violations = 0;

const daysDisplay = document.getElementById("daysDisplay");
const failScreen = document.getElementById("failScreen");
const angrySound = document.getElementById("angrySound");
const failSound = document.getElementById("failEpicSound");

const blackKeywords = [
  "pornhub", "xvideos", "xnxx", "xhamster", "youporn", "redtube",
  "phimsex", "sexviet", "vlxx", "phimheo", "sexhay", "jav", "hentai"
];

function loadUserProgress() {
  if (!currentUser) return;
  days = currentUser.days || 0;
  violations = currentUser.violations || 0;
  updateDisplay();
}

function saveUserProgress() {
  if (!currentUser) return;
  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) {
    users[index].days = days;
    users[index].violations = violations;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    currentUser = users[index];
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }
  updateDisplay();
}

function updateDisplay() {
  daysDisplay.textContent = days;

  const rank = getRank(days);
  document.getElementById("userRank").textContent = rank.rank;
  document.getElementById("rankDisplay").style.color = rank.color;
  if (rank.glow) {
    document.getElementById("rankDisplay").style.textShadow = "0 0 15px #00ff9d";
  }

  if (days >= 100) {
    daysDisplay.style.color = "#00ff9d";
    daysDisplay.style.textShadow = "0 0 30px #00ff9d";
  }
}

function resetChallenge() {
  days = 0;
  violations = 0;
  saveUserProgress();
  failScreen.classList.add("hidden");
  angrySound.pause();
  angrySound.currentTime = 0;
  document.body.style.background = "linear-gradient(135deg, #000428, #004e92)";
}

function handleViolation() {
  violations++;
  saveUserProgress();

  if (violations >= 3) {
    document.body.style.background = "linear-gradient(135deg, #4b0000, #000000)";
    failScreen.classList.remove("hidden");
    failSound.play().catch(()=>{});
    angrySound.play().catch(()=>{});
    setTimeout(resetChallenge, 8000);
  } else {
    angrySound.play().catch(()=>{});
    alert(`CẢNH CÁO ${violations}/3 !\nĐừng để reset nhé... 😠`);
  }
}

// Phát hiện nội dung đen
document.addEventListener('paste', (e) => {
  setTimeout(() => {
    const text = (e.clipboardData || window.clipboardData)?.getData('text');
    if (checkBlack(text)) handleViolation();
  }, 100);
}, true);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'v') {
    setTimeout(() => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if (checkBlack(el.value)) handleViolation();
      }
    }, 300);
  }
});

function checkBlack(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return blackKeywords.some(kw => lower.includes(kw));
}

// Khởi động
loadCurrentUser();

// Để test tăng ngày: mở console → addOneDay()
window.addOneDay = () => {
  days++;
  saveUserProgress();
};
