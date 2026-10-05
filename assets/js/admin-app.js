// ── ADMIN APP LOGIC ──
import { requireAdminAuth, logout } from './auth.js';
import { dbSelect, dbUpdate, dbInsert, dbDelete, subscribeToTable } from './firebase.js';
import { formatCurrency, formatDate, showToast, initSidebar } from './utils.js';

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentAdmin = await requireAdminAuth(['super_admin', 'admin', 'support']);
  if (!currentAdmin) return;

  initAdminUI();
  await loadDashboardStats();
  await loadAnnouncementStatus();
  await loadActivityFeed();
  initVolumeChart();
  initSidebar();

  // Realtime subscriptions
  subscribeToTable('users', () => loadDashboardStats());
  subscribeToTable('accounts', () => loadDashboardStats());
  subscribeToTable('balances', () => loadDashboardStats());
  subscribeToTable('transfers', () => loadDashboardStats());
  subscribeToTable('kyc_documents', () => loadDashboardStats());
  subscribeToTable('notifications', () => loadAnnouncementStatus());
});

function initAdminUI() {
  document.getElementById('admin-name').textContent = currentAdmin.full_name;
  document.getElementById('admin-role').textContent = currentAdmin.role;
  document.getElementById('admin-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.full_name)}&background=ef4444&color=fff`;

  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.stopPropagation(); logout(true);
  });
}

async function loadDashboardStats() {
  const { data: users } = await dbSelect('users', { order: { column: 'created_at', ascending: false } });
  const { data: accounts } = await dbSelect('accounts');
  const { data: balances } = await dbSelect('balances');
  const { data: transfers } = await dbSelect('transfers', { eq: { status: 'pending' } });
  const { data: kyc } = await dbSelect('kyc_documents', { eq: { status: 'pending' } });

  let totalBal = 0;
  if (balances) balances.forEach(b => totalBal += Number(b.available || 0));

  const uCount = users ? users.length : 0;
  const tCount = transfers ? transfers.length : 0;
  const kCount = kyc ? kyc.length : 0;

  if (document.getElementById('stat-total-users')) document.getElementById('stat-total-users').textContent = uCount;
  if (document.getElementById('stat-pending-transfers')) document.getElementById('stat-pending-transfers').textContent = tCount;
  if (document.getElementById('stat-pending-kyc')) document.getElementById('stat-pending-kyc').textContent = kCount;
  if (document.getElementById('stat-total-balance')) document.getElementById('stat-total-balance').textContent = formatCurrency(totalBal);
  
  if (document.getElementById('pending-transfer-count')) document.getElementById('pending-transfer-count').textContent = tCount;
  if (document.getElementById('pending-kyc-count')) document.getElementById('pending-kyc-count').textContent = kCount;

  const accountsMap = {};
  if (accounts) {
    accounts.forEach(a => {
      if (!accountsMap[a.user_id] || a.account_type === 'checking') {
        accountsMap[a.user_id] = a;
      }
    });
  }

  const balancesMap = {};
  if (balances) {
    balances.forEach(b => {
      balancesMap[b.account_id] = b;
    });
  }

  // Render Dashboard Registered Clients Table
  const tbody = document.getElementById('dashboard-users-tbody');
  if (tbody) {
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-24 text-muted">No registered clients found.</td></tr>';
    } else {
      tbody.innerHTML = '';
      users.slice(0, 10).forEach(u => {
        let statusBadge = 'badge-success';
        if (u.status === 'suspended') statusBadge = 'badge-danger';
        if (u.status === 'frozen') statusBadge = 'badge-warning';

        let kycBadge = 'badge-neutral';
        if (u.kyc_status === 'approved') kycBadge = 'badge-success';
        if (u.kyc_status === 'pending') kycBadge = 'badge-warning';
        if (u.kyc_status === 'rejected') kycBadge = 'badge-danger';

        const acct = accountsMap[u.id] || accountsMap[u.auth_id] || null;
        const bal = acct ? balancesMap[acct.id] : null;
        const currency = acct ? (acct.currency || 'USD') : 'USD';
        const acctNum = acct ? acct.account_number : 'Pending Provision';
        const availFormatted = (currency === 'USD' ? '$' : currency + ' ') + Number(bal?.available || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const pendFormatted = (currency === 'USD' ? '$' : currency + ' ') + Number(bal?.pending || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        tbody.innerHTML += `
          <tr>
            <td>
              <div class="user-row-info">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=1a56db&color=fff" class="avatar avatar-sm">
                <div>
                  <div class="user-row-name">${u.full_name}</div>
                  <div class="user-row-email">${u.email}</div>
                  <div class="text-xs text-muted"><strong>SSN:</strong> ${u.ssn || 'N/A'} &bull; <strong>Phone:</strong> ${u.phone || 'N/A'}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-family: monospace; font-size: 0.85rem; font-weight: bold; color: var(--primary-light);">${acctNum}</div>
              <div style="font-size: 0.9rem; font-weight: bold; color: var(--success);">${availFormatted}</div>
              <div style="font-size: 0.7rem; color: var(--text-400);">Pending: ${pendFormatted}</div>
            </td>
            <td><span class="badge ${statusBadge}">${u.status || 'active'}</span></td>
            <td><span class="badge ${kycBadge}">${u.kyc_status || 'pending'}</span></td>
            <td>${formatDate(u.created_at)}</td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-6">
                <button class="btn-icon-sm bg-[var(--bg-500)] text-success hover:bg-[var(--success)] hover:text-white" onclick="window.quickAddMoney('${u.id}')" title="Quick Add Money">
                  <i class="ph-bold ph-plus"></i>
                </button>
                <button class="btn-icon-sm bg-[var(--bg-500)] text-danger hover:bg-[var(--danger)] hover:text-white" onclick="window.quickToggleCardLock('${u.id}')" title="Lock / Unlock Card (Freeze Account)">
                  <i class="ph-bold ph-lock-key"></i>
                </button>
                <button class="btn-icon-sm bg-[var(--bg-500)] text-warning hover:bg-[var(--warning)] hover:text-white" onclick="window.quickToggleCardMask('${u.id}')" title="Hide/Show Card Details (******)">
                  <i class="ph-bold ph-eye-slash"></i>
                </button>
                <button class="btn-icon-sm bg-[var(--bg-500)] text-success hover:bg-[var(--success)] hover:text-white" onclick="window.quickToggleKYC('${u.id}', '${u.kyc_status || 'pending'}')" title="Toggle KYC Approval">
                  <i class="ph-bold ph-shield-check"></i>
                </button>
                <button class="btn-icon-sm bg-[var(--bg-500)] text-white hover:bg-[var(--primary)]" onclick="window.quickToggleStatus('${u.id}', '${u.status === 'active' ? 'suspended' : 'active'}')" title="Toggle Suspend / Active">
                  <i class="ph-bold ${u.status === 'active' ? 'ph-pause' : 'ph-play'}"></i>
                </button>
                <a href="users.html" class="btn btn-sm btn-ghost" title="Open Full Client Controls">
                  <i class="ph-bold ph-gear"></i> Manage
                </a>
              </div>
            </td>
          </tr>
        `;
      });
    }
  }
}

window.quickAddMoney = async (userId) => {
  const amountStr = prompt("Enter dollar amount to deposit/credit to this client:");
  if (!amountStr) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    showToast("Invalid amount", "danger");
    return;
  }

  let { data: accounts } = await dbSelect('accounts', { eq: { user_id: userId, account_type: 'checking' } });
  if (!accounts || accounts.length === 0) {
    const { data: allAccounts } = await dbSelect('accounts', { eq: { user_id: userId } });
    if (allAccounts && allAccounts.length > 0) accounts = allAccounts;
    else {
      const { generateAccountNumber, generateIBAN, generateSWIFT } = await import('./utils.js');
      const accountNumber = generateAccountNumber();
      const { data: newAcct } = await dbInsert('accounts', {
        user_id: userId,
        account_number: accountNumber,
        iban: generateIBAN(accountNumber),
        swift: generateSWIFT(),
        account_type: 'checking',
        currency: 'USD',
        status: 'active',
        nickname: 'Primary Checking'
      });
      accounts = Array.isArray(newAcct) ? newAcct : [newAcct];
      await dbInsert('balances', { account_id: accounts[0].id, available: 0.00, pending: 0.00 });
    }
  }

  const accountId = accounts[0].id;
  let { data: bal } = await dbSelect('balances', { eq: { account_id: accountId } });
  if (!bal || bal.length === 0) {
    const { data: newBal } = await dbInsert('balances', { account_id: accountId, available: 0.00, pending: 0.00 });
    bal = Array.isArray(newBal) ? newBal : [newBal];
  }

  const newAvail = Number(bal[0].available) + amount;
  await dbUpdate('balances', { available: newAvail }, { account_id: accountId });
  await dbInsert('transactions', {
    account_id: accountId,
    type: 'credit',
    amount: amount,
    description: 'Admin Quick Deposit',
    status: 'completed',
    ref_no: 'DEP-' + Math.floor(Math.random() * 1000000)
  });

  showToast(`Successfully credited $${amount.toFixed(2)} to client.`, "success");
  loadDashboardStats();
};

window.quickToggleKYC = async (userId, currentKYC) => {
  const nextKYC = currentKYC === 'approved' ? 'pending' : 'approved';
  const { error } = await dbUpdate('users', { kyc_status: nextKYC }, { id: userId });
  if (!error) {
    showToast(`Client KYC set to ${nextKYC}.`, "success");
    loadDashboardStats();
  } else {
    showToast("Failed to update KYC: " + error.message, "danger");
  }
};

window.quickToggleStatus = async (userId, newStatus) => {
  const { error } = await dbUpdate('users', { status: newStatus }, { id: userId });
  if (!error) {
    showToast(`Client status updated to ${newStatus}.`, "success");
    loadDashboardStats();
  } else {
    showToast("Failed to update status: " + error.message, "danger");
  }
};

window.quickToggleCardLock = async (userId) => {
  const { data: cards } = await dbSelect('cards', { eq: { user_id: userId } });
  if (!cards || cards.length === 0) {
    showToast("No card found for this user to lock.", "warning");
    return;
  }
  const card = cards[0];
  const isLocked = card.status === 'frozen' || card.status === 'locked';
  const newStatus = isLocked ? 'active' : 'frozen';
  const { error } = await dbUpdate('cards', { status: newStatus }, { id: card.id });
  if (error) {
    showToast("Failed to update card lock status: " + error.message, "danger");
  } else {
    showToast(newStatus === 'frozen' ? "Card has been LOCKED / FROZEN by administrator." : "Card has been UNLOCKED and activated.", "success");
    loadDashboardStats();
  }
};

window.quickToggleCardMask = async (userId) => {
  const { data: cards } = await dbSelect('cards', { eq: { user_id: userId } });
  if (!cards || cards.length === 0) {
    showToast("No card found for this user.", "warning");
    return;
  }
  const card = cards[0];
  const newHide = !(card.hide_details === true || card.hide_details === 'true');
  const { error } = await dbUpdate('cards', { hide_details: newHide }, { id: card.id });
  if (error) {
    showToast("Failed to update card visibility: " + error.message, "danger");
  } else {
    showToast(newHide ? "Card details are now masked (******) in user portal." : "Card details are now unmasked and visible in user portal.", "success");
    loadDashboardStats();
  }
};

async function loadActivityFeed() {
  const { data: logs } = await dbSelect('admin_logs', { order: { column: 'timestamp', ascending: false }, limit: 5 });
  const feed = document.getElementById('audit-feed');
  if (!feed) return;
  feed.innerHTML = '';

  if (!logs || logs.length === 0) {
    feed.innerHTML = `<div class="text-center text-muted text-sm py-16">No recent activity</div>`;
    return;
  }

  logs.forEach((log, index) => {
    const isLast = index === logs.length - 1;
    let dotClass = 'info';
    if (log.action.includes('approve')) dotClass = 'create';
    if (log.action.includes('reject')) dotClass = 'delete';
    if (log.action.includes('update')) dotClass = 'update';

    feed.innerHTML += `
      <div class="audit-item">
        <div class="audit-dot-col">
          <div class="audit-dot ${dotClass}"></div>
          ${!isLast ? '<div class="audit-line"></div>' : ''}
        </div>
        <div class="audit-content">
          <div class="audit-action">${log.action} on ${log.entity_type}</div>
          <div class="audit-meta">
            <span><i class="ph-bold ph-clock"></i> ${formatDate(log.timestamp)}</span>
            <span class="audit-ip">${log.ip_address || '127.0.0.1'}</span>
          </div>
        </div>
      </div>
    `;
  });
}

function initVolumeChart() {
  const ctx = document.getElementById('volumeChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
      datasets: [{
        label: 'Transfer Volume ($)',
        data: [15000, 22000, 18000, 31000, 28000, 42000, 19000],
        backgroundColor: 'rgba(26,86,219,0.8)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
        x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

async function loadAnnouncementStatus() {
  const statusEl = document.getElementById('announcement-status-text');
  const stopBtn = document.getElementById('stop-announcement-btn');
  if (!statusEl) return;

  const { data: announcements } = await dbSelect('notifications', { eq: { title: 'System Announcement' } });
  if (announcements && announcements.length > 0) {
    const latest = announcements[0];
    statusEl.innerHTML = `<span class="badge badge-warning" style="font-size: 0.75rem; vertical-align: middle;">ACTIVE</span> <strong style="color: var(--warning); margin-left: 6px;">"${latest.message.substring(0, 70)}${latest.message.length > 70 ? '...' : ''}"</strong> (${announcements.length} broadcast records active)`;
    if (stopBtn) stopBtn.style.display = 'inline-flex';
  } else {
    statusEl.innerHTML = `<span class="badge badge-neutral" style="font-size: 0.75rem; vertical-align: middle;">INACTIVE</span> <span class="text-muted" style="margin-left: 6px;">No announcements currently running. Client portals are clean.</span>`;
    if (stopBtn) stopBtn.style.display = 'none';
  }
}

window.stopAllAnnouncements = async function() {
  if (!confirm('Are you sure you want to stop and remove all active system announcements from all user portals?')) return;

  const { data: list } = await dbSelect('notifications', { eq: { title: 'System Announcement' } });
  if (list && list.length > 0) {
    for (const item of list) {
      await dbDelete('notifications', { id: item.id });
    }
  }

  // Also remove legacy local storage key if present
  localStorage.removeItem('active_announcement');

  showToast('All system announcements stopped and cleared successfully.', 'success');
  await loadAnnouncementStatus();
};

window.openBroadcastModal = async function() {
  const msg = prompt('Enter System Announcement message to broadcast to all clients:');
  if (!msg || !msg.trim()) return;

  const { data: users } = await dbSelect('users');
  if (users && users.length > 0) {
    for (const u of users) {
      await dbInsert('notifications', {
        user_id: u.id,
        title: 'System Announcement',
        message: msg.trim(),
        type: 'warning',
        created_at: new Date().toISOString()
      });
    }
  } else {
    await dbInsert('notifications', {
      user_id: 'all',
      title: 'System Announcement',
      message: msg.trim(),
      type: 'warning',
      created_at: new Date().toISOString()
    });
  }

  showToast('Announcement broadcasted to all client portals!', 'success');
  await loadAnnouncementStatus();
};
