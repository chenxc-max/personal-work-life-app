import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { App } from './App'

describe('application shell', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  it('renders the home page and navigates through the sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: '首页总览' })).toBeInTheDocument()
    await user.click(screen.getByText('自媒体'))
    expect(await screen.findByRole('heading', { name: '自媒体' })).toBeInTheDocument()
  })

  it('saves a memo from the global quick capture modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTestId('quick-capture-button'))
    await user.type(screen.getByTestId('quick-capture-content'), '阶段验收备忘')
    await user.click(screen.getByRole('button', { name: /保\s*存/ }))

    await waitFor(async () => {
      expect(await db.memos.count()).toBe(1)
    })
    expect(await screen.findByText('备忘已保存')).toBeInTheDocument()
  }, 15_000)
})
