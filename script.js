document.addEventListener('DOMContentLoaded', () => {
    const daysSpan = document.getElementById('days');
    const statusP = document.getElementById('status');
    const locationStatus = document.getElementById('locationStatus');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const urlInput = document.getElementById('urlInput');
    const loadBtn = document.getElementById('loadBtn');
    const contentFrame = document.getElementById('contentFrame');

    // List of blocked domains/keywords from common adult sites (compiled from various parental control sources)
    const blockedKeywords = [
        'pornhub.com', 'xvideos.com', 'xnxx.com', 'youporn.com', 'redtube.com',
        'tube8.com', 'xhamster.com', 'kink.com', 'youjizz.com', '8tube.xxx',
        'chatroulette.com', 'omegle.com', 'chat-avenue.com', 'chatango.com',
        'teenchat.com', 'wireclub.com', 'chathour.com', 'chatzy.com',
        'tinder.com', 'bumble.com', 'match.com', 'meetme.com', 'okcupid.com',
        'pof.com', 'toomics.com', 'damplips.com', 'porn', 'xxx', 'sex', 'adult',
        'hentai', 'erotic', 'nude', 'fuck', 'pussy', 'dick', 'boobs' // Additional keywords for broader blocking
    ];

    // Audio Context for sound effects (no external files needed)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSuccessSound() {
        // Simple melody for success
        const notes = [440, 554, 659]; // A, C#, E
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioCtx.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                oscillator.connect(audioCtx.destination);
                oscillator.start();
                setTimeout(() => oscillator.stop(), 200);
            }, index * 250);
        });
    }

    function playWarningSound() {
        // Buzzer sound for warning
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.value = 220;
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
    }

    // Function to update days (tính theo ngày dương lịch, không cần đủ 24h)
    function updateDays() {
        if (localStorage.getItem('startDate')) {
            const start = new Date(parseInt(localStorage.getItem('startDate')));
            const today = new Date();
            
            // Reset giờ về 00:00 để chỉ tính theo ngày dương lịch
            start.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            const diffTime = today - start;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            daysSpan.textContent = diffDays;
            
            if (diffDays >= 100) {
                statusP.textContent = 'Chúc mừng! Bạn đã hoàn thành 100 ngày kiên trì! 🎉';
                playSuccessSound();
            } else if (diffDays > 0) {
                statusP.textContent = `Bạn đã kiên trì được ${diffDays} ngày! Còn ${100 - diffDays} ngày nữa thôi 💪`;
                if (diffDays === 1) playSuccessSound(); // kêu vui khi vừa lên 1 ngày
            } else {
                statusP.textContent = 'Hôm nay là ngày đầu tiên! Cố lên nhé!';
            }
        } else {
            daysSpan.textContent = 0;
            statusP.textContent = 'Hãy bắt đầu challenge ngay hôm nay!';
        }
    }

    // Start button
    startBtn.addEventListener('click', () => {
        if (!localStorage.getItem('startDate')) {
            // Lấy ngày hiện tại, reset về 00:00
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            localStorage.setItem('startDate', now.getTime());
            updateDays();
            playSuccessSound();
        }
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('startDate');
        updateDays();
        playWarningSound();
    });

    // Load URL with monitoring
    loadBtn.addEventListener('click', () => {
        let url = urlInput.value.trim();
        if (!url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (isBlocked(url)) {
            alert('Website đen tối bị phát hiện! Đã chặn để bảo vệ challenge của bạn.');
            playWarningSound();
            // Penalize: Reset the challenge if blocked site attempted
            localStorage.setItem('startDate', Date.now());
            updateDays();
            contentFrame.src = '';
        } else {
            contentFrame.src = url;
            playSuccessSound(); // Success sound for safe site
        }
    });

    function isBlocked(url) {
        const lowerUrl = url.toLowerCase();
        return blockedKeywords.some(keyword => lowerUrl.includes(keyword));
    }

    // TTS using SpeechSynthesis (giọng nữ, giống Google TTS nhất có thể)
    function speakMessage(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'vi-VN'; // Ngôn ngữ tiếng Việt
            // Chọn giọng nữ (nếu có sẵn, browser sẽ chọn giọng mặc định giống Google TTS)
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.gender === 'female' || voice.name.includes('Google') || voice.name.toLowerCase().includes('vietnam'));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            utterance.rate = 1.0; // Tốc độ bình thường
            utterance.pitch = 1.2; // Giọng cao hơn một chút để giống chị Google
            speechSynthesis.speak(utterance);
        } else {
            console.log('Trình duyệt không hỗ trợ SpeechSynthesis.');
        }
    }

    // Gắn định vị (Geolocation) để giám sát vị trí chung (không lạm dụng)
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                locationStatus.textContent = `Vị trí hiện tại: Kinh độ ${lat.toFixed(2)}, Vĩ độ ${lon.toFixed(2)} (chỉ dùng để giám sát chung, không theo dõi riêng tư như tắm hoặc thay đồ).`;
                // Không làm gì thêm với vị trí để tránh lạm dụng
            }, (error) => {
                locationStatus.textContent = 'Không lấy được vị trí (có thể do từ chối quyền).';
            });
        } else {
            locationStatus.textContent = 'Trình duyệt không hỗ trợ định vị.';
        }
    }

    // Initial update
    updateDays();
    getLocation(); // Gắn định vị ngay khi load

    // Phát tiếng nói khi load trang (khi ra màn hình chính)
    speakMessage('Tôi đang giám sát bạn, xem bạn làm gì nhưng trừ khi bạn đi tắm hoặc thay đồ');

    // Add visibility change for "monitoring" - warn if tab is hidden (assuming switching to bad site)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Play warning if they switch tabs (simulating monitoring)
            playWarningSound();
        }
    });

    // Prevent leaving the page without confirmation (to discourage opening bad sites elsewhere)
    window.addEventListener('beforeunload', (e) => {
        if (parseInt(daysSpan.textContent) < 100) {
            e.preventDefault();
            e.returnValue = 'Bạn có chắc muốn rời trang? Có thể dẫn đến website đen tối và phá hỏng challenge!';
        }
    });

    // Load voices for TTS (vì voices có thể load async)
    speechSynthesis.onvoiceschanged = () => {
        // Có thể reload nếu cần, nhưng không bắt buộc
    };
});
