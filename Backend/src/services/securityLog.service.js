/**
 * Security Event Logger for PSTU AlumNet
 * Logs security-sensitive authentication & authorization events.
 * Never logs plain passwords, hashes, JWT secrets, OTPs, or reset codes.
 */

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '[UNKNOWN]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[INVALID_EMAIL]';
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

const maskIp = (ip) => {
  if (!ip || typeof ip !== 'string') return 'UNKNOWN_IP';
  // Handle multi-IP lists from proxies (e.g. "203.0.113.195, 70.41.3.18")
  const rawIp = ip.split(',')[0].trim();
  // Strip IPv6 prefix if IPv4-mapped (e.g. ::ffff:192.168.1.1)
  const cleanIp = rawIp.replace(/^::ffff:/, '');
  return cleanIp || 'UNKNOWN_IP';
};

const getClientIp = (req) => {
  if (!req) return 'UNKNOWN_IP';
  const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
  const cfConnectingIp = req.headers ? req.headers['cf-connecting-ip'] : null;
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'UNKNOWN_IP';
};

const logSecurityEvent = (eventType, details = {}) => {
  const timestamp = new Date().toISOString();
  const clientIp = maskIp(details.ip);
  const userIdentifier = details.email ? maskEmail(details.email) : details.userId ? `User#${details.userId}` : 'N/A';
  const status = details.status || 'INFO';
  const message = details.message || '';

  const logLine = `[SECURITY_EVENT] [${timestamp}] [${eventType}] [Status: ${status}] [IP: ${clientIp}] [Target: ${userIdentifier}] - ${message}`;

  if (status === 'WARN' || status === 'BLOCKED' || status === 'FAILED') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
};

module.exports = {
  maskEmail,
  maskIp,
  getClientIp,
  logSecurityEvent,
};
