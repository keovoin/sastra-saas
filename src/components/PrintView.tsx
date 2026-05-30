import React from 'react'
import { useBusinessOS } from '@/context/BusinessContext'

interface PrintViewProps {
  mode: 'risks' | 'charters'
  onClose: () => void
}

export function PrintView({ mode, onClose }: PrintViewProps) {
  const { risks, charters } = useBusinessOS()
  const handlePrint = () => { window.print() }
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white print:hidden overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Print Preview</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={handlePrint} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Print / Save PDF</button>
          </div>
        </div>
        <div className="print-content mx-auto max-w-4xl px-8 py-12">
          <div className="mb-8 border-b-2 border-black pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Confidential Project Report</p>
            <h1 className="text-2xl font-bold text-black">{mode === 'risks' ? 'Risk Register' : 'Project Charters'}</h1>
            <p className="mt-1 text-sm text-slate-600">Generated: {today} | BusinessOS Platform</p>
          </div>
          {mode === 'risks' && (
            <div>
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div className="border border-slate-300 p-3"><p className="text-2xl font-bold">{risks.length}</p><p className="text-xs text-slate-600">Total Risks</p></div>
                <div className="border border-slate-300 p-3"><p className="text-2xl font-bold">{risks.filter(r => r.status === 'Active').length}</p><p className="text-xs text-slate-600">Active</p></div>
                <div className="border border-slate-300 p-3"><p className="text-2xl font-bold">{risks.filter(r => r.severity > 15).length}</p><p className="text-xs text-slate-600">High Severity</p></div>
              </div>
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead><tr className="bg-slate-100"><th className="border border-slate-300 px-2 py-2 text-left">Description</th><th className="border border-slate-300 px-2 py-2 text-center">Prob</th><th className="border border-slate-300 px-2 py-2 text-center">Impact</th><th className="border border-slate-300 px-2 py-2 text-center">Severity</th><th className="border border-slate-300 px-2 py-2 text-left">Owner</th><th className="border border-slate-300 px-2 py-2 text-left">Status</th></tr></thead>
                <tbody>{[...risks].sort((a, b) => b.severity - a.severity).map((risk) => (
                  <tr key={risk.id} className={risk.severity > 15 ? 'bg-slate-50' : ''}><td className="border border-slate-300 px-2 py-1.5">{risk.description}</td><td className="border border-slate-300 px-2 py-1.5 text-center">{risk.probability}</td><td className="border border-slate-300 px-2 py-1.5 text-center">{risk.impact}</td><td className="border border-slate-300 px-2 py-1.5 text-center font-bold">{risk.severity}</td><td className="border border-slate-300 px-2 py-1.5">{risk.owner_name}</td><td className="border border-slate-300 px-2 py-1.5">{risk.status}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {mode === 'charters' && (
            <div className="space-y-8">{charters.map((charter) => (
              <div key={charter.id} className="border border-slate-300 p-6">
                <div className="flex items-center justify-between mb-2"><span className="font-mono text-xs text-slate-500">{charter.id.slice(0, 8)}</span><span className="text-xs text-slate-500">Start: {charter.start_date || 'TBD'}</span></div>
                <h2 className="text-lg font-bold text-black">{charter.name}</h2>
                <p className="text-sm text-slate-600 mb-4">Sponsor: {charter.sponsor}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="font-semibold text-xs uppercase tracking-wider mb-1">In Scope</p><ul className="list-disc pl-4 space-y-0.5">{charter.in_scope.map((i) => (<li key={i}>{i}</li>))}</ul></div>
                  <div><p className="font-semibold text-xs uppercase tracking-wider mb-1">Out of Scope</p><ul className="list-disc pl-4 space-y-0.5">{charter.out_of_scope.map((i) => (<li key={i}>{i}</li>))}</ul></div>
                </div>
                <div className="mt-4"><p className="font-semibold text-xs uppercase tracking-wider mb-1">Team</p><p className="text-sm">{charter.team_members.join(', ')}</p></div>
              </div>
            ))}</div>
          )}
          <div className="mt-12 border-t-2 border-black pt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">Generated by BusinessOS</p>
            <p className="text-xs text-slate-500">Page 1 of 1</p>
          </div>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .print-content, .print-content * { visibility: visible; } .print-content { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </>
  )
}
