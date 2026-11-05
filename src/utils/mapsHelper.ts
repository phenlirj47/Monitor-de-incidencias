/**
 * Helper to build intelligent Google Maps queries for difficult addresses in Mexico,
 * combining street addresses with Beetrack landmarks, cross-streets ("entre calles"),
 * and observations (e.g. "Esquina con Camino Viejo", "anuncio de Tecate").
 */

export interface SmartMapsResult {
  hasGps: boolean;
  gpsUrl: string | null;
  cleanAddress: string;
  combinedQuery: string;
  smartMapsUrl: string;
  addressOnlyUrl: string;
}

export function buildSmartMapsData(
  direccion: string,
  referencias?: string,
  lat?: number | null,
  lng?: number | null
): SmartMapsResult {
  const rawDir = (direccion || '').trim();
  const rawRef = (referencias || '').trim();

  // 1. Check valid GPS coordinates
  const hasGps =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0;

  const gpsUrl = hasGps
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : null;

  // 2. Clean Mexican address quirks (e.g. "SN", "S/N", "SIN NUMERO")
  // Google Maps geocoder frequently fails when "SN" is included as a street number
  let cleanDir = rawDir
    .replace(/\bS\/?N\b/gi, '')
    .replace(/\bSIN\s+N[UÚ]MERO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanDir) {
    cleanDir = rawDir;
  }

  // 3. Combine Address with References & Cross-streets
  const parts: string[] = [];
  if (cleanDir) {
    parts.push(cleanDir);
  }

  if (rawRef) {
    // Remove redundant labels if already present
    const cleanRef = rawRef
      .replace(/^(referencias?|ref|obs|observaciones?|entre calles?):\s*/gi, '')
      .trim();
    if (cleanRef) {
      parts.push(cleanRef);
    }
  }

  const combinedQuery = parts.join(' ').replace(/\s+/g, ' ').trim();

  const smartMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    combinedQuery || rawDir || 'Ciudad de México'
  )}`;

  const addressOnlyUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    cleanDir || rawDir || 'Ciudad de México'
  )}`;

  return {
    hasGps,
    gpsUrl,
    cleanAddress: cleanDir,
    combinedQuery,
    smartMapsUrl,
    addressOnlyUrl,
  };
}
