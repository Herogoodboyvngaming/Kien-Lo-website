// ==================== EMAILJS OTP CONFIGURATION ====================
// 🔹 Khởi tạo EmailJS
emailjs.init("zrBJ3aMewsiB08C9G");

// 🔹 Tạo OTP 6 số
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

// 🔹 Lấy input OTP 6 ô
function getOTPInput(formType = 'register') {
    const container = formType === 'register' ? 'registerForm' : 'forgotForm';
    const inputs = document.querySelectorAll(`#${container} .otp-input`);
    return Array.from(inputs).map(i => i.value).join("");
}

// 🔹 Auto nhảy ô + backspace cho OTP inputs
function setupOTPInputs(formType = 'register') {
    const container = formType === 'register' ? 'registerForm' : 'forgotForm';
    const inputs = document.querySelectorAll(`#${container} .otp-input`);

    inputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            // Chỉ cho nhập số
            input.value = input.value.replace(/[^0-9]/g, '');
            
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Thêm class filled khi có giá trị
            if (input.value) {
                input.classList.add('filled');
            } else {
                input.classList.remove('filled');
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Paste OTP
        input.addEventListener("paste", (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            const pasteArray = pasteData.split('').slice(0, 6);
            
            pasteArray.forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add('filled');
                    if (i < inputs.length - 1) inputs[i + 1].focus();
                }
            });
        });
    });
}

// 🔹 HÀM GỬI EMAIL CHUNG (sửa lỗi recipients)
async function sendEmailJS(email, otp, name, templateId = "template_yubxr3d") {
    // ⚠️ QUAN TRỌNG: Các tên biến phải khớp với template EmailJS
    const templateParams = {
        // Tên biến chuẩn EmailJS
        to_email: email,
        to_name: name || "Người dùng",
        otp_code: otp,
        from_name: "Trang Web Cấm Lọ",
        message: `Mã xác nhận của bạn là: ${otp}`
    };

    console.log("📧 Đang gửi email đến:", email);
    console.log("📧 Params:", templateParams);

    try {
        const result = await emailjs.send(
            "service_qcfdi7f",
            templateId,
            templateParams
        );
        
        console.log("✅ Gửi thành công:", result);
        return { success: true, message: "Đã gửi OTP!", result };
        
    } catch (error) {
        console.error("❌ Lỗi gửi email:", error);
        console.error("Status:", error.status);
        console.error("Text:", error.text);
        
        let errorMsg = error.text || "Không xác định";
        if (error.text && error.text.includes("recipients address is empty")) {
            errorMsg = "Lỗi: Email người nhận trống!\n\nCách sửa:\n1. Vào EmailJS Dashboard > Templates\n2. Chọn template_yubxr3d\n3. Tab SETTINGS > thêm variable: to_email\n4. Trong HTML dùng: {{to_email}}";
        }
        
        return { success: false, message: errorMsg, error };
    }
}

// 🔹 Gửi OTP khi submit form ĐĂNG KÝ
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("form");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();

            // 🔧 SỬA: Lấy email đúng từ input có name="user_email"
            let email = this.querySelector('input[name="user_email"]').value.trim();
            let otp = generateOTP();

            console.log("📧 Email lấy được:", email); // Debug

            // Validate email
            if (!email || !email.includes('@')) {
                showToast('Lỗi!', 'Vui lòng nhập email hợp lệ!', 'error');
                return;
            }

            // Hiển thị loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang gửi...';
            submitBtn.disabled = true;

            // lưu OTP + thời gian
            localStorage.setItem("otp_code", otp);
            localStorage.setItem("otp_time", Date.now());
            localStorage.setItem("otp_email", email);

            // Gửi email qua EmailJS
            const result = await sendEmailJS(
                email, 
                otp, 
                document.getElementById('regName')?.value || "Người dùng"
            );

            // Khôi phục button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showToast('Thành công!', 'Đã gửi OTP đến email! 📩', 'success');
                startCountdown('countdown', 'resendBtn');
            } else {
                showToast('Lỗi gửi email!', result.message, 'error');
            }
        });
    }

    // 🔹 Gửi OTP khi submit form RESET PASSWORD
    const formReset = document.getElementById("formReset");
    if (formReset) {
        formReset.addEventListener("submit", async function(e) {
            e.preventDefault();

            // 🔧 SỬA: Lấy email đúng từ input có name="user_email"
            let email = this.querySelector('input[name="user_email"]').value.trim();
            let otp = generateOTP();

            console.log("📧 Email reset lấy được:", email); // Debug

            if (!email || !email.includes('@')) {
                showToast('Lỗi!', 'Vui lòng nhập email hợp lệ!', 'error');
                return;
            }

            // Kiểm tra email có tồn tại không
            const users = getUsers();
            if (!users[email]) {
                showToast('Lỗi!', 'Email này chưa đăng ký!', 'error');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang gửi...';
            submitBtn.disabled = true;

            localStorage.setItem("reset_otp_code", otp);
            localStorage.setItem("reset_otp_time", Date.now());
            localStorage.setItem("reset_otp_email", email);

            const result = await sendEmailJS(
                email, 
                otp, 
                users[email].name || "Người dùng",
                "template_yubxr3d"
            );

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showToast('Thành công!', 'Đã gửi mã reset! 📩', 'success');
                startCountdown('countdownReset', 'resendResetBtn');
            } else {
                showToast('Lỗi gửi email!', result.message, 'error');
            }
        });
    }

    // Setup OTP inputs
    setupOTPInputs('register');
    setupOTPInputs('forgot');
});

// 🔹 Xác nhận OTP ĐĂNG KÝ
function verifyOTP() {
    let input = getOTPInput('register');
    let savedOtp = localStorage.getItem("otp_code");
    let savedTime = localStorage.getItem("otp_time");
    let savedEmail = localStorage.getItem("otp_email");

    if (!savedOtp) {
        showToast('Lỗi!', 'Chưa có OTP! Vui lòng gửi lại.', 'error');
        return;
    }

    // kiểm tra hết hạn 5 phút
    if (Date.now() - savedTime > 5 * 60 * 1000) {
        showToast('Lỗi!', 'OTP đã hết hạn! Vui lòng gửi lại.', 'error');
        localStorage.removeItem("otp_code");
        localStorage.removeItem("otp_time");
        return;
    }

    if (input == savedOtp) {
        showToast('Thành công!', 'Xác nhận OTP thành công! ✅', 'success');

        // xoá OTP sau khi dùng
        localStorage.removeItem("otp_code");
        localStorage.removeItem("otp_time");
        localStorage.removeItem("otp_email");

        // Đánh dấu đã xác nhận OTP
        localStorage.setItem("otp_verified", "true");

        // Tự động đăng ký sau khi xác nhận OTP
        completeRegistration();

    } else {
        showToast('Lỗi!', 'Sai OTP! Vui lòng thử lại.', 'error');
        
        // Hiệu ứng lỗi
        const inputs = document.querySelectorAll('#registerForm .otp-input');
        inputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        });
    }
}

// 🔹 Xác nhận OTP RESET PASSWORD
function verifyResetOTP() {
    let input = getOTPInput('forgot');
    let savedOtp = localStorage.getItem("reset_otp_code");
    let savedTime = localStorage.getItem("reset_otp_time");

    if (!savedOtp) {
        showToast('Lỗi!', 'Chưa có OTP!', 'error');
        return;
    }

    if (Date.now() - savedTime > 5 * 60 * 1000) {
        showToast('Lỗi!', 'OTP đã hết hạn!', 'error');
        return;
    }

    if (input == savedOtp) {
        showToast('Thành công!', 'Xác nhận OTP thành công! Bạn có thể đặt lại mật khẩu.', 'success');
        localStorage.removeItem("reset_otp_code");
        localStorage.removeItem("reset_otp_time");
        localStorage.setItem("reset_verified", "true");
    } else {
        showToast('Lỗi!', 'Sai OTP!', 'error');
        
        const inputs = document.querySelectorAll('#forgotForm .otp-input');
        inputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        });
    }
}

// 🔹 Countdown resend
let timers = {};

function startCountdown(countdownId, btnId) {
    let timeLeft = 60;
    
    if (timers[countdownId]) clearInterval(timers[countdownId]);
    
    const countdownEl = document.getElementById(countdownId);
    const resendBtn = document.getElementById(btnId);
    
    if (resendBtn) resendBtn.disabled = true;
    if (countdownEl) countdownEl.classList.add('active');

    timers[countdownId] = setInterval(() => {
        timeLeft--;
        if (countdownEl) countdownEl.innerText = "Gửi lại sau " + timeLeft + "s";

        if (timeLeft <= 0) {
            clearInterval(timers[countdownId]);
            if (countdownEl) {
                countdownEl.innerText = "Bạn có thể gửi lại";
                countdownEl.classList.remove('active');
            }
            if (resendBtn) resendBtn.disabled = false;
        }
    }, 1000);
}

// 🔹 Gửi lại OTP ĐĂNG KÝ
async function resendOTP() {
    // 🔧 SỬA: Lấy email đúng từ input
    let email = document.querySelector('#form input[name="user_email"]').value.trim();

    if (!email) {
        showToast('Lỗi!', 'Nhập email trước!', 'error');
        return;
    }

    let otp = generateOTP();

    localStorage.setItem("otp_code", otp);
    localStorage.setItem("otp_time", Date.now());

    const result = await sendEmailJS(
        email, 
        otp, 
        document.getElementById('regName')?.value || "Người dùng"
    );

    if (result.success) {
        showToast('Thành công!', 'Đã gửi lại OTP! 🔁', 'success');
        startCountdown('countdown', 'resendBtn');
    } else {
        showToast('Lỗi!', result.message, 'error');
    }
}

// 🔹 Gửi lại OTP RESET
async function resendResetOTP() {
    // 🔧 SỬA: Lấy email đúng từ input
    let email = document.querySelector('#formReset input[name="user_email"]').value.trim();

    if (!email) {
        showToast('Lỗi!', 'Nhập email trước!', 'error');
        return;
    }

    let otp = generateOTP();

    localStorage.setItem("reset_otp_code", otp);
    localStorage.setItem("reset_otp_time", Date.now());

    const result = await sendEmailJS(email, otp, "Người dùng");

    if (result.success) {
        showToast('Thành công!', 'Đã gửi lại mã reset! 🔁', 'success');
        startCountdown('countdownReset', 'resendResetBtn');
    } else {
        showToast('Lỗi!', result.message, 'error');
    }
}

// ==================== ORIGINAL APP CODE ====================
const APP_NAME = 'TrangWebCamLo';
let currentUser = null;
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 3;
let currentQuiz = null;

const quizDatabase = {
    easy: [
        { q: "Lọ là gì?", options: ["Thủ dâm", "Ngủ", "Ăn uống", "Chơi game"], a: 0 },
        { q: "Kiên lọ có lợi ích gì?", options: ["Sức khỏe tốt hơn", "Mệt mỏi", "Buồn ngủ", "Đau đầu"], a: 0 },
        { q: "Streak là gì?", options: ["Chuỗi ngày liên tiếp", "Một loại thức ăn", "Trò chơi", "Bài hát"], a: 0 }
    ],
    medium: [
        { q: "NoFap bắt đầu từ năm nào?", options: ["2011", "2005", "2015", "2020"], a: 0 },
        { q: "Dopamine là gì?", options: ["Chất dẫn truyền thần kinh", "Vitamin", "Khoáng chất", "Hormone"], a: 0 },
        { q: "Flatline trong NoFap là?", options: ["Giai đoạn giảm ham muốn", "Tăng năng lượng", "Ngủ ngon", "Ăn nhiều"], a: 0 }
    ],
    hard: [
        { q: "Theo nghiên cứu, bao lâu để tái tạo dopamine receptors?", options: ["90 ngày", "7 ngày", "30 ngày", "1 ngày"], a: 0 },
        { q: "PMO viết tắt của?", options: ["Porn, Masturbation, Orgasm", "Play, Movie, Online", "People, Money, Opportunity", "Peace, Mind, Open"], a: 0 },
        { q: "Reboot theo NoFap là gì?", options: ["Quá trình phục hồi não bộ", "Khởi động lại máy", "Tập thể dục", "Ăn kiêng"], a: 0 }
    ],
    extreme: [
        { q: "Cortex prefrontal bị ảnh hưởng như thế nào bởi lọ nhiều?", options: ["Giảm gray matter", "Tăng kích thước", "Không đổi", "Tăng tốc độ"], a: 0 },
        { q: "DeltaFosB liên quan đến?", options: ["Nghiện và thay đổi gen", "Vitamin D", "Canxi", "Sắt"], a: 0 },
        { q: "Theo YBOP, Coolidge effect là?", options: ["Ham muốn đối tác mới", "Hiệu ứng lạnh", "Ngủ đông", "Giảm cân"], a: 0 }
    ]
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function playSound(type) {
    const audio = document.getElementById(type === 'success' ? 'soundSuccess' : 'soundFail');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function createConfetti() {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

function updateClock() {
    const now = new Date();
    const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    const hours = String(vnTime.getHours()).padStart(2, '0');
    const minutes = String(vnTime.getMinutes()).padStart(2, '0');
    const seconds = String(vnTime.getSeconds()).padStart(2, '0');
    
    document.getElementById('clockTime').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clockDate').textContent = vnTime.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

setInterval(updateClock, 1000);
updateClock();

function initAgeGate() {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 10);
    document.getElementById('birthDate').max = maxDate.toISOString().split('T')[0];
    
    const ageVerified = localStorage.getItem(`${APP_NAME}_ageVerified`);
    if (ageVerified) {
        document.getElementById('ageGate').classList.add('hidden');
        checkAutoLogin();
    }
}

function checkAge() {
    const birthDate = new Date(document.getElementById('birthDate').value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    if (!document.getElementById('birthDate').value) {
        document.getElementById('ageError').textContent = 'Vui lòng chọn ngày sinh!';
        return;
    }
    
    if (actualAge < 5) {
        document.getElementById('ageError').textContent = 'Bạn phải từ 10 tuổi trở lên. Trẻ em dưới 5 tuổi bị CẤM!';
        return;
    }
    
    if (actualAge < 10) {
        document.getElementById('ageError').textContent = 'Bạn phải từ 10 tuổi trở lên!';
        return;
    }
    
    localStorage.setItem(`${APP_NAME}_ageVerified`, 'true');
    localStorage.setItem(`${APP_NAME}_birthDate`, document.getElementById('birthDate').value);
    document.getElementById('ageGate').classList.add('hidden');
    checkAutoLogin();
}

function getUsers() {
    return JSON.parse(localStorage.getItem(`${APP_NAME}_users`) || '{}');
}

function saveUsers(users) {
    localStorage.setItem(`${APP_NAME}_users`, JSON.stringify(users));
}

function getUserData(email) {
    return JSON.parse(localStorage.getItem(`${APP_NAME}_data_${email}`) || '{}');
}

function saveUserData(email, data) {
    localStorage.setItem(`${APP_NAME}_data_${email}`, JSON.stringify(data));
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotForm').style.display = 'none';
}

function showForgot() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        errorDiv.style.display = 'block';
        return;
    }
    
    const users = getUsers();
    const user = users[email];
    
    if (!user || user.password !== hashPassword(password)) {
        loginAttempts++;
        errorDiv.textContent = `Sai thông tin! Còn ${MAX_LOGIN_ATTEMPTS - loginAttempts} lần thử.`;
        errorDiv.style.display = 'block';
        
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            errorDiv.textContent = 'Bạn đã nhập sai quá 3 lần! Vui lòng sử dụng "Quên mật khẩu".';
            document.querySelector('#loginForm button').disabled = true;
            setTimeout(() => {
                document.querySelector('#loginForm button').disabled = false;
                loginAttempts = 0;
            }, 30000);
        }
        return;
    }
    
    loginAttempts = 0;
    errorDiv.style.display = 'none';
    currentUser = user;
    localStorage.setItem(`${APP_NAME}_currentUser`, email);
    localStorage.setItem(`${APP_NAME}_lastLogin`, Date.now().toString());
    
    showToast('Đăng nhập thành công!', `Chào mừng ${user.name} 💪`, 'success');
    showDashboard();
}

function completeRegistration() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    if (!name || !email || !username || !password) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Mật khẩu phải có ít nhất 6 ký tự!';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirm) {
        errorDiv.textContent = 'Mật khẩu xác nhận không khớp!';
        errorDiv.style.display = 'block';
        return;
    }
    
    const users = getUsers();
    if (users[email] || users[username]) {
        errorDiv.textContent = 'Email hoặc tên đăng nhập đã tồn tại!';
        errorDiv.style.display = 'block';
        return;
    }
    
    users[email] = {
        name: name,
        email: email,
        username: username,
        password: hashPassword(password),
        createdAt: Date.now()
    };
    saveUsers(users);
    
    saveUserData(email, {
        streak: 0,
        bestStreak: 0,
        totalDays: 0,
        successDays: 0,
        failDays: 0,
        history: [],
        streakStart: null,
        lastReset: null,
        avatar: null
    });
    
    errorDiv.style.display = 'none';
    successDiv.innerHTML = '<strong>Đăng ký thành công!</strong><br>Bạn có thể đăng nhập ngay bây giờ.';
    successDiv.style.display = 'block';
    
    showToast('Thành công!', 'Tài khoản đã được tạo!', 'success');
    
    setTimeout(() => showLogin(), 2000);
}

function resetPassword() {
    const isVerified = localStorage.getItem("reset_verified");
    if (isVerified !== "true") {
        showToast('Lỗi!', 'Vui lòng xác nhận OTP trước!', 'error');
        return;
    }

    const email = localStorage.getItem("reset_otp_email");
    const newPass = document.getElementById('newPassword').value;
    
    if (!newPass || newPass.length < 6) {
        showToast('Lỗi!', 'Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    
    const users = getUsers();
    if (users[email]) {
        users[email].password = hashPassword(newPass);
        saveUsers(users);
        
        localStorage.removeItem("reset_verified");
        localStorage.removeItem("reset_otp_email");
        
        showToast('Thành công!', 'Mật khẩu đã được cập nhật!', 'success');
        showLogin();
    }
}

function checkAutoLogin() {
    const savedUser = localStorage.getItem(`${APP_NAME}_currentUser`);
    const lastLogin = parseInt(localStorage.getItem(`${APP_NAME}_lastLogin`) || '0');
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (savedUser && (now - lastLogin) < sevenDays) {
        const users = getUsers();
        if (users[savedUser]) {
            currentUser = users[savedUser];
            showToast('Tự động đăng nhập!', `Chào mừng trở lại ${currentUser.name}`, 'success');
            showDashboard();
            return;
        }
    }
    
    if (savedUser && (now - lastLogin) >= sevenDays) {
        localStorage.removeItem(`${APP_NAME}_currentUser`);
        localStorage.removeItem(`${APP_NAME}_lastLogin`);
        showToast('Phiên đăng nhập hết hạn!', 'Vui lòng đăng nhập lại (quá 7 ngày)', 'warning');
    }
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('mainHeader').style.display = 'flex';
    document.getElementById('logoutBtn').classList.add('show');
    
    document.getElementById('welcomeName').textContent = currentUser.name;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    loadUserData();
    createParticles();
}

function loadUserData() {
    const data = getUserData(currentUser.email);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (data.lastReset) {
        const daysSinceReset = Math.floor((now - data.lastReset) / oneDay);
        if (daysSinceReset >= 7) {
            data.streak = 1;
            data.lastReset = now;
            showToast('Thông báo!', 'Chuỗi đã được reset theo quy tắc 7 ngày!', 'warning');
        }
    }
    
    document.getElementById('totalDays').textContent = data.totalDays || 0;
    document.getElementById('successDays').textContent = data.successDays || 0;
    document.getElementById('failDays').textContent = data.failDays || 0;
    
    const total = (data.successDays || 0) + (data.failDays || 0);
    const rate = total > 0 ? Math.round((data.successDays || 0) / total * 100) : 0;
    document.getElementById('successRate').textContent = rate + '%';
    
    document.getElementById('streakCount').textContent = data.streak || 0;
    document.getElementById('profileStreak').textContent = data.streak || 0;
    document.getElementById('profileBest').textContent = data.bestStreak || 0;
    document.getElementById('profileTotal').textContent = data.totalDays || 0;
    
    if (data.avatar) {
        document.getElementById('avatarDisplay').innerHTML = `<img src="${data.avatar}" class="avatar-preview" alt="Avatar">`;
    }
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    if (data.history && data.history.length > 0) {
        [...data.history].reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div class="history-date">${new Date(item.date).toLocaleDateString('vi-VN')}</div>
                    <div style="font-size: 0.8rem; color: #64748b;">${item.days} ngày</div>
                </div>
                <span class="history-status ${item.status === 'success' ? 'status-success' : 'status-fail'}">
                    ${item.status === 'success' ? '✅ Thành công' : '❌ Thất bại'}
                </span>
            `;
            historyList.appendChild(div);
        });
    } else {
        historyList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">Chưa có lịch sử</div>';
    }
    
    if (data.lastReset) {
        const nextReset = new Date(data.lastReset + 7 * oneDay);
        document.getElementById('streakResetInfo').textContent = `Reset tiếp theo: ${nextReset.toLocaleDateString('vi-VN')}`;
    }
    
    saveUserData(currentUser.email, data);
}

function submitDays() {
    const days = parseInt(document.getElementById('noFapDays').value);
    if (!days || days < 1) {
        showToast('Lỗi!', 'Vui lòng nhập số ngày hợp lệ!', 'error');
        return;
    }
    
    const data = getUserData(currentUser.email);
    
    if (days >= 6) {
        showQuiz(days);
    } else {
        recordDay(days, true);
    }
}

function showQuiz(days) {
    let difficulty = 'easy';
    if (days >= 30) difficulty = 'extreme';
    else if (days >= 14) difficulty = 'hard';
    else if (days >= 7) difficulty = 'medium';
    
    const questions = quizDatabase[difficulty];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    currentQuiz = { question, days, difficulty };
    
    const diffLabels = {
        easy: 'DỄ',
        medium: 'TRUNG BÌNH',
        hard: 'KHÓ',
        extreme: 'EXTREME HARD 🔥'
    };
    
    document.getElementById('quizDifficulty').textContent = diffLabels[difficulty];
    document.getElementById('quizDifficulty').className = `quiz-difficulty difficulty-${difficulty}`;
    document.getElementById('quizQuestion').textContent = question.q;
    
    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = '';
    
    question.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.onclick = () => answerQuiz(idx);
        optionsDiv.appendChild(btn);
    });
    
    document.getElementById('quizSection').style.display = 'block';
    document.getElementById('quizSection').scrollIntoView({ behavior: 'smooth' });
}

function answerQuiz(answer) {
    const options = document.querySelectorAll('.quiz-option');
    const correct = currentQuiz.question.a;
    
    options[answer].classList.add(answer === correct ? 'correct' : 'wrong');
    if (answer !== correct) options[correct].classList.add('correct');
    
    setTimeout(() => {
        if (answer === correct) {
            recordDay(currentQuiz.days, true);
        } else {
            recordDay(currentQuiz.days, false);
        }
        document.getElementById('quizSection').style.display = 'none';
    }, 1500);
}

function recordDay(days, success) {
    const data = getUserData(currentUser.email);
    const now = Date.now();
    
    data.totalDays = (data.totalDays || 0) + 1;
    
    if (success) {
        data.successDays = (data.successDays || 0) + 1;
        data.streak = (data.streak || 0) + 1;
        if (data.streak > (data.bestStreak || 0)) data.bestStreak = data.streak;
        if (!data.lastReset) data.lastReset = now;
        
        playSound('success');
        createConfetti();
        
        document.getElementById('successStreak').textContent = data.streak;
        document.getElementById('successPopup').classList.add('active');
    } else {
        data.failDays = (data.failDays || 0) + 1;
        const lostStreak = data.streak || 0;
        data.streak = 0;
        data.lastReset = null;
        
        playSound('fail');
        
        document.getElementById('failStreak').textContent = lostStreak;
        document.getElementById('failPopup').classList.add('active');
    }
    
    data.history = data.history || [];
    data.history.push({
        date: now,
        days: days,
        status: success ? 'success' : 'fail'
    });
    
    saveUserData(currentUser.email, data);
    loadUserData();
    document.getElementById('noFapDays').value = '';
}

function closePopup(id) {
    document.getElementById(id).classList.remove('active');
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Lỗi!', 'Vui lòng chọn file ảnh!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;
            
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 300, 300);
            
            const croppedData = canvas.toDataURL('image/jpeg', 0.8);
            
            document.getElementById('avatarDisplay').innerHTML = `<img src="${croppedData}" class="avatar-preview" alt="Avatar">`;
            
            const data = getUserData(currentUser.email);
            data.avatar = croppedData;
            saveUserData(currentUser.email, data);
            
            showToast('Thành công!', 'Ảnh đại diện đã được cập nhật!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function logout() {
    currentUser = null;
    localStorage.removeItem(`${APP_NAME}_currentUser`);
    localStorage.removeItem(`${APP_NAME}_lastLogin`);
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('logoutBtn').classList.remove('show');
    
    showLogin();
    showToast('Đã đăng xuất!', 'Hẹn gặp lại bạn!', 'info');
}

function createParticles() {
    const container = document.getElementById('particles');
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

window.onload = function() {
    initAgeGate();
    createParticles();
};
