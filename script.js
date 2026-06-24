// Function to change the visual theme
function setTheme(theme) {
    document.body.className = theme;
}

// Function to handle the file upload and "diving" into the book
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        // Use JSZip to open the file locally in your phone's memory
        JSZip.loadAsync(e.target.result).then(function(zip) {
            
            // Find all files that end in .html or .xhtml
            const files = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
            
            // Pick the first file found (usually the first chapter) and convert to text
            if (files.length > 0) {
                zip.file(files[0]).async("string").then(function(text) {
                    // Update the display with the book content
                    document.getElementById('reader').innerHTML = text;
                });
            } else {
                document.getElementById('reader').innerHTML = "No se pudo encontrar contenido en este archivo.";
            }
        }).catch(function(err) {
            console.error("Error al abrir el EPUB:", err);
            document.getElementById('reader').innerHTML = "Error al abrir el archivo.";
        });
    };

    reader.readAsArrayBuffer(file);
});
