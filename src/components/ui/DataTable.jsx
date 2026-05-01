import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

export default function DataTable({ columns, rows, searchKeys = [], emptyText = 'Tidak ada data.' }) {
  const [query, setQuery]   = useState('')
  const [sortCol, setSort]  = useState(null)
  const [sortDir, setDir]   = useState('asc')
  const [page, setPage]     = useState(1)
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
    if (sortCol === key) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort(key); setDir('asc') }
    setPage(1)
  }

  return (
    <div>
      {searchKeys.length > 0 && (
        <div style={{ position:'relative', marginBottom:12 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }} />
          <input className="form-input" style={{ paddingLeft:30, maxWidth:220 }} placeholder="Cari..."
            value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />
        </div>
      )}
      <div className="table-scroll-container">
        <table style={{ width:'100%', minWidth:600 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="table-th"
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                    {col.label}
                    {col.sortable && sortCol === col.key && (sortDir === 'asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="table-td" style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0' }}>{emptyText}</td></tr>
            ) : visible.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} className="table-td">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, fontSize:12, color:'var(--text-dim)' }}>
          <span>Menampilkan {Math.min((page-1)*perPage+1, sorted.length)}–{Math.min(page*perPage, sorted.length)} dari {sorted.length}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
