// ==========================================================================
// TRANG WEB KIÊN LỌ - 100 NGÀY THỬ THÁCH
// Script.js - Cập nhật đầy đủ & tối ưu 2026
// Tạo bởi: Nguyễn Chí Dự 🇻🇳♥️🇻🇳
// ==========================================================================

// ------------------- CONSTANTS & KEYS -------------------
const USERS_KEY = "kienlo_users";               // Danh sách tất cả user
const CURRENT_USER_KEY = "kienlo_current_user"; // User đang đăng nhập

const DAYS_KEY_PREFIX = "kien_lo_days_";        // Để tương thích cũ nếu cần
const VIOLATION_KEY_PREFIX = "kien_lo_violations_";

// Từ khóa đen (có thể mở rộng sau)
const blackKeywords = [
  "pornhub", "xvideos", "xnxx", "xhamster", "youporn", "redtube",
  "spankbang", "tnaflix", "eporner", "tube8", "thumbzilla",
  "phimsex", "sexviet", "vlxx", "phimheo", "sexhay", "clipsexx",
  "jav", "hentai", "rule34", "nhentai", "e-hentai", "18+", 
  "phim người lớn", "sex việt", "clip sex", "phim18"
];

// Rank levels
const rankLevels = [
  { minDays: 0,    rank: "Khách",               color: "#aaaaaa" },
  { minDays: 7,    rank: "Tân binh kiên trì",   color: "#90e0ef" },
  { minDays: 15,   rank: "Chiến binh",          color: "#48cae4" },
  { minDays: 30,   rank: "Kỵ sĩ bất khuất",     color: "#00b4d8" },
  { minDays: 50,   rank: "Thợ săn cám dỗ",      color: "#0096c7" },
  { minDays: 75,   rank: "Cao thủ",             color: "#0077b6" },
  { minDays: 100,  rank: "Thần thánh kiên lọ",  color: "#00ff9d", glow: true }
];

// ------------------- DOM ELEMENTS -------------------
const authModal       = document.getElementById("authModal");
const loginForm       = document.getElementById("loginForm");
const registerForm    = document.getElementById("registerForm");
const forgotForm      = document.getElementById("forgotForm");

const daysDisplay     = document.getElementById("daysDisplay");
const userRank        = document.getElementById("userRank");
const rankDisplay     = document.getElementById("rankDisplay");
const userInfo        = document.getElementById("userInfo");
const currentUserSpan = document.getElementById("currentUser");
const failScreen      = document.getElementById("failScreen");

const angrySound      = document.getElementById("angrySound");
const failSound       = document.getElementById("failEpicSound");

// ------------------- STATE -------------------
let currentUser = null;
let days = 0;
let violations = 0;

// ------------------- AUTH FUNCTIONS -------------------

function loadCurrentUser() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
    userInfo.classList.remove("hidden");
    currentUserSpan.textContent = currentUser.username;
    authModal.style.display = "none";
    loadUserProgress();
  } else {
    authModal.style.display = "flex";
    showLogin();
  }
}

function saveCurrentUser() {
  if (currentUser) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }
}

function getAllUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Đăng ký
function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const email    = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass     = document.getElementById("regPassword").value;
  const confirm  = document.getElementById("regConfirm").value;

  if (!username || !email || !pass) return alert("Vui lòng điền đầy đủ thông tin!");
  if (pass !== confirm) return alert("Mật khẩu xác nhận không khớp!");
  if (pass.length < 6) return alert("Mật khẩu phải từ 6 ký tự trở lên!");

  const users = getAllUsers();

  if (users.some(u => u.email === email || u.username.toLowerCase() === username.toLowerCase())) {
    return alert("Tên hiển thị hoặc Gmail đã được sử dụng!");
  }

  const newUser = {
    username,
    email,
    password: pass, // Lưu ý: Chỉ để demo - KHÔNG an toàn thực tế!
    days: 0,
    violations: 0,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveAllUsers(users);

  alert("Đăng ký thành công! Hãy đăng nhập ngay nhé.");
  showLogin();
}

// Đăng nhập
function handleLogin(e) {
  e.preventDefault();

  const identifier = document.getElementById("loginIdentifier").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  const users = getAllUsers();
  const user = users.find(u => 
    u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
  );

  if (!user || user.password !== pass) {
    return alert("Tên/Gmail hoặc mật khẩu không đúng!");
  }

  currentUser = user;
  saveCurrentUser();

  userInfo.classList.remove("hidden");
  currentUserSpan.textContent = user.username;
  authModal.style.display = "none";

  loadUserProgress();
}

// Quên mật khẩu (giả lập đơn giản)
function handleForgot(e) {
  e.preventDefault();

  const identifier = document.getElementById("forgotIdentifier").value.trim().toLowerCase();
  const oldPass = document.getElementById("forgotOldPass").value;
  const newPass = document.getElementById("forgotNewPass").value;

  const users = getAllUsers();
  const index = users.findIndex(u => 
    u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
  );

  if (index === -1 || users[index].password !== oldPass) {
    return alert("Thông tin không đúng!");
  }

  if (newPass.length < 6) return alert("Mật khẩu mới phải từ 6 ký tự trở lên!");

  users[index].password = newPass;
  saveAllUsers(users);

  alert("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
  showLogin();
}

// Đăng xuất
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  currentUser = null;
  location.reload();
}

// Chuyển form auth
function showLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  forgotForm.classList.add("hidden");
}

function showRegister() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  forgotForm.classList.add("hidden");
}

function showForgot() {
  forgotForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
}

function closeModal() {
  if (currentUser) authModal.style.display = "none";
}

// ------------------- KIÊN LỌ LOGIC -------------------

function loadUserProgress() {
  if (!currentUser) return;

  days = currentUser.days || 0;
  violations = currentUser.violations || 0;

  updateDisplay();
}

function saveUserProgress() {
  if (!currentUser) return;

  const users = getAllUsers();
  const index = users.findIndex(u => u.email === currentUser.email);

  if (index !== -1) {
    users[index].days = days;
    users[index].violations = violations;
    saveAllUsers(users);

    // Cập nhật currentUser
    currentUser = users[index];
    saveCurrentUser();
  }

  updateDisplay();
}

function getCurrentRank() {
  let current = rankLevels[0];
  for (const level of rankLevels) {
    if (days >= level.minDays) current = level;
  }
  return current;
}

function updateDisplay() {
  daysDisplay.textContent = days;

  const rank = getCurrentRank();
  userRank.textContent = rank.rank;

  rankDisplay.style.color = rank.color;
  rankDisplay.style.borderColor = rank.color;

  if (rank.glow) {
    rankDisplay.style.boxShadow = "0 0 25px " + rank.color;
    daysDisplay.classList.add("success");
  } else {
    daysDisplay.classList.remove("success");
  }
}

function resetChallenge() {
  days = 0;
  violations = 0;
  saveUserProgress();
  failScreen.classList.add("hidden");
  angrySound.pause();
  angrySound.currentTime = 0;
  document.body.style.background = ""; // reset về default gradient trong css
}

function handleViolation() {
  violations++;
  saveUserProgress();

  angrySound.currentTime = 0;
  angrySound.play().catch(() => {});

  if (violations >= 3) {
    document.body.style.background = "linear-gradient(135deg, #4b0000, #000000)";
    failScreen.classList.remove("hidden");
    failSound.currentTime = 0;
    failSound.play().catch(() => {});
    
    // Tự reset sau 8 giây cho drama
    setTimeout(resetChallenge, 8000);
  } else {
    alert(`CẢNH CÁO ${violations}/3 !\nCố lên đừng để reset nhé... 😠`);
  }
}

// Phát hiện paste hoặc Ctrl+V nội dung đen
function checkBlackContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return blackKeywords.some(word => lower.includes(word));
}

document.addEventListener('paste', (e) => {
  setTimeout(() => {
    const text = (e.clipboardData || window.clipboardData)?.getData('text');
    if (checkBlackContent(text)) handleViolation();
  }, 100);
}, true);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'v') {
    setTimeout(() => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        if (checkBlackContent(active.value)) handleViolation();
      }
    }, 300);
  }
});

// ------------------- KHỞI ĐỘNG -------------------
loadCurrentUser();

// Để test tăng ngày (mở console và gõ addOneDay())
window.addOneDay = function() {
  if (!currentUser) return alert("Vui lòng đăng nhập trước!");
  days++;
  saveUserProgress();
  console.log(`Ngày kiên lọ hiện tại: ${days}`);
};
