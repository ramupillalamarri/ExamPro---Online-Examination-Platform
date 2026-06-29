let _lastError = null;

export function setLastError(err) {
  _lastError = err ? String(err) : null;
}

export function getLastError() {
  return _lastError;
}

export default { setLastError, getLastError };
