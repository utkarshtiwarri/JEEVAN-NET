import { useCallback, useState } from "react";
import { DEFAULT_ORIGIN, haversineKm } from "./scoring.js";

// Where should distances be measured from?
//
// The dataset is a 6 km slice of Delhi, so there are two useful origins:
//   - the dataset's own origin (Connaught Place), always available, and
//   - the browser's reported position, when the user grants it.
//
// This deliberately does NOT silently substitute one for the other. If the user
// is outside the covered area, the caller is told, so the UI can say "this build
// only has Delhi data" rather than showing a Delhi hospital as "2.3 km away" to
// someone in Bengaluru.

export const COVERAGE_RADIUS_KM = 6;

const DENIED = "denied";
const UNAVAILABLE = "unavailable";
const TIMEOUT = "timeout";

export function useLocation() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [source, setSource] = useState("default"); // "default" | "device"
  const [status, setStatus] = useState("idle"); // idle | locating | ok | error
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setOrigin(DEFAULT_ORIGIN);
    setSource("default");
    setStatus("idle");
    setError("");
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("This browser does not expose a location API. Using the default origin.");
      return;
    }

    setStatus("locating");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: Number(position.coords.latitude.toFixed(5)),
          lon: Number(position.coords.longitude.toFixed(5)),
        };
        const fromDataset = haversineKm(next, DEFAULT_ORIGIN);

        setOrigin(next);
        setSource("device");
        setStatus("ok");

        if (fromDataset > COVERAGE_RADIUS_KM) {
          setError(
            `You are ${Math.round(fromDataset)} km from the area this build has data for ` +
              `(${DEFAULT_ORIGIN.name}). No facilities will be listed until a dataset for your ` +
              `region is imported with scripts/fetch-facilities.mjs.`,
          );
        }
      },
      (err) => {
        setStatus("error");
        setSource("default");
        setOrigin(DEFAULT_ORIGIN);
        setError(
          err?.code === 1 || err?.message === DENIED
            ? "Location permission was declined. Using the default origin."
            : err?.code === 3 || err?.message === TIMEOUT
              ? "Locating took too long. Using the default origin."
              : `Could not get a location (${err?.message || UNAVAILABLE}). Using the default origin.`,
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  return { origin, source, status, error, locate, reset };
}
