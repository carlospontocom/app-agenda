import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../database'
import { JwtPayload } from '../types'

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' })
    return
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload
    const [users] = await pool.query<any[]>('SELECT ativo FROM usuarios WHERE id = ?', [decoded.userId])
    if (users.length === 0 || !users[0].ativo) {
      res.status(403).json({ error: 'Sua conta está inativa. Procure a agência mais próxima para atualizar seu cadastro.' })
      return
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Acesso restrito a administradores' })
    return
  }
  next()
}

export function generateToken(payload: JwtPayload): string {
  const expiresIn: number = 7 * 24 * 60 * 60 // 7 days in seconds
  return jwt.sign(payload, SECRET, { expiresIn })
}
