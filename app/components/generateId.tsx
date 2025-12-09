// Utility to generate IDs safely in both browser and server environments

const generateId = (): string => {
  if (typeof globalThis !== 'undefined' && 'crypto' in globalThis) {
    const cryptoObj = globalThis.crypto as Crypto;
    if ('randomUUID' in cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }
  }

  const randomPart: string = Math.random().toString(16).slice(2);
  const timePart: string = Date.now().toString(16);
  return `${timePart}-${randomPart}`;
};

export default generateId;