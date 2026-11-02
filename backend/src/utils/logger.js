const time = () => new Date().toTimeString().slice(0, 8);
const fmt = (level, tag, msg, data) =>
  `${time()} ${level} [${tag}] ${msg}${data === undefined ? '' : ' ' + (typeof data === 'string' ? data : JSON.stringify(data))}`;

export const log = {
  info: (tag, msg, data) => console.log(fmt('INFO ', tag, msg, data)),
  warn: (tag, msg, data) => console.warn(fmt('WARN ', tag, msg, data)),
  error: (tag, msg, data) => console.error(fmt('ERROR', tag, msg, data)),
};

export const mask = (p = '') => (String(p).length > 6 ? String(p).slice(0, 2) + '****' + String(p).slice(-3) : '***');