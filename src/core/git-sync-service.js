const { execFile } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SYNC_SCRIPT = path.join(ROOT_DIR, 'scripts/git-sync.js');

let debounceTimer = null;
const DEBOUNCE_DELAY = 5000; // 5 segundos de inactividad

/**
 * Ejecuta el script de sincronización de Git de forma asíncrona.
 * @param {string} message - El mensaje de commit a enviar.
 */
function runGitSync(message) {
  if (process.env.AUTO_GIT_SYNC !== 'true') {
    return;
  }
  
  console.log(`[GitSync] Iniciando sincronización de Git: "${message}"`);
  
  execFile(process.execPath, [SYNC_SCRIPT, message], { cwd: ROOT_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[GitSync] Error al sincronizar con Git: ${error.message}`);
      return;
    }
    if (stderr) {
      console.warn(`[GitSync] Salida de error (stderr): ${stderr}`);
    }
    console.log(`[GitSync] Sincronización completada con éxito:\n${stdout}`);
  });
}

/**
 * Planifica una sincronización de Git con un debounce timer de 5 segundos.
 * @param {string} actionMessage - Mensaje descriptivo de la acción que causó la modificación.
 */
function scheduleSync(actionMessage) {
  if (process.env.AUTO_GIT_SYNC !== 'true') {
    return;
  }

  const message = `sync: auto-commit db/ - ${actionMessage}`;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    console.log(`[GitSync] Debounce en curso. Reiniciando temporizador para: "${actionMessage}"`);
  } else {
    console.log(`[GitSync] Planificando sincronización de Git en ${DEBOUNCE_DELAY / 1000}s para: "${actionMessage}"`);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runGitSync(message);
  }, DEBOUNCE_DELAY);
}

module.exports = {
  scheduleSync
};
