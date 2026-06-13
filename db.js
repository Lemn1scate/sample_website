/**
 * RH Point Engineering Services
 * db.js — Browser-based database layer (localStorage)
 * Simulates a SQL table: inquiries
 *
 * Schema:
 *   id          INTEGER PRIMARY KEY AUTOINCREMENT
 *   name        TEXT NOT NULL
 *   email       TEXT NOT NULL
 *   phone       TEXT
 *   service     TEXT
 *   message     TEXT
 *   status      TEXT DEFAULT 'new'   -- new | read | replied | archived
 *   created_at  TEXT (ISO timestamp)
 *   updated_at  TEXT (ISO timestamp)
 */

const DB = (() => {
  const TABLE = 'rhpoint_inquiries';
  const ADMIN = 'rhpoint_admin';

  // ── helpers ──────────────────────────────────────────────────────────────
  function _load() {
    try { return JSON.parse(localStorage.getItem(TABLE)) || []; }
    catch { return []; }
  }
  function _save(rows) {
    localStorage.setItem(TABLE, JSON.stringify(rows));
  }
  function _now() { return new Date().toISOString(); }
  function _nextId(rows) {
    return rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
  }

  // ── Inquiries table ───────────────────────────────────────────────────────
  function insertInquiry({ name, email, phone, service, message }) {
    const rows = _load();
    const row = {
      id: _nextId(rows),
      name: name || '',
      email: email || '',
      phone: phone || '',
      service: service || '',
      message: message || '',
      status: 'new',
      created_at: _now(),
      updated_at: _now(),
    };
    rows.push(row);
    _save(rows);
    return row;
  }

  function getAllInquiries({ status, search, sort = 'desc' } = {}) {
    let rows = _load();
    if (status && status !== 'all') rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => sort === 'desc'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at)
    );
    return rows;
  }

  function getInquiryById(id) {
    return _load().find(r => r.id === id) || null;
  }

  function updateStatus(id, status) {
    const rows = _load();
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rows[idx].status = status;
    rows[idx].updated_at = _now();
    _save(rows);
    return rows[idx];
  }

  function deleteInquiry(id) {
    const rows = _load();
    const filtered = rows.filter(r => r.id !== id);
    _save(filtered);
    return filtered.length < rows.length;
  }

  function getStats() {
    const rows = _load();
    return {
      total: rows.length,
      new: rows.filter(r => r.status === 'new').length,
      read: rows.filter(r => r.status === 'read').length,
      replied: rows.filter(r => r.status === 'replied').length,
      archived: rows.filter(r => r.status === 'archived').length,
    };
  }

  // ── Admin auth (simple, client-side only) ─────────────────────────────────
  const DEFAULT_CREDENTIALS = { username: 'admin', password: 'rhpoint2026' };

  function adminLogin(username, password) {
    const creds = JSON.parse(localStorage.getItem(ADMIN + '_creds') || 'null') || DEFAULT_CREDENTIALS;
    if (username === creds.username && password === creds.password) {
      const token = btoa(username + ':' + Date.now());
      localStorage.setItem(ADMIN + '_token', token);
      localStorage.setItem(ADMIN + '_token_exp', Date.now() + 8 * 60 * 60 * 1000); // 8h
      return token;
    }
    return null;
  }

  function adminLogout() {
    localStorage.removeItem(ADMIN + '_token');
    localStorage.removeItem(ADMIN + '_token_exp');
  }

  function isAdminLoggedIn() {
    const token = localStorage.getItem(ADMIN + '_token');
    const exp = parseInt(localStorage.getItem(ADMIN + '_token_exp') || '0');
    return !!(token && Date.now() < exp);
  }

  // ── Seed demo data (only once) ─────────────────────────────────────────────
  function seedDemo() {
    if (localStorage.getItem(TABLE + '_seeded')) return;
    const demos = [
      { name: 'Maria Santos', email: 'maria.santos@email.com', phone: '+63 917 123 4567', service: 'Airconditioning Solutions', message: 'Hi, I need to have my 3 AC units cleaned and checked before summer. Please let me know your schedule and rates.', status: 'replied' },
      { name: 'Jose dela Cruz', email: 'jose.delacruz@gmail.com', phone: '+63 905 987 6543', service: 'CCTV & Security Systems', message: 'I want to install CCTV cameras in my warehouse in Cabuyao. Approximately 8 cameras needed, outdoor and indoor.', status: 'read' },
      { name: 'Ana Reyes', email: 'ana.reyes@corp.com', phone: '+63 999 456 7890', service: 'Flooring Solutions', message: 'We are renovating our office and looking for SPC flooring installation for about 200 sqm. Can you provide a quotation?', status: 'new' },
      { name: 'Carlo Mendoza', email: 'carlo@mendoza.ph', phone: '+63 912 234 5678', service: 'Metal Fabrication Works', message: 'Looking for custom metal fabrication for industrial shelving units. About 10 units, heavy duty.', status: 'new' },
      { name: 'Liza Tan', email: 'liza.tan@business.com', phone: '+63 920 345 6789', service: 'Computer Hardware & Software', message: 'Our office computers need maintenance and some units need to be upgraded. We have 15 desktops and 5 laptops.', status: 'archived' },
    ];
    const rows = [];
    demos.forEach((d, i) => {
      const daysAgo = (demos.length - i) * 3;
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
      rows.push({ id: i + 1, ...d, created_at: date, updated_at: date });
    });
    _save(rows);
    localStorage.setItem(TABLE + '_seeded', '1');
  }

  return {
    insertInquiry, getAllInquiries, getInquiryById,
    updateStatus, deleteInquiry, getStats,
    adminLogin, adminLogout, isAdminLoggedIn,
    seedDemo,
  };
})();
