import type { Transaction } from '../types'

/** Transaksi lunas — import batch Agustus 2026 */
export const LUNAS_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  {
    date: '2026-08-06',
    description: 'PRINT ULARTANGGA',
    category: 'Belanja Bahan',
    amount: 405_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-27',
    description: 'BELI DADU',
    category: 'Belanja Bahan',
    amount: 59_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-23',
    description: 'BELI TALI HANGTAG',
    category: 'Belanja Bahan',
    amount: 97_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-20',
    description: 'ORDER PLASTIK (ZIPLOCK & POLYMAILER)',
    category: 'Belanja Bahan',
    amount: 529_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-08-03',
    description: 'BELI ALAT LIPAT BAJU & PEMBERSIH SERAT',
    category: 'Operasional',
    amount: 246_720,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-15',
    description: 'SUBS SUPABASE 1 MONTH',
    category: 'Operasional',
    amount: 452_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-09',
    description: 'SUBS CLAUDE PRO 1 MONTH (RENA)',
    category: 'Operasional',
    amount: 362_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-07',
    description: 'BELI DOMAIN',
    category: 'Operasional',
    amount: 582_000,
    type: 'expense',
    status: 'completed',
  },
  {
    date: '2026-07-04',
    description: 'SUBS CLAUDE PRO 1 MONTH (GAGE)',
    category: 'Operasional',
    amount: 349_000,
    type: 'expense',
    status: 'completed',
  },
]

export function isDuplicateTransaction(
  existing: { description: string; date: string; amount: number },
  incoming: { description: string; date: string; amount: number },
): boolean {
  return (
    existing.description === incoming.description &&
    existing.date === incoming.date &&
    existing.amount === incoming.amount
  )
}
