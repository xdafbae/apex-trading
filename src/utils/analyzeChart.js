const BACKEND_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

/**
 * Convert a File object to a base64 string (without the data URL prefix)
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMediaType(file) {
  const typeMap = {
    'image/png': 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/webp': 'image/webp',
  };
  return typeMap[file.type] || 'image/jpeg';
}

/**
 * Send chart image to APEX backend for analysis
 * @param {File} imageFile
 * @returns {Promise<Object>} parsed analysis result
 */
export async function analyzeChart(imageFile) {
  if (!imageFile) throw new Error('No chart image provided');

  const image_base64 = await fileToBase64(imageFile);
  const media_type = getMediaType(imageFile);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64, media_type }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || `HTTP ${response.status}`);
    }

    return json.data;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

/**
 * Check if the backend is reachable and API key is configured
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    return await res.json();
  } catch {
    return { status: 'unreachable' };
  }
}

export function getErrorMessage(error) {
  const msg = error?.message || '';
  const map = {
    'SERVER_API_KEY_MISSING': 'API key not configured on server. Set GEMINI_API_KEY in apex-backend/.env',
    'INVALID_API_KEY': 'API key is invalid. Check GEMINI_API_KEY in apex-backend/.env',
    'RATE_LIMITED': 'Rate limit reached. Please wait a moment and try again.',
    'TIMEOUT': 'Analysis timed out. Check your connection and try again.',
    'SERVER_ERROR': 'Server error. Make sure the backend is running on port 3001.',
    'Failed to fetch': 'Cannot reach backend. Make sure apex-backend server is running.',
  };
  return map[msg] || map[Object.keys(map).find((k) => msg.includes(k))] || msg || 'Analysis failed. Please try again.';
}
