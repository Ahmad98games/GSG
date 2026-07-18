'use client'
import { useState } from 'react'

interface Props {
  data: {
    session: any
    party: any
    invoices: any[]
    dispatch: any[]
    payments: any[]
    promises: any[]
  }
}

export function PortalView({ data }: Props) {
  const {
    session, party, invoices,
    dispatch, payments, promises
  } = data

  const [activeTab, setActiveTab] = useState<
    'overview' | 'invoices' | 'deliveries' | 'payments'
  >('overview')

  const currency = 'PKR'
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString('en-PK')}`

  const outstandingBalance =
    party?.current_balance || 0
  const overdueInvoices = invoices.filter(
    inv => inv.balance_due > 0 &&
      inv.due_date &&
      new Date(inv.due_date) < new Date()
  )

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'deliveries', label: 'Deliveries' },
    { key: 'payments', label: 'Payments' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060708',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#FFFFFF',
    }}>
      {/* Header */}
      <div style={{
        background: '#0A0C0F',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 16px 12px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <p style={{
          fontSize: 9,
          fontWeight: 700,
          color: '#60A5FA',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {session.business_name}
        </p>
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 2,
        }}>
          {session.party_name}
        </h1>
        <p style={{
          fontSize: 11,
          color: '#4B5563',
        }}>
          Account Portal · Read Only
        </p>
      </div>

      {/* Balance banner */}
      {outstandingBalance > 0 && (
        <div style={{
          background: overdueInvoices.length > 0
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(96,165,250,0.08)',
          borderBottom: '1px solid ' +
            (overdueInvoices.length > 0
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(96,165,250,0.2)'),
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontSize: 11,
              color: overdueInvoices.length > 0
                ? '#FCA5A5' : '#93C5FD',
              fontWeight: 600,
              marginBottom: 2,
            }}>
              {overdueInvoices.length > 0
                ? '⚠ Payment Overdue'
                : 'Outstanding Balance'}
            </p>
            <p style={{
              fontSize: 10,
              color: '#6B7280',
            }}>
              {overdueInvoices.length} invoice
              {overdueInvoices.length !== 1
                ? 's' : ''} pending
            </p>
          </div>
          <p style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: overdueInvoices.length > 0
              ? '#EF4444' : '#60A5FA',
          }}>
            {fmt(outstandingBalance)}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0A0C0F',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as any)
            }
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key
                ? '2px solid #60A5FA'
                : '2px solid transparent',
              color: activeTab === tab.key
                ? '#60A5FA' : '#6B7280',
              fontSize: 12,
              fontWeight: activeTab === tab.key
                ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        padding: 16,
        maxWidth: 640,
        margin: '0 auto',
      }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              {[
                {
                  label: 'Total Invoiced',
                  value: fmt(invoices.reduce(
                    (s, i) => s + (i.total_amount || 0), 0
                  )),
                  color: '#FFFFFF',
                },
                {
                  label: 'Amount Paid',
                  value: fmt(payments.reduce(
                    (s, p) => s + (p.amount || 0), 0
                  )),
                  color: '#10B981',
                },
                {
                  label: 'Outstanding',
                  value: fmt(outstandingBalance),
                  color: outstandingBalance > 0
                    ? '#EF4444' : '#10B981',
                },
                {
                  label: 'Total Orders',
                  value: String(invoices.length),
                  color: '#60A5FA',
                },
              ].map(card => (
                <div key={card.label} style={{
                  background: '#0F1114',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: 16,
                }}>
                  <p style={{
                    fontSize: 9,
                    color: '#6B7280',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    marginBottom: 8,
                  }}>
                    {card.label}
                  </p>
                  <p style={{
                    fontSize: 18,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: card.color,
                  }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent invoices */}
            <div>
              <p style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 10,
              }}>
                Recent Invoices
              </p>
              <div style={{
                background: '#0F1114',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                {invoices.slice(0, 5).map(
                  (inv, i) => (
                  <div key={inv.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < 4
                      ? '1px solid rgba(255,255,255,0.04)'
                      : 'none',
                  }}>
                    <div>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                      }}>
                        {inv.invoice_number}
                      </p>
                      <p style={{
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 2,
                      }}>
                        {new Date(inv.created_at)
                          .toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: '#FFFFFF',
                      }}>
                        {fmt(inv.total_amount)}
                      </p>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: inv.balance_due > 0
                          ? '#EF4444' : '#10B981',
                        background: inv.balance_due > 0
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(16,185,129,0.1)',
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}>
                        {inv.balance_due > 0
                          ? 'Unpaid' : 'Paid'}
                      </span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <p style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#374151',
                    fontSize: 13,
                  }}>
                    No invoices yet
                  </p>
                )}
              </div>
            </div>

            {/* Payment promises */}
            {promises.length > 0 && (
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 2, marginBottom: 10,
                }}>
                  Upcoming Payments
                </p>
                {promises.map((p: any) => (
                  <div key={p.promise_date} style={{
                    background: 'rgba(197,160,89,0.08)',
                    border: '1px solid rgba(197,160,89,0.2)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <p style={{
                      fontSize: 12,
                      color: '#C5A059',
                    }}>
                      Due:{' '}
                      {new Date(p.promise_date)
                        .toLocaleDateString('en-PK')}
                    </p>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: '#C5A059',
                    }}>
                      {fmt(p.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {invoices.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: '#374151',
                padding: 40,
              }}>
                No invoices yet
              </p>
            ) : invoices.map(inv => (
              <div key={inv.id} style={{
                background: '#0F1114',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 16,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#FFFFFF',
                  }}>
                    {inv.invoice_number}
                  </p>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: inv.balance_due > 0
                      ? '#EF4444' : '#10B981',
                    background: inv.balance_due > 0
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(16,185,129,0.1)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    alignSelf: 'center',
                  }}>
                    {inv.balance_due > 0
                      ? 'Outstanding' : 'Paid'}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  {[
                    ['Invoice Date',
                      new Date(inv.created_at)
                        .toLocaleDateString('en-PK')],
                    ['Due Date',
                      inv.due_date
                        ? new Date(inv.due_date)
                          .toLocaleDateString('en-PK')
                        : '—'],
                    ['Total Amount',
                      fmt(inv.total_amount)],
                    ['Balance Due',
                      fmt(inv.balance_due || 0)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p style={{
                        fontSize: 9,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 3,
                      }}>
                        {label}
                      </p>
                      <p style={{
                        fontSize: 13,
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                      }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {dispatch.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: '#374151',
                padding: 40,
              }}>
                No deliveries yet
              </p>
            ) : dispatch.map((d: any) => {
              const statusColor: Record<string, string> = {
                pending: '#F59E0B',
                packed: '#60A5FA',
                dispatched: '#8B5CF6',
                delivered: '#10B981',
                cancelled: '#EF4444',
              }
              return (
                <div key={d.id} style={{
                  background: '#0F1114',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: 16,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <p style={{
                      fontSize: 13,
                      color: '#FFFFFF',
                      fontWeight: 600,
                    }}>
                      Shipment
                    </p>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: statusColor[d.status]
                        || '#6B7280',
                      background: (statusColor[d.status]
                        || '#6B7280') + '20',
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}>
                      {d.status}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}>
                    {[
                      ['Order Date',
                        new Date(d.created_at)
                          .toLocaleDateString('en-PK')],
                      ['Est. Delivery',
                        d.estimated_delivery
                          ? new Date(d.estimated_delivery)
                            .toLocaleDateString('en-PK')
                          : 'TBD'],
                      ['Actual Delivery',
                        d.actual_delivery
                          ? new Date(d.actual_delivery)
                            .toLocaleDateString('en-PK')
                          : '—'],
                      ['Value',
                        d.total_amount
                          ? fmt(d.total_amount) : '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{
                          fontSize: 9,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          marginBottom: 3,
                        }}>
                          {label}
                        </p>
                        <p style={{
                          fontSize: 12,
                          color: '#FFFFFF',
                        }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {d.notes && (
                    <p style={{
                      fontSize: 11,
                      color: '#4B5563',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {d.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {payments.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: '#374151',
                padding: 40,
              }}>
                No payments recorded yet
              </p>
            ) : payments.map((p: any, i: number) => (
              <div key={i} style={{
                background: '#0F1114',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <p style={{
                    fontSize: 13,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    marginBottom: 3,
                  }}>
                    {new Date(p.payment_date)
                      .toLocaleDateString('en-PK')}
                  </p>
                  <p style={{
                    fontSize: 11,
                    color: '#6B7280',
                  }}>
                    {p.payment_method || 'Cash'}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
                <p style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#10B981',
                }}>
                  {fmt(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 10,
            color: '#1F2937',
          }}>
            Powered by Noxis Hub ·{' '}
            noxishub.app
          </p>
          <p style={{
            fontSize: 10,
            color: '#1F2937',
            marginTop: 4,
          }}>
            This portal is read-only.
            Contact {session.business_name}{' '}
            for any queries.
          </p>
        </div>
      </div>
    </div>
  )
}
