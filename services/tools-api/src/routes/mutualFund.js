const express = require('express')
const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth')
const { attachContext } = require('../middleware/context')

const router = express.Router()

router.use(requireAuth)
router.use(attachContext)

router.get('/sessions', async (req, res) => {
  try {
    const clientId = req.query.clientId
    const taxYear = req.query.taxYear

    if (!clientId || !taxYear) {
      return res.status(400).json({
        error: 'clientId and taxYear are required',
      })
    }

    const result = await pool.query(
      `
        SELECT *
        FROM mutual_fund_sessions
        WHERE client_id = $1
          AND tax_year = $2
        ORDER BY created_at DESC
      `,
      [clientId, taxYear],
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Failed to load Mutual Fund sessions:', error)

    res.status(500).json({
      error: 'Failed to load Mutual Fund sessions',
    })
  }
})

router.post('/sessions', async (req, res) => {
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
    } = req.body

    if (!clientId || !taxYear) {
      return res.status(400).json({
        error: 'clientId and taxYear are required',
      })
    }

    const result = await pool.query(
      `
        INSERT INTO mutual_fund_sessions (
          user_id,
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
        RETURNING *
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
    console.error('Failed to save Mutual Fund session:', error)

    res.status(500).json({
      error: 'Failed to save Mutual Fund session',
    })
  }
})

module.exports = router