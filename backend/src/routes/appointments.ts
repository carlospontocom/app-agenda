import { Router, Request, Response } from 'express'
import { pool } from '../database'
import { authenticate } from '../middleware/auth'
import type { Appointment } from '../types'

const router = Router()

/**
 * @openapi
 * /api/agendamentos:
 *   get:
 *     tags: [Agendamentos]
 *     summary: Listar agendamentos (admin vê todos, user vê próprios)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: number }
 *         description: Filtrar por usuário (admin apenas)
 *     responses:
 *       200: { description: Lista de agendamentos }
 */
/**
 * @openapi
 * /api/agendamentos/check:
 *   get:
 *     tags: [Agendamentos]
 *     summary: Verificar horários ocupados (público)
 *     parameters:
 *       - in: query
 *         name: agencia
 *         schema: { type: string }
 *       - in: query
 *         name: data
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de horários ocupados }
 */
router.get('/checar', async (req: Request, res: Response) => {
  try {
    const { agencia, data } = req.query
    const [rows] = await pool.query<any[]>(
      "SELECT hora FROM agendamentos WHERE agencia = ? AND data = ? AND status != 'cancelled'",
      [agencia, data]
    )
    res.json(rows.map((r: any) => r.hora))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query
    const isAdmin = req.user!.isAdmin

    let sql = 'SELECT * FROM agendamentos'
    const params: any[] = []

    if (userId) {
      sql += ' WHERE userId = ?'
      params.push(Number(userId))
    } else if (!isAdmin) {
      sql += ' WHERE userId = ?'
      params.push(req.user!.userId)
    }

    sql += ' ORDER BY createdAt DESC'

    const [rows] = await pool.query<any[]>(sql, params)
    const appointments = rows.map((row: any) => ({
      ...row,
      servicos: typeof row.servicos === 'string' ? JSON.parse(row.servicos) : row.servicos
    }))

    res.json(appointments)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/agendamentos/user/{userId}:
 *   get:
 *     tags: [Agendamentos]
 *     summary: Listar agendamentos de um usuário
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Lista de agendamentos do usuário }
 */
router.get('/user/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM agendamentos WHERE userId = ? ORDER BY createdAt DESC', [req.params.userId])
    const appointments = rows.map((row: any) => ({
      ...row,
      servicos: typeof row.servicos === 'string' ? JSON.parse(row.servicos) : row.servicos
    }))
    res.json(appointments)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/agendamentos:
 *   post:
 *     tags: [Agendamentos]
 *     summary: Criar novo agendamento
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: number }
 *               userName: { type: string }
 *               userDoc: { type: string }
 *               servicos: { type: array, items: { type: string } }
 *               agencia: { type: string }
 *               data: { type: string }
 *               hora: { type: string }
 *     responses:
 *       201: { description: Agendamento criado }
 *       400: { description: Limite de agendamentos ativos ou validação }
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, userName, userDoc, servicos, agencia, data, hora } = req.body

    // Check max 1 active appointment
    const [active] = await pool.query<any[]>(
      "SELECT id FROM agendamentos WHERE userId = ? AND status IN ('pending', 'confirmed')",
      [userId]
    )
    if (active.length > 0) {
      res.status(400).json({ error: 'Você já possui um agendamento ativo' })
      return
    }

    // Check max 2 services
    if (servicos.length > 2) {
      res.status(400).json({ error: 'Máximo de 2 serviços por agendamento' })
      return
    }

    const [result] = await pool.query<any>(
      `INSERT INTO agendamentos (userId, userName, userDoc, servicos, agencia, data, hora, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, userName, userDoc, JSON.stringify(servicos), agencia, data, hora]
    )

    res.status(201).json({ id: result.insertId, message: 'Agendamento criado com sucesso' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/agendamentos/{id}:
 *   patch:
 *     tags: [Agendamentos]
 *     summary: Atualizar agendamento
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Agendamento atualizado }
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { servicos, ...rest } = req.body
    const updates: string[] = []
    const params: any[] = []

    for (const [key, value] of Object.entries(rest)) {
      updates.push(`${key} = ?`)
      params.push(value)
    }
    if (servicos) {
      updates.push('servicos = ?')
      params.push(JSON.stringify(servicos))
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' })
      return
    }

    params.push(req.params.id)
    await pool.query(`UPDATE agendamentos SET ${updates.join(', ')} WHERE id = ?`, params)
    res.json({ message: 'Agendamento atualizado' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/agendamentos/{id}:
 *   delete:
 *     tags: [Agendamentos]
 *     summary: Excluir agendamento
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Agendamento excluído }
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM agendamentos WHERE id = ?', [req.params.id])
    res.json({ message: 'Agendamento excluído' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/agendamentos/{id}/status:
 *   patch:
 *     tags: [Agendamentos]
 *     summary: Atualizar status do agendamento (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *     responses:
 *       200: { description: Status atualizado }
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE agendamentos SET status = ? WHERE id = ?', [status, req.params.id])
    res.json({ message: 'Status atualizado' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
