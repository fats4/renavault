import { useFinance } from '../context/FinanceContext'
import { Card, Button, StatCard, Badge } from '../components/ui'
import { formatCurrency, formatDate } from '../lib/format'

const severityVariant = {
  low: 'default' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
  critical: 'danger' as const,
}

const categoryLabel: Record<string, string> = {
  fraud: 'Penipuan',
  leakage: 'Kebocoran',
  commitment: 'Komitmen',
  compliance: 'Compliance',
}

export function RiskPage() {
  const { state, updateRisk, updateApproval } = useFinance()

  const openRisks = state.risks.filter((r) => r.status === 'open')
  const criticalCount = state.risks.filter(
    (r) => r.status === 'open' && (r.severity === 'critical' || r.severity === 'high'),
  ).length
  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending')
  const totalPendingAmount = pendingApprovals.reduce((s, a) => s + a.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Risk & Controls</h2>
        <p className="mt-1 text-sm text-surface-500">
          Cegah kebocoran, penipuan, dan komitmen finansial yang gegabah
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Open Risks" value={String(openRisks.length)} trend={openRisks.length > 3 ? 'down' : 'neutral'} />
        <StatCard label="Critical / High" value={String(criticalCount)} trend="down" />
        <StatCard label="Pending Approvals" value={String(pendingApprovals.length)} />
        <StatCard label="Exposure Pending" value={formatCurrency(totalPendingAmount, true)} trend="down" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk Register */}
        <Card title="Risk Register" subtitle="Identifikasi & mitigasi risiko">
          <div className="space-y-3">
            {state.risks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-surface-700 bg-surface-800 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityVariant[risk.severity]}>{risk.severity}</Badge>
                      <Badge variant="default">{categoryLabel[risk.category]}</Badge>
                      <Badge
                        variant={
                          risk.status === 'open'
                            ? 'warning'
                            : risk.status === 'mitigated'
                              ? 'info'
                              : 'success'
                        }
                      >
                        {risk.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{risk.title}</p>
                    <p className="mt-1 text-xs text-surface-400">{risk.description}</p>
                    <p className="mt-2 text-[10px] text-surface-500">Owner: {risk.owner}</p>
                  </div>
                </div>
                {risk.status === 'open' && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateRisk(risk.id, { status: 'mitigated' })}
                    >
                      Mitigated
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateRisk(risk.id, { status: 'resolved' })}
                    >
                      Resolved
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Approval Workflow */}
        <Card title="Approval Workflow" subtitle="Kontrol pengeluaran — no spend tanpa approval">
          <div className="space-y-3">
            {state.approvals.map((approval) => (
              <div
                key={approval.id}
                className="rounded-lg border border-surface-700 bg-surface-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{approval.title}</p>
                    <p className="mt-1 text-xs text-surface-400">
                      {approval.requester} · {formatDate(approval.date)} · {approval.category}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-accent">
                    {formatCurrency(approval.amount, true)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge
                    variant={
                      approval.status === 'approved'
                        ? 'success'
                        : approval.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {approval.status}
                  </Badge>
                  {approval.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateApproval(approval.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateApproval(approval.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Control Policies */}
      <Card title="Control Policies" subtitle="Kebijakan internal finansial">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Dual Approval > Rp 25jt',
              desc: 'Semua pengeluaran di atas Rp 25 juta butuh 2 approval (Finance + CEO)',
              active: true,
            },
            {
              title: 'PO Required for Vendors',
              desc: 'Tidak ada pembayaran vendor tanpa Purchase Order resmi',
              active: true,
            },
            {
              title: 'Monthly Reconciliation',
              desc: 'Rekonsiliasi bank vs buku setiap akhir bulan',
              active: true,
            },
            {
              title: 'Segregation of Duties',
              desc: 'Pemisahan akses: requester ≠ approver ≠ payer',
              active: false,
            },
            {
              title: 'Expense Limit per Dept',
              desc: 'Marketing max Rp 20jt/bulan tanpa approval tambahan',
              active: true,
            },
            {
              title: 'Production Commitment Gate',
              desc: 'PO produksi > Rp 100jt butuh forecast penjualan terverifikasi',
              active: true,
            },
          ].map((policy) => (
            <div
              key={policy.title}
              className={`rounded-lg border p-4 ${policy.active ? 'border-positive/20 bg-positive/5' : 'border-surface-700 bg-surface-800'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${policy.active ? 'bg-positive' : 'bg-surface-500'}`}
                />
                <p className="text-sm font-medium text-white">{policy.title}</p>
              </div>
              <p className="mt-2 text-xs text-surface-400">{policy.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
