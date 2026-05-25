import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { SupportIcon, ArrowLeftIcon } from '../components/Icons';

const STATUS_CONFIG = {
  open:    { label: 'Open',    bg: 'rgba(14,165,233,0.12)',  color: '#0ea5e9' },
  replied: { label: 'Replied', bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  closed:  { label: 'Closed',  bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: cfg.bg, color: cfg.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {cfg.label}
    </span>
  );
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TicketDetail({ ticketId, onBack }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tickets.get(ticketId)
      .then(setData)
      .catch(() => toast.error('Failed to load ticket.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
  if (!data) return null;

  const { ticket, replies } = data;

  return (
    <div style={{ paddingBottom: 20 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '4px 0 18px', fontFamily: 'inherit' }}>
        <ArrowLeftIcon size={16} /> Back
      </button>
      <div className="card" style={{ padding: '18px 18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <p style={{ fontWeight: 800, fontSize: 15, flex: 1 }}>{ticket.subject}</p>
          <StatusBadge status={ticket.status} />
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 10 }}>{fmt(ticket.created_at)}</p>
        <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ticket.message}</p>
        </div>
      </div>

      {replies.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {replies.map((r) => (
            <div key={r.id} style={{ padding: '12px 14px', borderRadius: 12, background: r.author_type === 'admin' ? 'rgba(14,165,233,0.07)' : 'var(--bg-card)', border: `1px solid ${r.author_type === 'admin' ? 'rgba(14,165,233,0.2)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: r.author_type === 'admin' ? 'var(--primary)' : 'var(--text)' }}>
                  {r.author_type === 'admin' ? 'Support Team' : 'You'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmt(r.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '24px 0' }}>
          No replies yet. Our team will respond soon.
        </p>
      )}
    </div>
  );
}

// embedded = true when rendered inside Profile (no outer padding / full-page layout)
export default function Support({ user, guest, onGoLogin, onGoRegister, embedded = false }) {
  const toast = useToast();
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (guest) return;
    api.tickets.my()
      .then((d) => setTickets(d.tickets))
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  }, [guest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const d = await api.tickets.create(form);
      setTickets((prev) => [d.ticket, ...prev]);
      setForm({ subject: '', message: '' });
      setView('list');
      toast.success("Ticket submitted! We'll get back to you soon.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (guest) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Sign in to open and view support tickets.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '9px 20px', fontSize: 13 }} onClick={onGoLogin}>Sign In</button>
          <button className="btn btn-outline" style={{ padding: '9px 20px', fontSize: 13 }} onClick={onGoRegister}>Register</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {view === 'detail' && selectedId && (
        <TicketDetail ticketId={selectedId} onBack={() => { setSelectedId(null); setView('list'); }} />
      )}

      {view === 'new' && (
        <div>
          <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '4px 0 18px', fontFamily: 'inherit' }}>
            <ArrowLeftIcon size={16} /> Back
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Describe your issue and our team will reply soon.</p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Subject</label>
              <input type="text" placeholder="Brief summary of your issue" value={form.subject} maxLength={120} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Message</label>
              <textarea
                placeholder="Describe your issue in detail..."
                value={form.message} maxLength={2000} rows={5}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                style={{ width: '100%', background: 'var(--bg-card2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4, textAlign: 'right' }}>{form.message.length}/2000</p>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {view === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>My Tickets</p>
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setView('new')}>
              + New Ticket
            </button>
          </div>

          {loadingTickets ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <span className="spinner" style={{ width: 26, height: 26 }} />
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <SupportIcon size={22} style={{ stroke: 'var(--text-dim)' }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>No tickets yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Having an issue? Open a ticket and we'll help.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tickets.map((t) => (
                <button key={t.id} onClick={() => { setSelectedId(t.id); setView('detail'); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{fmt(t.created_at)}</p>
                    {parseInt(t.reply_count) > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t.reply_count} {parseInt(t.reply_count) === 1 ? 'reply' : 'replies'}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
