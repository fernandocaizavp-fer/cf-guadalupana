/**
 * Descarga un archivo de Cloudinary conservando su nombre original (con tildes
 * y ñ). Si se abre la URL directa, el navegador usa el nombre que generó
 * Cloudinary, que elimina los acentos y agrega un sufijo aleatorio
 * (p. ej. "Matem_tica_x8f3.pdf"). Aquí se baja el contenido como blob y se
 * fuerza el nombre con el atributo `download`.
 * Si la descarga falla (red, CORS), se abre la URL en otra pestaña como respaldo.
 */
export async function descargarConNombre(url: string, nombre: string): Promise<void> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = (nombre || 'archivo').normalize('NFC');
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}
