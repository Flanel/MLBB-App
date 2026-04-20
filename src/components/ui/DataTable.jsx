import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

export default function DataTable({ columns, rows, searchKeys = [], emptyText = 'No data.' }) {
  const [query, setQuery]     = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage]       = useState(1)
  const perPage = 10

  const filtered = rows.filter(row =>
    !query || searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(query.toLowerCase()))
  )

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const cmp = String(a[sortCol]).localeCompare(String(b[sortCol]), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const visible    = sorted.slice((page - 1) * perPage, page * perPage)

  function toggleSort(key) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('asc') }
    setPage(1)
  }

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-8 max-w-[220px]"
            placeholder="Search..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`table-th ${col.sortable ? 'cursor-pointer select-none hover:text-slate-600' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortCol === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="table-td text-center text-slate-400 py-8">{emptyText}</td></tr>
            ) : (
              visible.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="table-td">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
          <span>Showing {Math.min((page - 1) * perPage + 1, sorted.length)}–{Math.min(page * perPage, sorted.length)} of {sorted.length}</span>
          <div className="flex gap-1">
            <button className="btn py-1 px-2 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn py-1 px-2 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
