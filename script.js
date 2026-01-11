document.addEventListener('DOMContentLoaded', () => {
    const daysSpan = document.getElementById('days');
    const statusP = document.getElementById('status');
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

    // Function to update days
    function updateDays() {
        if (localStorage.getItem('startDate')) {
            const startDate = parseInt(localStorage.getItem('startDate'));
            const currentDate = Date.now();
            const days = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
            daysSpan.textContent = days;
            if (days >= 100) {
                statusP.textContent = 'Chúc mừng! Bạn đã hoàn thành 100 ngày kiên trì!';
                playSuccessSound();
            } else {
                statusP.textContent = `Còn ${100 - days} ngày nữa để hoàn thành. Đừng xem phim đen tối!`;
            }
        } else {
            daysSpan.textContent = 0;
            statusP.textContent = 'Hãy bắt đầu challenge!';
        }
    }

    // Start button
    startBtn.addEventListener('click', () => {
        if (!localStorage.getItem('startDate')) {
            localStorage.setItem('startDate', Date.now());
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

    // Initial update
    updateDays();

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
});
