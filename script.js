const USERS_KEY = "kienlo_users";
const CURRENT_USER_KEY = "kienlo_current_user";

let currentUser = null;
let days = 0;
let violations = 0;

const daysDisplay = document.getElementById("daysDisplay");
const userRank = document.getElementById("userRank");
const rankDisplay = document.getElementById("rankDisplay");
const userInfo = document.getElementById("userInfo");
const currentUserSpan = document.getElementById("currentUser");
const failScreen = document.getElementById("failScreen");
const angrySound = document.getElementById("angrySound");
const failSound = document.getElementById("failEpicSound");

const blackKeywords = [
  "pornhub", "xvideos", "xnxx", "xhamster", "youporn", "redtube",
  "phimsex", "sexviet", "vlxx", "phimheo", "sexhay", "jav", "hentai"
];

const rankLevels = [
  { minDays: 0, rank: "Khách", color: "#aaa" },
  { minDays: 7, rank: "Tân binh", color: "#90e0ef" },
  { minDays: 15, rank: "Chiến binh", color: "#48cae4" },
  { minDays: 30, rank: "Kỵ sĩ", color: "#00b4d8" },
  { minDays: 50, rank: "Thợ săn", color: "#0096c7" },
  { minDays: 75, rank: "Cao thủ", color: "#0077b6" },
  { minDays: 100, rank: "Thần thánh kiên lọ", color: "#00ff9d", glow: true }
];

function getRank(days) {
  let current = rankLevels[0];
  for (let level of rankLevels) {
    if (days >= level.minDays) current = level;
  }
  return current;
}

function loadCurrentUser() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
    userInfo.classList.remove("hidden");
    currentUserSpan.textContent = currentUser.username;
    document.getElementById("authModal").style.display = "none";
    loadUserProgress();
  } else {
    document.getElementById("authModal").style.display = "flex";
    showLogin();
  }
}

function saveCurrentUser() {
  if (currentUser) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
}

function getAllUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;

  if (!username || !email || !pass) return alert("Điền đầy đủ thông tin!");
  if (pass !== confirm) return alert("Mật khẩu xác nhận không khớp!");
  if (pass.length < 6) return alert("Mật khẩu phải ≥ 6 ký tự!");

  const users = getAllUsers();
  if (users.some(u => u.email === email || u.username.toLowerCase() === username.toLowerCase())) {
    return alert("Tên hoặc Gmail đã dùng!");
  }

  const newUser = { username, email, password: pass, days: 0, violations: 0 };
  users.push(newUser);
  saveAllUsers(users);

  alert("Đăng ký thành công! Đăng nhập nhé.");
  showLogin();
}

function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("loginIdentifier").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier);

  if (!user || user.password !== pass) return alert("Sai tên/Gmail hoặc mật khẩu!");

  currentUser = user;
  saveCurrentUser();

  userInfo.classList.remove("hidden");
  currentUserSpan.textContent = user.username;
  document.getElementById("authModal").style.display = "none";
  loadUserProgress();
}

function handleForgot(e) {
  e.preventDefault();
  const identifier = document.getElementById("forgotIdentifier").value.trim().toLowerCase();
  const oldPass = document.getElementById("forgotOldPass").value;
  const newPass = document.getElementById("forgotNewPass").value;

  const users = getAllUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier);

  if (index === -1 || users[index].password !== oldPass) return alert("Thông tin sai!");
  if (newPass.length < 6) return alert("Mật khẩu mới ≥ 6 ký tự!");

  users[index].password = newPass;
  saveAllUsers(users);
  alert("Đặt lại thành công! Đăng nhập lại nhé.");
  showLogin();
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  currentUser = null;
  location.reload();
}

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
    currentUser = users[index];
    saveCurrentUser();
  }
  updateDisplay();
}

function updateDisplay() {
  daysDisplay.textContent = days;
  const rank = getRank(days);
  userRank.textContent = rank.rank;
  rankDisplay.style.color = rank.color;
  if (rank.glow) rankDisplay.style.boxShadow = "0 0 20px " + rank.color;
}

function resetChallenge() {
  days = 0;
  violations = 0;
  saveUserProgress();
  failScreen.classList.add("hidden");
  angrySound.pause();
  angrySound.currentTime = 0;
}

function handleViolation() {
  violations++;
  saveUserProgress();
  angrySound.currentTime = 0;
  angrySound.play().catch(() => {});

  if (violations >= 3) {
    failScreen.classList.remove("hidden");
    failSound.play().catch(() => {});
    setTimeout(resetChallenge, 8000);
  } else {
    alert(`CẢNH CÁO ${violations}/3 ! Đừng để reset nhé 😠`);
  }
}

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
  if (e.ctrlKey && e.key === 'v') {
    setTimeout(() => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if (checkBlackContent(el.value)) handleViolation();
      }
    }, 300);
  }
});

// Khởi động
loadCurrentUser();
showLogin();

// Test tăng ngày: console.log(addOneDay())
window.addOneDay = function() {
  if (!currentUser) return alert("Đăng nhập trước!");
  days++;
  saveUserProgress();
};
