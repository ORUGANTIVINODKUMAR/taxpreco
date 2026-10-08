function context(clientId, taxYear) {
  if (typeof clientId !== 'string' || !clientId.trim() || clientId !== clientId.trim() || clientId.length > 128 || /[\x00-\x1f\x7f]/.test(clientId)) throw new Error('Client ID is required and must be at most 128 characters without surrounding whitespace.')
  if (typeof taxYear !== 'string' || !/^\d{4}$/.test(taxYear) || Number(taxYear) < 1900 || Number(taxYear) > 2100) throw new Error('Tax year must be a four-digit year from 1900 to 2100.')
  return { clientId, taxYear }
}
function submission(body) {
  const allowed = ['clientId', 'taxYear', 'residentState', 'fundName', 'amount', 'percentage', 'stateExempt', 'stateTaxable']
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) throw new Error('Unexpected fields. User ownership cannot be supplied by the caller.')
  const result = context(body.clientId, body.taxYear)
  for (const [field, limit] of [['residentState', 100], ['fundName', 255]]) {
    if (typeof body[field] !== 'string' || body[field].length > limit || /[\x00-\x1f\x7f]/.test(body[field])) throw new Error(`Invalid ${field}.`)
    result[field] = body[field].trim()
  }
  if (!result.fundName) throw new Error('Fund name is required.')
  for (const field of ['amount', 'stateExempt', 'stateTaxable']) {
    const value = body[field]
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 999999999999.99 || Number(value.toFixed(2)) !== value) throw new Error(`${field} must be a finite monetary value with at most two decimal places.`)
    result[field] = value
  }
  if (typeof body.percentage !== 'number' || !Number.isFinite(body.percentage) || body.percentage < 0 || body.percentage > 100) throw new Error('Percentage must be between 0 and 100.')
  result.percentage = body.percentage
  return result
}
module.exports = { context, submission }
