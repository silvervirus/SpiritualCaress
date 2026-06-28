let currentZip = null;
let chapterFiles = [];
let currentAudio = null;
let isPaused = false; 
// We add an abort controller to stop old chunks if the user switches chapters
let playbackController = null; 

const readerDiv = document.getElementById('reader');
const select = document.getElementById('chapterSelect');

async function getAudioBlob(chunkText) {
    const response = await fetch('https://your-tunnel-url.trycloudflare.com/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunkText })
    });
    if (!response.ok) throw new Error('TTS Server Error');
    return URL.createObjectURL(await response.blob());
}
function setTheme(theme) { 
    // Remove all possible theme classes
    document.body.classList.remove('day', 'sepia', 'night');
    // Add the new one
    document.body.classList.add(theme);
    // Save preference
    localStorage.setItem('theme', theme);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'sepia';
    setTheme(savedTheme);
});
function splitTextIntoChunks(text, limit = 800) {
    const chunks = [];
    while (text.length > limit) {
        let chunk = text.substring(0, limit);
        let lastPeriod = chunk.lastIndexOf('.');
        if (lastPeriod > 200) chunk = chunk.substring(0, lastPeriod + 1);
        chunks.push(chunk);
        text = text.substring(chunk.length);
    }
    chunks.push(text);
    return chunks;
}

async function speakChapter(text) {
    // Stop anything currently playing
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    
    const chunks = splitTextIntoChunks(text);
    let index = 0;
    isPaused = false;

    async function playNext() {
        if (index >= chunks.length || isPaused) return;
        
        try {
            const url = await getAudioBlob(chunks[index]);
            currentAudio = new Audio(url);
            
            currentAudio.onended = () => {
                index++;
                if (index < chunks.length) playNext();
                else document.getElementById('speakBtn').innerText = "Speak";
            };
            
            await currentAudio.play();
        } catch (err) {
            console.error("Playback error:", err);
            document.getElementById('speakBtn').innerText = "Speak";
        }
    }
    playNext();
}

document.getElementById('speakBtn').addEventListener('click', () => {
    const btn = document.getElementById('speakBtn');
    
    // Resume logic
    if (currentAudio && isPaused) {
        currentAudio.play();
        isPaused = false;
        btn.innerText = "Pause";
    } 
    // Pause logic
    else if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        isPaused = true;
        btn.innerText = "Resume";
    } 
    // Start logic
    else {
        if (window.currentChapterText) {
            speakChapter(window.currentChapterText);
            btn.innerText = "Pause";
        }
    }
});

// --- EPUB LOAD LOGIC ---
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Stop audio if user loads a new file
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    document.getElementById('speakBtn').innerText = "Speak";

    currentZip = await JSZip.loadAsync(await file.arrayBuffer());
    chapterFiles = Object.keys(currentZip.files)
        .filter(f => f.endsWith('.html') || f.endsWith('.xhtml'))
        .sort();
    
    select.innerHTML = '';
    chapterFiles.forEach((f, i) => {
        let opt = document.createElement('option');
        opt.value = i; opt.innerHTML = f.split('/').pop();
        select.appendChild(opt);
    });
    loadChapter(0);
});

async function loadChapter(index) {
    if (index < 0 || index >= chapterFiles.length) return;
    
    // Stop audio when changing chapters
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    document.getElementById('speakBtn').innerText = "Speak";
    
    select.value = index;
    const text = await currentZip.file(chapterFiles[index]).async("string");
    const doc = new DOMParser().parseFromString(text, 'text/html');
    window.currentChapterText = doc.body.textContent;
    readerDiv.innerHTML = "";
    readerDiv.appendChild(doc.body);
}

select.addEventListener('change', (e) => loadChapter(e.target.value));
document.getElementById('prevBtn').addEventListener('click', () => loadChapter(parseInt(select.value) - 1));
document.getElementById('nextBtn').addEventListener('click', () => loadChapter(parseInt(select.value) + 1));
