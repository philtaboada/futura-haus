//Validacion del token JWT
export const isValidToken = (token: string | null): boolean => {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payload = parts[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Verificar si el token tiene expiración
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < currentTime) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error al validar el token:', error);
    return false;
  }
};

export const getValidToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (isValidToken(token)) {
    return token;
  }
  // Si el token no es válido, eliminarlo del localStorage
  if (token) {
    localStorage.removeItem('token');
  }
  return null;
};

