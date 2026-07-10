import type { ReactNode } from 'react'

function FieldTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-box border border-base-content/10 my-4">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="bg-base-200">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="align-top text-base-content/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FieldTable
