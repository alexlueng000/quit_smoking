function decodeBasicCredentials(header: string): { username: string; password: string } | null {
  if (!header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function validateAdminAuthorization(
  header: string | null,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  if (!header || !expectedUsername || expectedPassword.length < 16) return false;
  const credentials = decodeBasicCredentials(header);
  return Boolean(
    credentials &&
      constantTimeEqual(credentials.username, expectedUsername) &&
      constantTimeEqual(credentials.password, expectedPassword),
  );
}
