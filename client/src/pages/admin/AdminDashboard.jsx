import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';
import { UsersIcon, CoinIcon, ClockIcon, BarChartIcon, ShieldIcon, ZapIcon } from '../../components/Icons';

const TX_LABELS = {
  welcome_bonus: 'Welcome Bonus', daily_checkin: 'Daily Check-in',
  withdrawal: 'Withdrawal', adjoy_offer: 'adjoe Offer',
  adjoe_offer: 'adjoe Offer',
  revu_offer: 'Revu Offer', offery_offer: 'Offery Offer',
  ovnix_offer: 'Ovnix Offer', adtowall_offer: 'AdToWall Offer',
  taskwall_offer: 'TaskWall Offer', torox_offer: 'Torox Offer',
  mychips_offer: 'MyChips Offer', admin_adjustment: 'Admin Adjustment',
};
const TX_COLORS = {
  welcome_bonus: '#f59e0b', daily_checkin: '#0ea5e9', withdrawal: '#ef4444',
  adjoy_offer: '#10b981', adjoe_offer: '#10b981',
  revu_offer: '#0ea5e9', offery_offer: '#10b981',
  ovnix_offer: '#f59e0b', adtowall_offer: '#8b5cf6',
  taskwall_offer: '#ec4899', torox_offer: '#ff6b1a',
  mychips_offer: '#10d98a', admin_adjustment: '#6b7280',
};

function StatCard({ label, value, Icon, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={22} style={{ stroke: color }} />
      </div>
      <p style={{ fontWeight: 800, fontSize: 22 }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{label}</p>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  const [txs, setTxs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.userTransactions(user.id)
      .then((d) => setTxs(d.transactions))
      .catch(() => setTxs([]))
      .finally(() => setLoading(false));
  }, [user.id]);

  const offers = txs ? txs.filter((t) => t.type.endsWith('_offer')) : [];
  const all = txs || [];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="slide-up card"
        style={{ width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', borderRadius: '18px 18px 0 0', padding: '24px 24px 36px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18 }}>{user.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{user.email}</p>
            {user.uid && (
              <p style={{ color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, marginTop: 4, letterSpacing: '0.1em' }}>
                UID: {user.uid}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Balance', value: `${(user.coins || 0).toLocaleString()} SC` },
            { label: 'Country', value: user.country || 'Unknown' },
            { label: 'Streak', value: `${user.checkin_streak || 0}/7` },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontWeight: 800, fontSize: 14 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          Completed Offers ({loading ? '...' : offers.length})
        </p>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>
        ) : offers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0 20px' }}>No offers completed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {offers.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: TX_COLORS[tx.type] || 'var(--text)' }}>{TX_LABELS[tx.type] || tx.type}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                    {tx.description || '—'} · {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>+{tx.amount.toLocaleString()} SC</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Full History ({loading ? '...' : all.length})</p>
        {!loading && all.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No transactions yet.</p>}
        {!loading && all.map((tx) => (
          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{TX_LABELS[tx.type] || tx.type}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>
                {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} SC
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard({ admin, onLogout }) {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [postbackLogs, setPostbackLogs] = useState([]);
  const [postbackSearch, setPostbackSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketDetailData, setTicketDetailData] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketNewStatus, setTicketNewStatus] = useState('replied');
  const [ticketReplyLoading, setTicketReplyLoading] = useState(false);
  const [owConfig, setOwConfig] = useState([]);
  const [owSaving, setOwSaving] = useState(false);
  const [directOffers, setDirectOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', image_url: '', tracking_link: '', points: '' });
  const [offerEditId, setOfferEditId] = useState(null);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerDeleting, setOfferDeleting] = useState(null);

  useEffect(() => { api.admin.stats().then(setStats).catch(() => {}); }, []);
  useEffect(() => {
    if (tab === 'users') api.admin.users().then((d) => setUsers(d.users)).catch(() => {});
    if (tab === 'withdrawals') api.admin.withdrawals().then((d) => setWithdrawals(d.withdrawals)).catch(() => {});
    if (tab === 'postbacks') api.admin.postbackLogs().then((d) => setPostbackLogs(d.logs)).catch(() => {});
    if (tab === 'tickets') api.admin.tickets().then((d) => setTickets(d.tickets)).catch(() => {});
    if (tab === 'offerwalls') api.admin.offerwallConfig().then((d) => setOwConfig(d.config)).catch(() => {});
    if (tab === 'offers') api.admin.directOffers().then((d) => setDirectOffers(d.offers)).catch(() => {});
  }, [tab]);

  const saveOwConfig = async () => {
    setOwSaving(true);
    try {
      await api.admin.saveOfferwallConfig(owConfig);
      toast.success('Offerwall URLs saved.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOwSaving(false);
    }
  };

  const updateOwEntry = (network_id, field, value) => {
    setOwConfig((prev) =>
      prev.map((entry) =>
        entry.network_id === network_id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const resetOfferForm = () => {
    setOfferForm({ title: '', description: '', image_url: '', tracking_link: '', points: '' });
    setOfferEditId(null);
  };

  const loadDirectOffers = () =>
    api.admin.directOffers().then((d) => setDirectOffers(d.offers)).catch(() => {});

  const submitOffer = async (e) => {
    e.preventDefault();
    setOfferSaving(true);
    try {
      const body = { ...offerForm, points: parseInt(offerForm.points) || 0 };
      if (offerEditId) {
        await api.admin.updateDirectOffer(offerEditId, body);
        toast.success('Offer updated.');
      } else {
        await api.admin.createDirectOffer(body);
        toast.success('Offer created.');
      }
      resetOfferForm();
      await loadDirectOffers();
    } catch (err) { toast.error(err.message); }
    finally { setOfferSaving(false); }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer? This cannot be undone.')) return;
    setOfferDeleting(id);
    try {
      await api.admin.deleteDirectOffer(id);
      setDirectOffers((prev) => prev.filter((o) => o.id !== id));
      if (offerEditId === id) resetOfferForm();
      toast.success('Offer deleted.');
    } catch (err) { toast.error(err.message); }
    finally { setOfferDeleting(null); }
  };

  const editOffer = (offer) => {
    setOfferEditId(offer.id);
    setOfferForm({
      title: offer.title,
      description: offer.description,
      image_url: offer.image_url || '',
      tracking_link: offer.tracking_link,
      points: String(offer.points),
      active: offer.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTicketDetail = async (t) => {
    setTicketDetail(t);
    setTicketDetailData(null);
    setTicketReply('');
    setTicketNewStatus('replied');
    try {
      const d = await api.admin.ticketDetail(t.id);
      setTicketDetailData(d);
    } catch { setTicketDetailData({ ticket: t, replies: [] }); }
  };

  const submitTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim()) return;
    setTicketReplyLoading(true);
    try {
      await api.admin.ticketReply(ticketDetail.id, ticketReply, ticketNewStatus);
      toast.success('Reply sent.');
      const d = await api.admin.ticketDetail(ticketDetail.id);
      setTicketDetailData(d);
      setTickets((prev) => prev.map((t) => t.id === ticketDetail.id ? { ...t, status: ticketNewStatus, reply_count: String(parseInt(t.reply_count || 0) + 1) } : t));
      setTicketDetail((prev) => ({ ...prev, status: ticketNewStatus }));
      setTicketReply('');
    } catch (err) { toast.error(err.message); }
    finally { setTicketReplyLoading(false); }
  };

  const changeTicketStatus = async (id, status) => {
    try {
      await api.admin.ticketStatus(id, status);
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      if (ticketDetail?.id === id) setTicketDetail((prev) => ({ ...prev, status }));
      if (ticketDetailData?.ticket?.id === id) setTicketDetailData((prev) => ({ ...prev, ticket: { ...prev.ticket, status } }));
      toast.success('Status updated.');
    } catch (err) { toast.error(err.message); }
  };

  const logout = async () => { try { await api.admin.logout(); } catch (_) {} onLogout(); };

  const updateWithdrawal = async (id, status) => {
    try {
      await api.admin.updateWithdrawal(id, status);
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status } : w));
      toast.success('Withdrawal updated.');
    } catch (err) { toast.error(err.message); }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.admin.adjustCoins(adjustModal.id, parseInt(adjustForm.amount), adjustForm.reason);
      toast.success('Coins adjusted.');
      setAdjustModal(null);
      setAdjustForm({ amount: '', reason: '' });
      api.admin.users().then((d) => setUsers(d.users)).catch(() => {});
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const toggleBan = async (u) => {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    try {
      await api.admin.setUserStatus(u.id, newStatus);
      setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, status: newStatus } : usr));
      toast.success(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'}.`);
    } catch (err) { toast.error(err.message); }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.uid || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldIcon size={18} style={{ stroke: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Spetro Earn Admin</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>@{admin.username}</p>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={logout}>Sign Out</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto' }}>
        {['overview', 'users', 'withdrawals', 'tickets', 'postbacks', 'offerwalls', 'offers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '14px 24px', background: 'none', border: 'none',
              color: tab === t ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--primary-light)' : '2px solid transparent',
              textTransform: 'capitalize', whiteSpace: 'nowrap', fontFamily: 'inherit'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Platform Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <StatCard label="Total Users" value={stats.totalUsers} Icon={UsersIcon} color="var(--primary)" />
              <StatCard label="Coins in Circulation" value={stats.totalCoinsInCirculation} Icon={CoinIcon} color="var(--coin)" />
              <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} Icon={ClockIcon} color="var(--warning)" />
              <StatCard label="Total Transactions" value={stats.totalTransactions} Icon={BarChartIcon} color="var(--success)" />
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20 }}>Users ({filteredUsers.length})</h2>
              <input
                type="text"
                placeholder="Search by name, email or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', color: 'var(--text)', fontSize: 13, width: 240, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredUsers.map((u) => (
                <div key={u.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</p>
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>#{u.id}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: u.status === 'banned' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: u.status === 'banned' ? 'var(--error)' : 'var(--success)' }}>
                          {u.status === 'banned' ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 2 }}>{u.email}</p>
                      {u.uid && (
                        <p style={{ color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>
                          UID: {u.uid}
                        </p>
                      )}
                      <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                        {u.country || 'Unknown'} · Joined {new Date(u.created_at).toLocaleDateString()} · Streak {u.checkin_streak || 0}/7
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <p style={{ fontWeight: 800, color: 'var(--coin)', fontSize: 15 }}>{(u.coins || 0).toLocaleString()} SC</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => setDetailUser(u)}>View Offers</button>
                        <button className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => { setAdjustModal(u); setAdjustForm({ amount: '', reason: '' }); }}>Adjust</button>
                        <button
                          className="btn"
                          style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, background: u.status === 'banned' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: u.status === 'banned' ? 'var(--success)' : 'var(--error)' }}
                          onClick={() => toggleBan(u)}
                        >
                          {u.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <div className="empty-state"><UsersIcon size={40} style={{ stroke: 'var(--text-dim)' }} /><p style={{ marginTop: 12 }}>No users found.</p></div>}
            </div>
          </div>
        )}

        {/* Postback Logs */}
        {tab === 'postbacks' && (() => {
          const filtered = postbackLogs.filter((l) => {
            if (!postbackSearch) return true;
            const q = postbackSearch.toLowerCase();
            return (l.name || '').toLowerCase().includes(q)
              || (l.email || '').toLowerCase().includes(q)
              || (l.uid || '').toLowerCase().includes(q)
              || (l.description || '').toLowerCase().includes(q);
          });
          const totalCoins = filtered.reduce((s, l) => s + (l.amount || 0), 0);
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 20 }}>Postback Logs</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
                    {filtered.length} event{filtered.length !== 1 ? 's' : ''} · {totalCoins.toLocaleString()} SC credited
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by name, email, UID or offer..."
                    value={postbackSearch}
                    onChange={(e) => setPostbackSearch(e.target.value)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', color: 'var(--text)', fontSize: 13, width: 260, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: 13 }}
                    onClick={() => api.admin.postbackLogs().then((d) => setPostbackLogs(d.logs)).catch(() => {})}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <ZapIcon size={40} style={{ stroke: 'var(--text-dim)' }} />
                  <p style={{ marginTop: 12 }}>No postback events yet.</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Events appear here when an offerwall sends a valid callback.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map((log) => (
                    <div key={log.id} className="card" style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{log.name}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>#{log.user_id}</span>
                            {log.uid && (
                              <span style={{ color: 'var(--primary)', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }}>
                                {log.uid}
                              </span>
                            )}
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 3 }}>{log.email}</p>
                          <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                            {log.description || 'Offer completed'}
                          </p>
                          <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 3 }}>
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 900, color: 'var(--success)', fontSize: 16 }}>
                            +{log.amount.toLocaleString()} SC
                          </p>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', color: 'var(--success)', marginTop: 4, display: 'inline-block' }}>
                            CREDITED
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tickets */}
        {tab === 'tickets' && (() => {
          const STATUS_CFG = {
            open:    { label: 'Open',    bg: 'rgba(14,165,233,0.12)',  color: '#0ea5e9' },
            replied: { label: 'Replied', bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
            closed:  { label: 'Closed',  bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
          };
          const Badge = ({ status }) => {
            const c = STATUS_CFG[status] || STATUS_CFG.open;
            return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: c.bg, color: c.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{c.label}</span>;
          };
          const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: 20 }}>Support Tickets ({tickets.length})</h2>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => api.admin.tickets().then((d) => setTickets(d.tickets)).catch(() => {})}>Refresh</button>
              </div>

              {tickets.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 0' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No tickets yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tickets.map((t) => (
                    <div key={t.id} className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{t.subject}</p>
                            <Badge status={t.status} />
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 2 }}>{t.name} · {t.email}</p>
                          {t.uid && <p style={{ color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, marginBottom: 2 }}>{t.uid}</p>}
                          <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{fmtDate(t.created_at)} · {t.reply_count} {parseInt(t.reply_count) === 1 ? 'reply' : 'replies'}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => openTicketDetail(t)}>View & Reply</button>
                          <select
                            value={t.status}
                            onChange={(e) => changeTicketStatus(t.id, e.target.value)}
                            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
                          >
                            <option value="open">Open</option>
                            <option value="replied">Replied</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ticket detail / reply modal */}
              {ticketDetail && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={() => setTicketDetail(null)}>
                  <div className="slide-up card" style={{ width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', borderRadius: '18px 18px 0 0', padding: '24px 24px 36px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{ticketDetail.subject}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ticketDetail.name} · {ticketDetail.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <Badge status={ticketDetail.status} />
                        <button onClick={() => setTicketDetail(null)} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                      </div>
                    </div>

                    {!ticketDetailData ? (
                      <div style={{ textAlign: 'center', padding: 30 }}><span className="spinner" /></div>
                    ) : (
                      <>
                        <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)', marginBottom: 16 }}>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Original message · {fmtDate(ticketDetailData.ticket.created_at)}</p>
                          <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ticketDetailData.ticket.message}</p>
                        </div>

                        {ticketDetailData.replies.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {ticketDetailData.replies.map((r) => (
                              <div key={r.id} style={{ padding: '12px 16px', borderRadius: 10, background: r.author_type === 'admin' ? 'rgba(14,165,233,0.07)' : 'var(--bg-card2)', border: `1px solid ${r.author_type === 'admin' ? 'rgba(14,165,233,0.2)' : 'var(--border)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: r.author_type === 'admin' ? 'var(--primary)' : 'var(--text)' }}>{r.author_type === 'admin' ? 'Support Team (You)' : ticketDetail.name}</span>
                                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDate(r.created_at)}</span>
                                </div>
                                <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <form onSubmit={submitTicketReply}>
                          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Send Reply</p>
                          <textarea
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            placeholder="Type your reply..."
                            rows={4}
                            required
                            style={{ width: '100%', background: 'var(--bg-card2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, marginBottom: 12 }}
                          />
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              value={ticketNewStatus}
                              onChange={(e) => setTicketNewStatus(e.target.value)}
                              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
                            >
                              <option value="replied">Mark as Replied</option>
                              <option value="open">Keep Open</option>
                              <option value="closed">Mark as Closed</option>
                            </select>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: 120 }} disabled={ticketReplyLoading}>
                              {ticketReplyLoading ? <span className="spinner" /> : 'Send Reply'}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Offerwall Config */}
        {tab === 'offerwalls' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 20 }}>Offerwall URLs</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Set each network's embed URL. Use <code style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', borderRadius: 4, padding: '1px 6px', fontSize: 12 }}>{'{USER_ID}'}</code> as a placeholder — it's replaced with the user's ID automatically.
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: 14 }}
                onClick={saveOwConfig}
                disabled={owSaving}
              >
                {owSaving ? <span className="spinner" /> : 'Save All Changes'}
              </button>
            </div>

            {owConfig.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <span className="spinner" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {owConfig.map((entry) => (
                  <div key={entry.network_id} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{entry.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 5, background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                          {entry.network_id}
                        </span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <div
                          onClick={() => updateOwEntry(entry.network_id, 'enabled', !entry.enabled)}
                          style={{
                            width: 38, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
                            background: entry.enabled ? 'var(--success)' : 'rgba(255,255,255,0.12)',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 3, left: entry.enabled ? 19 : 3,
                            width: 16, height: 16, borderRadius: '50%', background: '#fff',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                        <span style={{ fontSize: 13, color: entry.enabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {entry.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="url"
                        value={entry.url}
                        onChange={(e) => updateOwEntry(entry.network_id, 'url', e.target.value)}
                        placeholder={`https://${entry.network_id}.com/wall?pub=YOUR_PUB_ID&uid={USER_ID}`}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'var(--bg-card2)',
                          border: '1.5px solid var(--border)',
                          borderRadius: 10, padding: '10px 14px',
                          color: 'var(--text)', fontSize: 13,
                          fontFamily: 'monospace', outline: 'none',
                          transition: 'border-color 0.15s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    {entry.url && !entry.url.includes('{USER_ID}') && (
                      <p style={{ color: '#f59e0b', fontSize: 12, marginTop: 6 }}>
                        ⚠ URL doesn't contain <code style={{ fontSize: 11 }}>{'{USER_ID}'}</code> — users won't be tracked correctly.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Direct Offers Management */}
        {tab === 'offers' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
                {offerEditId ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Offers appear in the "Featured Premium Offers" section on the user dashboard.
              </p>
            </div>

            <form onSubmit={submitOffer}>
              <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Coin Master"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Description *</label>
                    <textarea
                      placeholder="Describe what the user needs to do to earn the reward..."
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      rows={3}
                      required
                      style={{ width: '100%', background: 'var(--bg-card2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Image URL</label>
                    <input
                      type="url"
                      placeholder="https://i.imgur.com/example.png"
                      value={offerForm.image_url}
                      onChange={(e) => setOfferForm({ ...offerForm, image_url: e.target.value })}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Tracking Link *</label>
                    <input
                      type="url"
                      placeholder="https://your-network.com/offer/ABC"
                      value={offerForm.tracking_link}
                      onChange={(e) => setOfferForm({ ...offerForm, tracking_link: e.target.value })}
                      required
                    />
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5 }}>
                      The user's UID will be appended automatically as <code style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', borderRadius: 4, padding: '1px 6px' }}>&amp;sub2=UID</code>
                    </p>
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Point Reward (SC) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      min="1"
                      value={offerForm.points}
                      onChange={(e) => setOfferForm({ ...offerForm, points: e.target.value })}
                      required
                    />
                  </div>
                  {offerForm.image_url && (
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Image Preview:</p>
                      <img
                        src={offerForm.image_url}
                        alt="preview"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    {offerEditId && (
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={resetOfferForm}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={offerSaving}>
                      {offerSaving ? <span className="spinner" /> : offerEditId ? 'Update Offer' : 'Add Offer'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17 }}>All Offers ({directOffers.length})</h3>
              <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={loadDirectOffers}>Refresh</button>
            </div>

            {directOffers.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 0' }}>
                <ZapIcon size={38} style={{ stroke: 'var(--text-dim)' }} />
                <p style={{ marginTop: 12 }}>No offers yet. Add one above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {directOffers.map((offer) => (
                  <div key={offer.id} className="card" style={{ padding: 0, overflow: 'hidden', border: offerEditId === offer.id ? '1.5px solid var(--primary)' : '1px solid var(--border)' }}>
                    {offer.image_url && (
                      <img src={offer.image_url} alt={offer.title} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>{offer.title}</p>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: offer.active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: offer.active ? 'var(--success)' : 'var(--error)' }}>
                              {offer.active ? 'ACTIVE' : 'HIDDEN'}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{offer.description}</p>
                          <p style={{ color: 'var(--text-dim)', fontSize: 12, wordBreak: 'break-all' }}>{offer.tracking_link}</p>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--coin)', whiteSpace: 'nowrap', flexShrink: 0 }}>+{offer.points} SC</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: 13 }}
                          onClick={() => editOffer(offer)}
                          disabled={offerEditId === offer.id}
                        >
                          {offerEditId === offer.id ? 'Editing...' : 'Edit'}
                        </button>
                        <button
                          className="btn"
                          style={{ flex: 1, fontSize: 13, background: 'rgba(239,68,68,0.15)', color: 'var(--error)', borderRadius: 8 }}
                          onClick={() => deleteOffer(offer.id)}
                          disabled={offerDeleting === offer.id}
                        >
                          {offerDeleting === offer.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Withdrawals ({withdrawals.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {withdrawals.map((w) => (
                <div key={w.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{w.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>· {w.email}</span></p>
                      {w.uid && <p style={{ color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', marginTop: 2 }}>UID: {w.uid}</p>}
                      <p style={{ fontWeight: 600, color: 'var(--coin)', marginTop: 4 }}>{w.amount.toLocaleString()} SC via {w.method.toUpperCase()}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{w.wallet_address}</p>
                      <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span className={`badge badge-${w.status}`}>{w.status}</span>
                      {w.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn" style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(16,185,129,0.2)', color: 'var(--success)', borderRadius: 8 }} onClick={() => updateWithdrawal(w.id, 'approved')}>Approve</button>
                          <button className="btn" style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(239,68,68,0.2)', color: 'var(--error)', borderRadius: 8 }} onClick={() => updateWithdrawal(w.id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {withdrawals.length === 0 && <div className="empty-state"><ClockIcon size={40} style={{ stroke: 'var(--text-dim)' }} /><p style={{ marginTop: 12 }}>No withdrawals yet.</p></div>}
            </div>
          </div>
        )}
      </div>

      {/* Adjust coins modal */}
      {adjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 }}>
          <div className="card scale-in" style={{ width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Adjust Coins</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>User: {adjustModal.name} ({(adjustModal.coins || 0).toLocaleString()} SC current)</p>
            <form onSubmit={submitAdjust}>
              <div className="input-group">
                <label>Amount (use negative to deduct)</label>
                <input type="number" placeholder="e.g. 100 or -50" value={adjustForm.amount} onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Reason</label>
                <input type="text" placeholder="Reason for adjustment" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAdjustModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
    </div>
  );
}
