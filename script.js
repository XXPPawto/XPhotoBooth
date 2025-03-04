// Access camera
const video = document.getElementById('camera');
const canvas = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('capture-btn');
const previewContainer = document.getElementById('preview-container');
const previewImg = document.getElementById('preview-img');
const qrisModal = document.getElementById('qrisModal');
const closeModal = document.querySelector('.close');
const themeToggle = document.getElementById('theme-toggle');
const resultPage = document.getElementById('resultPage');
const countdownTimer = document.getElementById('countdownTimer');
const resultPhoto1 = document.getElementById('resultPhoto1');
const resultPhoto2 = document.getElementById('resultPhoto2');
const resultPhoto3 = document.getElementById('resultPhoto3');

let isMirrored = false;
let photos = [];
let currentPhoto = null;
let currentFilter = 'none';
let currentFrame = 'basic';
let countdownInterval;

// Frame styles
const frameStyles = {
    'basic': { color: '#ccc', width: 20 },
    'vintage': { color: '#8B4513', width: 30 },
    'modern': { color: '#333', width: 15 }
};

// Camera access
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
    });

// Start photo session with 3-second timer between photos
function startPhotoSession() {
    photos = [];
    let photoCount = 0;

    const takePhotoSequence = () => {
        if (photoCount < 3) {
            showCountdown(3, () => {
                capturePhoto();
                photoCount++;
                if (photoCount < 3) takePhotoSequence();
            });
        }
    };

    takePhotoSequence();
}

// Show countdown timer
function showCountdown(seconds, callback) {
    countdownTimer.style.display = 'block';
    let count = seconds;

    countdownInterval = setInterval(() => {
        countdownTimer.textContent = count;
        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownTimer.style.display = 'none';
            callback();
        }
        count--;
    }, 1000);
}

// Capture photo
function capturePhoto() {
    const context = canvas.getContext('2d');
    const aspectRatio = video.videoWidth / video.videoHeight; // Hitung rasio aspek
    
    // Sesuaikan ukuran canvas dengan rasio aspek
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (isMirrored) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }

    // Apply filter to the canvas
    context.filter = currentFilter;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add frame to the canvas
    addFrameToCanvas(context, canvas.width, canvas.height);

    currentPhoto = canvas.toDataURL('image/png');
    photos.push(currentPhoto);

    if (photos.length === 3) {
        showResultPage();
    }
}

// Add frame to the canvas
function addFrameToCanvas(context, canvasWidth, canvasHeight) {
    const frame = frameStyles[currentFrame];
    const frameExtension = 40; // Tambahan tinggi frame untuk watermark
    
    // Gambar frame utama
    context.strokeStyle = frame.color;
    context.lineWidth = frame.width;
    context.strokeRect(0, 0, canvasWidth, canvasHeight + frameExtension);
    
    // Tambahkan watermark di bagian frame yang diperpanjang
    context.font = "20px Arial";
    context.fillStyle = "rgba(255, 255, 255, 0.7)";
    context.textAlign = "center";
    context.fillText("XPhotoBooth", canvasWidth / 2, canvasHeight + frameExtension - 15);
}

// Show result page with all photos
function showResultPage() {
    resultPhoto1.src = photos[0];
    resultPhoto2.src = photos[1];
    resultPhoto3.src = photos[2];
    resultPage.style.display = 'block';
    document.querySelector('.main').style.display = 'none';
}

// Apply frame to all photos
function applyFrame(frameType) {
    currentFrame = frameType;
    updatePreviewFrames();
}

// Update frames on the result page
function updatePreviewFrames() {
    const photoElements = [resultPhoto1, resultPhoto2, resultPhoto3];
    photoElements.forEach((img, index) => {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        const imgElement = new Image();

        imgElement.src = photos[index];
        imgElement.onload = () => {
            tempCanvas.width = imgElement.width;
            tempCanvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            addFrameToCanvas(ctx, tempCanvas.width, tempCanvas.height);
            img.src = tempCanvas.toDataURL();
        };
    });
}

// Download combined photo
function downloadCombinedPhoto() {
    const combinedCanvas = document.createElement('canvas');
    const context = combinedCanvas.getContext('2d');
    
    const photoWidth = 600; // Lebar foto
    const aspectRatio = video.videoWidth / video.videoHeight; // Rasio aspek
    const photoHeight = photoWidth / aspectRatio; // Hitung tinggi berdasarkan rasio aspek
    const frameExtension = 40; // Tambahan tinggi frame untuk watermark
    const padding = 10; // Jarak antar foto
    
    combinedCanvas.width = photoWidth + (padding * 2);
    combinedCanvas.height = (photoHeight + frameExtension) * 3 + (padding * 4);
    
    context.fillStyle = 'transparent';
    context.clearRect(0, 0, combinedCanvas.width, combinedCanvas.height);

    const loadImages = photos.map(photo => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = photo;
            img.onload = () => {
                const yPosition = (photoHeight + frameExtension + padding) * photos.indexOf(photo);
                
                // Gambar foto dengan mempertahankan rasio aspek
                context.drawImage(
                    img, 
                    padding, 
                    yPosition + padding, 
                    photoWidth, 
                    photoHeight
                );
                
                // Tambahkan frame
                context.strokeStyle = frameStyles[currentFrame].color;
                context.lineWidth = frameStyles[currentFrame].width;
                context.strokeRect(
                    padding - (context.lineWidth/2), 
                    yPosition + padding - (context.lineWidth/2), 
                    photoWidth + context.lineWidth, 
                    photoHeight + frameExtension + context.lineWidth
                );
                
                // Tambahkan watermark
                context.font = "20px Arial";
                context.fillStyle = "rgba(255, 255, 255, 0.7)";
                context.textAlign = "center";
                context.fillText("XPhotoBooth", photoWidth / 2 + padding, yPosition + photoHeight + frameExtension - 15);
                
                resolve();
            };
        });
    });

    Promise.all(loadImages).then(() => {
        const link = document.createElement('a');
        link.download = 'photobooth-collage.png';
        link.href = combinedCanvas.toDataURL('image/png');
        link.click();
    });
}

// Toggle mirror effect
function toggleMirror() {
    isMirrored = !isMirrored;
    video.classList.toggle('mirror');
}

// Apply filters
function applyFilter(filter) {
    currentFilter = filter;
    video.style.filter = filter;
}

// Dark Mode Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

// QRIS Modal Handling
document.querySelector('a[href="#support"]').addEventListener('click', function(e) {
    e.preventDefault();
    qrisModal.style.display = "block";
});

closeModal.onclick = function() {
    qrisModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == qrisModal) {
        qrisModal.style.display = "none";
    }
}

// Fungsi untuk toggle section
function showSection(sectionId) {
    const mainSection = document.getElementById('mainSection');
    const aboutSection = document.getElementById('aboutSection');
    const resultPage = document.getElementById('resultPage');

    // Sembunyikan semua section
    mainSection.style.display = 'none';
    aboutSection.style.display = 'none';
    resultPage.style.display = 'none';

    // Tampilkan section yang dipilih
    if(sectionId === 'main') {
        mainSection.style.display = 'block';
    } else if(sectionId === 'about') {
        aboutSection.style.display = 'block';
    }
}

// Update event listener untuk navbar
document.querySelector('.navbar a[href="#"]').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('main');
});

document.querySelector('.about').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('about');
});

// Fungsi untuk menyembunyikan welcome page
function hideWelcomePage() {
  const welcomePage = document.getElementById('welcomePage');
  welcomePage.style.opacity = '0';
  setTimeout(() => {
      welcomePage.style.display = 'none';
  }, 500); // Sesuaikan dengan durasi animasi fadeOut
}