import { db } from '../db'
import type {
  Client,
  ConsultFollowUp,
  ConsultSession,
  ConsultSettlement,
} from '@/domain/types'
import { makeEntity, touch } from './base'

export const consultRepo = {
  async listClients(): Promise<Client[]> {
    const rows = await db.clients.toArray()
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  },

  async getClient(id: string): Promise<Client | undefined> {
    return db.clients.get(id)
  },

  async createClient(name: string, contact?: string, note?: string): Promise<Client> {
    const client = makeEntity<Client>({ name, contact, note })
    await db.clients.add(client)
    return client
  },

  async updateClient(id: string, patch: Partial<Client>): Promise<Client | undefined> {
    const current = await db.clients.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.clients.put(next)
    return next
  },

  async removeClient(id: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.clients, db.consultSessions, db.consultFollowUps, db.consultSettlements],
      async () => {
        await Promise.all([
          db.clients.delete(id),
          db.consultSessions.where('clientId').equals(id).delete(),
          db.consultFollowUps.where('clientId').equals(id).delete(),
          db.consultSettlements.where('clientId').equals(id).delete(),
        ])
      },
    )
  },

  async listSessions(clientId: string): Promise<ConsultSession[]> {
    const rows = await db.consultSessions.where('clientId').equals(clientId).toArray()
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  },

  async listAllSessions(): Promise<ConsultSession[]> {
    return db.consultSessions.toArray()
  },

  async createSession(
    clientId: string,
    input: Pick<ConsultSession, 'date' | 'topic' | 'keyPoints' | 'nextStep'>,
  ): Promise<ConsultSession> {
    const session = makeEntity<ConsultSession>({ ...input, clientId })
    await db.consultSessions.add(session)
    return session
  },

  async updateSession(
    id: string,
    patch: Partial<ConsultSession>,
  ): Promise<ConsultSession | undefined> {
    const current = await db.consultSessions.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.consultSessions.put(next)
    return next
  },

  async removeSession(id: string): Promise<void> {
    await db.transaction('rw', [db.consultSessions, db.consultFollowUps], async () => {
      await Promise.all([
        db.consultSessions.delete(id),
        db.consultFollowUps.where('sessionId').equals(id).delete(),
      ])
    })
  },

  async listFollowUps(clientId: string): Promise<ConsultFollowUp[]> {
    return db.consultFollowUps.where('clientId').equals(clientId).toArray()
  },

  async listOpenFollowUps(): Promise<ConsultFollowUp[]> {
    return db.consultFollowUps.where('status').equals('open').toArray()
  },

  async createFollowUp(
    clientId: string,
    content: string,
    dueDate?: string,
    sessionId?: string,
  ): Promise<ConsultFollowUp> {
    const followUp = makeEntity<ConsultFollowUp>({
      clientId,
      sessionId,
      content,
      dueDate,
      status: 'open',
    })
    await db.consultFollowUps.add(followUp)
    return followUp
  },

  async updateFollowUp(
    id: string,
    patch: Partial<ConsultFollowUp>,
  ): Promise<ConsultFollowUp | undefined> {
    const current = await db.consultFollowUps.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.consultFollowUps.put(next)
    return next
  },

  async removeFollowUp(id: string): Promise<void> {
    await db.consultFollowUps.delete(id)
  },

  async setFollowUpDone(id: string, done: boolean): Promise<void> {
    await this.updateFollowUp(id, { status: done ? 'done' : 'open' })
  },

  async listSettlements(clientId: string): Promise<ConsultSettlement[]> {
    const rows = await db.consultSettlements.where('clientId').equals(clientId).toArray()
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  },

  async createSettlement(
    clientId: string,
    date: string,
    amount?: number,
    quantity?: number,
  ): Promise<ConsultSettlement> {
    const settlement = makeEntity<ConsultSettlement>({
      clientId,
      date,
      quantity,
      amount,
      status: 'unpaid',
    })
    await db.consultSettlements.add(settlement)
    return settlement
  },

  async updateSettlement(
    id: string,
    patch: Partial<ConsultSettlement>,
  ): Promise<ConsultSettlement | undefined> {
    const current = await db.consultSettlements.get(id)
    if (!current) return undefined
    const next = touch({ ...current, ...patch, id })
    await db.consultSettlements.put(next)
    return next
  },

  async removeSettlement(id: string): Promise<void> {
    await db.consultSettlements.delete(id)
  },
}
