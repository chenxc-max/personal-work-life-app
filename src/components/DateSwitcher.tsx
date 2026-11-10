import { DatePicker, Space, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, todayKey } from '@/utils/date'

interface DateSwitcherProps {
  value: string
  onChange: (date: string) => void
  showToday?: boolean
}

export function DateSwitcher({ value, onChange, showToday = true }: DateSwitcherProps) {
  const change = (next: string) => onChange(next)

  return (
    <Space align="center">
      <button
        type="button"
        className="icon-button"
        aria-label="前一天"
        onClick={() => change(addDays(value, -1))}
      >
        <ChevronLeft size={17} />
      </button>
      <DatePicker
        data-testid="date-switcher"
        value={dayjs(value)}
        allowClear={false}
        format="YYYY年M月D日"
        onChange={(date: Dayjs | null) => {
          if (date) change(date.format('YYYY-MM-DD'))
        }}
      />
      <button
        type="button"
        className="icon-button"
        aria-label="后一天"
        onClick={() => change(addDays(value, 1))}
      >
        <ChevronRight size={17} />
      </button>
      {showToday ? (
        <Typography.Link
          data-testid="date-today-link"
          onClick={() => change(todayKey())}
          underline
        >
          今天
        </Typography.Link>
      ) : null}
    </Space>
  )
}
