'use client'

import React from 'react'
import { Modal } from '@/components/ui'

interface CompareRunsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompareRunsModal({ isOpen, onClose }: CompareRunsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Run Comparison Matrix"
      description="Side-by-side performance diff across automated test iterations."
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3">Metric</th>
                <th className="p-3 font-mono">smoke-test-v4</th>
                <th className="p-3 font-mono">regression-suite</th>
                <th className="p-3 font-mono">checkout-contracts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Pass Rate</td>
                <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">98.6%</td>
                <td className="p-3 text-amber-700 dark:text-amber-400 font-semibold">96.1%</td>
                <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">99.2%</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Duration</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">04:32</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">12:08</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">03:48</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Open Findings</td>
                <td className="p-3 font-mono text-amber-700 dark:text-amber-400">2 warnings</td>
                <td className="p-3 font-mono text-amber-700 dark:text-amber-400">7 warnings</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">1 warning</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Avg Latency</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">178 ms</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">312 ms</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">142 ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-300/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-sky-800 dark:bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-900 dark:hover:bg-sky-500 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
