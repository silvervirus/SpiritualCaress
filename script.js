// Function to change theme
function setTheme(theme) {
    document.body.className = theme;
}

// Logic to handle EPUB file reading
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const readerDiv = document.getElementById('reader');

    reader.onload = function(e) {
        JSZip.loadAsync(e.target.result).then(function(zip) {
            // Find the first HTML/XHTML file in the EPUB
            const files = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
            
            if (files.length > 0) {
                zip.file(files[0]).async("string").then(function(text) {
                    // Display the content
                    readerDiv.innerHTML = text;
                });
            } else {
                readerDiv.innerHTML = "No se pudo encontrar contenido legible.";
            }
        }).catch(function(err) {
            readerDiv.innerHTML = "Error al procesar el archivo.";
            console.error(err);
        });
    };

    reader.readAsArrayBuffer(file);
});
