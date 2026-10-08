const express = require('express')
const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth')
const { attachContext } = require('../middleware/context')
const { context: validateContext, submission } = require('../mutualFundValidation')
const fields = 'id, client_id, tax_year, resident_state, fund_name, amount, percentage, state_exempt, state_taxable, created_at'

function createMutualFundRouter(auth = requireAuth, context = attachContext, database = pool) {
const router = express.Router()

router.use(auth)
router.use(context)

router.get('/sessions', async (req, res) => {
  let input
  try { input = validateContext(req.query.clientId, req.query.taxYear) }
  catch (error) { return res.status(400).json({ code: 'invalid_context', error: error.message }) }
  try {
    const result = await database.query(
      `
        SELECT ${fields}
        FROM public.mutual_fund_sessions
        WHERE owner_user_id = $1
          AND client_id = $2
          AND tax_year = $3
        ORDER BY created_at DESC, id DESC
      `,
      [req.context.userId, input.clientId, input.taxYear],
    )

    res.json(result.rows)
  } catch (error) {
    res.status(503).json({
      code: 'database_unavailable',
      error: 'Failed to load Mutual Fund sessions',
    })
  }
})

router.post('/sessions', async (req, res) => {
  let input
  try { input = submission(req.body) }
  catch (error) { return res.status(400).json({ code: 'invalid_submission', error: error.message }) }
  try {
    const {
      clientId,
      taxYear,
      residentState,
      fundName,
      amount,
      percentage,
      stateExempt,
      stateTaxable,
    } = input

    const result = await database.query(
      `
        INSERT INTO public.mutual_fund_sessions (
          owner_user_id,
          client_id,
          tax_year,
          resident_state,
          fund_name,
          amount,
          percentage,
          state_exempt,
          state_taxable
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING ${fields}
      `,
      [
        req.context.userId,
        clientId,
        taxYear,
        residentState || null,
        fundName || null,
        Number(amount || 0),
        Number(percentage || 0),
        Number(stateExempt || 0),
        Number(stateTaxable || 0),
      ],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(503).json({
      code: 'database_unavailable',
      error: 'Failed to save Mutual Fund session',
    })
  }
})

return router
}
module.exports = { createMutualFundRouter }
