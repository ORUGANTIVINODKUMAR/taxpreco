import type { FinancialRow } from '../types/workspace'
function parseAmount(value: string): number | undefined {
  const cleaned = value
    .trim()
    .replace(/[$,\s]/g, '')
    .replace(/^\((.*)\)$/, '-$1')
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return undefined
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : undefined
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [],
    cell = '',
    quoted = false
  const clean = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < clean.length; index++) {
    const character = clean[index]
    if (character === '"') {
      if (quoted && clean[index + 1] === '"') {
        cell += '"'
        index++
      } else quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && clean[index + 1] === '\n') index++
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
    } else cell += character
  }
  if (quoted)
    throw new Error(
      'The CSV has an unclosed quoted field. Correct the file and try again.',
    )
  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}
function amountsFromCells(cells: string[], prefix = ''): FinancialRow[] {
  const label = cells.find(
    (value) => value.trim() && parseAmount(value) === undefined,
  )
  if (!label) return []
  return cells.flatMap((value, index) => {
    const amount = parseAmount(value)
    return amount === undefined
      ? []
      : [
          {
            label: `${prefix}${label}${cells.filter((cell) => parseAmount(cell) !== undefined).length > 1 ? ` · column ${index + 1}` : ''}`,
            amount,
          },
        ]
  })
}
export async function readFinancialFile(file: File): Promise<FinancialRow[]> {
  if (file.size > 15 * 1024 * 1024)
    throw new Error('Choose a file smaller than 15 MB.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  let rows: FinancialRow[] = []
  if (extension === 'csv')
    rows = parseCsv(await file.text()).flatMap((cells) =>
      amountsFromCells(cells),
    )
  else if (extension === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    for (const sheet of workbook.worksheets) {
      sheet.eachRow((row) => {
        const cells: string[] = []
        row.eachCell({ includeEmpty: true }, (cell) => cells.push(cell.text))
        rows.push(...amountsFromCells(cells, `${sheet.name} · `))
      })
    }
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    const { default: workerUrl } =
      await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    })
    try {
      const document = await loadingTask.promise
      if (document.numPages > 100)
        throw new Error(
          'Choose a financial statement with no more than 100 pages.',
        )
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        const lines = new Map<number, { x: number; text: string }[]>()
        for (const item of content.items) {
          if (!('str' in item)) continue
          const y = Math.round(item.transform[5] / 3) * 3
          lines.set(y, [
            ...(lines.get(y) ?? []),
            { x: item.transform[4], text: item.str },
          ])
        }
        for (const [, pieces] of [...lines].sort((a, b) => b[0] - a[0])) {
          const line = pieces
            .sort((a, b) => a.x - b.x)
            .map((piece) => piece.text)
            .join(' ')
            .trim()
          const matches = [
            ...line.matchAll(/\(?-?\$?\d[\d,]*(?:\.\d{1,2})?\)?/g),
          ]
          const label = line
            .replace(/\(?-?\$?\d[\d,]*(?:\.\d{1,2})?\)?/g, '')
            .trim()
          if (!label || !matches.length) continue
          matches.forEach((match, index) => {
            const amount = parseAmount(match[0])
            if (amount !== undefined)
              rows.push({
                label: `Page ${pageNumber} · ${label}${matches.length > 1 ? ` · amount ${index + 1}` : ''}`,
                amount,
              })
          })
        }
      }
    } finally {
      await loadingTask.destroy()
    }
  } else
    throw new Error(
      'Use a CSV, Excel .xlsx workbook, or text-based PDF. Scanned PDFs require OCR before import.',
    )
  if (!rows.length)
    throw new Error(
      'No labeled amounts were found. For scanned PDFs, use OCR or enter the figures manually. A CSV can use columns named Description and Amount.',
    )
  if (rows.length > 1000)
    throw new Error(
      'More than 1,000 amounts were found. Use a smaller statement or a summarized P&L sheet.',
    )
  return rows
}
