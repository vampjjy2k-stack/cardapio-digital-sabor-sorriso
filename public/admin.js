/* Painel da loja (/admin). JavaScript vanilla.
   A senha nunca fica salva aqui: o servidor confere e devolve um cookie HttpOnly. */
'use strict';

const $ = id => document.getElementById(id);

const sections = { loading: $('loading-section'), login: $('login-section'), panel: $('panel-section') };
const form = $('login-form');
const passwordInput = $('password');
const loginBtn = $('login-btn');
const loginError = $('login-error');
const panelError = $('panel-error');
const indicator = $('status-indicator');
const statusLabel = $('status-label');
const statusHint = $('status-hint');
const toggleBtn = $('toggle-btn');

let currentStatus = 'unavailable';
let updatedAt = null;

function show(name) {
  Object.entries(sections).forEach(([key, el]) => { el.hidden = key !== name; });
  if (name === 'login') passwordInput.focus();
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* resposta sem corpo */ }
  return { ok: res.ok, status: res.status, data };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function render() {
  const known = currentStatus === 'open' || currentStatus === 'closed';
  const open = currentStatus === 'open';
  indicator.className = `admin-status ${known ? (open ? 'is-open' : 'is-closed') : ''}`;
  statusLabel.textContent = !known ? 'Status INDISPONÍVEL' : open ? 'Loja ABERTA' : 'Loja FECHADA';
  const when = formatDate(updatedAt);
  statusHint.textContent = !known ? 'Não foi possível confirmar o status. Recarregue a página para tentar novamente.'
    : (open ? 'Clientes podem enviar pedidos.' : 'Pedidos pausados para os clientes.') + (when ? ` Alterado em ${when}.` : '');
  toggleBtn.disabled = !known;
  toggleBtn.textContent = !known ? 'Status indisponível' : open ? 'Fechar a loja' : 'Abrir a loja';
  toggleBtn.className = `btn admin-btn ${known ? (open ? 'admin-btn--close' : 'admin-btn--open') : ''}`;
}

function markStatusUnavailable() {
  currentStatus = 'unavailable';
  updatedAt = null;
  showError(panelError, 'Não foi possível confirmar o status atual. Recarregue a página para tentar novamente.');
  render();
}

async function loadStatus() {
  currentStatus = 'unavailable';
  updatedAt = null;
  render();
  try {
    const { ok, data } = await api('/api/status', { signal: AbortSignal.timeout(6000) });
    if (!ok || !data || data.degraded || !['open', 'closed'].includes(data.status)) {
      markStatusUnavailable();
      return;
    }
    currentStatus = data.status;
    updatedAt = data.updatedAt || null;
    showError(panelError, '');
    render();
  } catch {
    markStatusUnavailable();
  }
}

async function checkSession() {
  try {
    const { ok, data } = await api('/api/session');
    if (ok && data && data.authenticated) {
      show('panel');
      await loadStatus();
    } else {
      show('login');
    }
  } catch (e) {
    show('login');
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  showError(loginError, '');
  const password = passwordInput.value;
  if (!password) {
    showError(loginError, 'Digite a senha.');
    passwordInput.focus();
    return;
  }
  loginBtn.disabled = true;
  try {
    const { ok, data } = await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
    if (ok) {
      passwordInput.value = '';
      show('panel');
      await loadStatus();
    } else {
      showError(loginError, (data && data.error) || 'Não foi possível entrar.');
      passwordInput.select();
    }
  } catch (e) {
    showError(loginError, 'Sem conexão. Verifique a internet e tente de novo.');
  } finally {
    loginBtn.disabled = false;
  }
});

$('show-password').addEventListener('change', event => {
  passwordInput.type = event.target.checked ? 'text' : 'password';
});

toggleBtn.addEventListener('click', async () => {
  if (!['open', 'closed'].includes(currentStatus)) return;
  const next = currentStatus === 'open' ? 'closed' : 'open';
  showError(panelError, '');
  toggleBtn.disabled = true;
  try {
    const { ok, status, data } = await api('/api/status', { method: 'PUT', body: JSON.stringify({ status: next }), signal: AbortSignal.timeout(6000) });
    if (ok && data && !data.degraded && ['open', 'closed'].includes(data.status)) {
      currentStatus = data.status;
      updatedAt = data.updatedAt || null;
      render();
    } else if (status === 401) {
      show('login');
      showError(loginError, 'Sua sessão expirou. Entre novamente.');
    } else {
      markStatusUnavailable();
    }
  } catch (e) {
    // Uma falha pode ocorrer após a gravação; não afirmar que nada mudou.
    markStatusUnavailable();
  } finally {
    render();
  }
});

$('logout-btn').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* segue para a tela de login */ }
  showError(loginError, '');
  show('login');
});

checkSession();
