import {
  App,
  Button,
  Checkbox,
  Col,
  Input,
  List,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CalendarPlus,
  Coffee,
  Copy,
  Droplets,
  GlassWater,
  Plus,
  Salad,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DateSwitcher } from '@/components/DateSwitcher'
import { PageHeader } from '@/components/PageHeader'
import { addDietToToday, syncSourceToPlan } from '@/data/planLink'
import { dietRepo } from '@/data/repositories/diet'
import { settingsRepo } from '@/data/repositories/settings'
import type { MealFavorite, MealItem, MealType } from '@/domain/types'
import { addDays, todayKey } from '@/utils/date'

const MEALS: Array<{ key: MealType; label: string; icon: typeof Coffee }> = [
  { key: 'breakfast', label: '早餐', icon: Coffee },
  { key: 'lunch', label: '午餐', icon: Salad },
  { key: 'dinner', label: '晚餐', icon: Salad },
  { key: 'snack', label: '加餐', icon: Coffee },
]

function MealSection({
  meal,
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
  meal: MealType
  items: MealItem[]
  onAdd: (name: string) => void
  onToggle: (item: MealItem) => void
  onRemove: (item: MealItem) => void
}) {
  const [value, setValue] = useState('')
  const config = MEALS.find((item) => item.key === meal)!
  const Icon = config.icon
  const add = () => {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }
  return (
    <section className="surface diet-meal-section">
      <div className="diet-meal-heading">
        <div>
          <Icon size={16} color="#4d7c0f" />
          <strong>{config.label}</strong>
          <span>{items.filter((item) => item.done).length}/{items.length}</span>
        </div>
      </div>
      <div className="diet-meal-items">
        {items.length === 0 ? (
          <div className="quiet-empty">还没有安排</div>
        ) : (
          items.map((item) => (
            <div className="diet-item-row" key={item.id}>
              <Checkbox
                checked={item.done}
                onChange={() => onToggle(item)}
                aria-label={`完成 ${item.name}`}
              />
              <div className="diet-item-content">
                <span className={item.done ? 'is-done' : ''}>{item.name}</span>
                {item.amount ? (
                  <Typography.Text type="secondary">{item.amount}</Typography.Text>
                ) : null}
              </div>
              <Popconfirm title="删除这项？" onConfirm={() => onRemove(item)}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  aria-label={`删除 ${item.name}`}
                />
              </Popconfirm>
            </div>
          ))
        )}
      </div>
      <div className="diet-meal-add">
        <Input
          data-testid={`diet-add-${meal}-input`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onPressEnter={add}
          placeholder="输入食物"
          suffix={
            <Button
              type="text"
              size="small"
              icon={<Plus size={15} />}
              aria-label={`添加${config.label}`}
              onClick={add}
            />
          }
        />
      </div>
    </section>
  )
}

export function DietPage() {
  const { message } = App.useApp()
  const [date, setDate] = useState(todayKey())
  const [favoriteTargetMeal, setFavoriteTargetMeal] = useState<MealType>('lunch')
  const [favoriteName, setFavoriteName] = useState('')
  const settings = useLiveQuery(() => settingsRepo.get(), [], undefined)
  const day = useLiveQuery(() => dietRepo.getDay(date), [date], undefined)
  const items = useLiveQuery<MealItem[], MealItem[]>(
    () => dietRepo.listItems(date),
    [date],
    [],
  )
  const favorites = useLiveQuery<MealFavorite[], MealFavorite[]>(
    () => dietRepo.listFavorites(),
    [],
    [],
  )

  const addItem = async (meal: MealType, name: string) => {
    await dietRepo.addItem(date, meal, name)
  }

  const toggleItem = async (item: MealItem) => {
    await dietRepo.updateItem(item.id, { done: !item.done })
    const updated = await dietRepo.listItems(date)
    const allDone = updated.length > 0 && updated.every((current) => current.done)
    await dietRepo.setDayDone(date, allDone)
    if (allDone) {
      await syncSourceToPlan('diet', date, true)
    }
  }

  const removeItem = async (item: MealItem) => {
    await dietRepo.removeItem(item.id)
  }

  const addFavorite = async () => {
    const name = favoriteName.trim()
    if (!name) return
    await dietRepo.createFavorite(name)
    setFavoriteName('')
    message.success('常用食物已添加')
  }

  const addFavoriteToMeal = async (favorite: MealFavorite) => {
    await dietRepo.addFavoriteToMeal(favorite.id, date, favoriteTargetMeal)
    message.success(`已加入${MEALS.find((meal) => meal.key === favoriteTargetMeal)?.label}`)
  }

  const copyYesterday = async () => {
    await dietRepo.copyMeal(addDays(date, -1), date)
    message.success('已复制昨天的饮食安排')
  }

  const addWater = async (amount = 250) => {
    await dietRepo.addWater(date, amount)
  }

  const waterGoal = day?.waterGoalMl ?? settings?.waterGoalMl ?? 2000
  const waterActual = day?.waterActualMl ?? 0
  const waterPercent = waterGoal > 0 ? Math.min(100, Math.round((waterActual / waterGoal) * 100)) : 0

  return (
    <>
      <PageHeader
        title="饮食计划"
        description="安排三餐加餐、常用食物和饮水"
        action={
          <Space>
            <Button icon={<Copy size={16} />} onClick={() => void copyYesterday()}>
              复制昨天
            </Button>
            {date === todayKey() ? (
              <Button
                data-testid="diet-join-today"
                type="primary"
                icon={<CalendarPlus size={16} />}
                onClick={() =>
                  void addDietToToday(date).then(() => message.success('已加入今日计划'))
                }
              >
                加入今日
              </Button>
            ) : null}
          </Space>
        }
      />

      <div className="surface diet-day-panel">
        <div className="surface-section diet-top-row">
          <DateSwitcher value={date} onChange={setDate} />
          <Tag color={day?.done ? 'green' : 'default'} data-testid="diet-day-status">
            {day?.done ? '饮食记录已完成' : '饮食记录进行中'}
          </Tag>
        </div>
        <div className="diet-water-row">
          <div>
            <Droplets size={20} color="#0284c7" />
            <div>
              <strong>饮水记录</strong>
              <span data-testid="diet-water-text">{waterActual}/{waterGoal} ml</span>
            </div>
          </div>
          <Progress
            percent={waterPercent}
            strokeColor="#0284c7"
            style={{ flex: 1, margin: '0 22px' }}
          />
          <Space>
            <Button
              data-testid="diet-add-water"
              icon={<GlassWater size={16} />}
              onClick={() => void addWater(250)}
            >
              加 250ml
            </Button>
            <InputNumberSmall value={waterActual} onChange={(value) => void dietRepo.setWater(date, value ?? 0)} />
          </Space>
        </div>
      </div>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <div className="diet-meal-grid">
            {MEALS.map((meal) => (
              <MealSection
                key={meal.key}
                meal={meal.key}
                items={items.filter((item) => item.meal === meal.key)}
                onAdd={(name) => void addItem(meal.key, name)}
                onToggle={(item) => void toggleItem(item)}
                onRemove={(item) => void removeItem(item)}
              />
            ))}
          </div>
        </Col>
        <Col xs={24} xl={8}>
          <section className="surface">
            <div className="surface-section diet-section-heading">
              <div>
                <h2>常用食物</h2>
                <p>点击即可加入所选餐次</p>
              </div>
            </div>
            <div className="surface-section">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Select
                  value={favoriteTargetMeal}
                  options={MEALS.map((meal) => ({ label: meal.label, value: meal.key }))}
                  onChange={setFavoriteTargetMeal}
                  style={{ width: 130 }}
                />
                <Input
                  data-testid="diet-favorite-name-input"
                  value={favoriteName}
                  onChange={(event) => setFavoriteName(event.target.value)}
                  onPressEnter={() => void addFavorite()}
                  placeholder="收藏一个常吃食物"
                  suffix={
                    <Button
                      type="text"
                      size="small"
                      icon={<Plus size={15} />}
                      aria-label="添加常用食物"
                      onClick={() => void addFavorite()}
                    />
                  }
                />
              </Space>
            </div>
            {favorites.length === 0 ? (
              <div className="quiet-empty">还没有常用食物。</div>
            ) : (
              <List
                size="small"
                dataSource={favorites}
                renderItem={(favorite) => (
                  <List.Item
                    data-testid={`diet-favorite-${favorite.id}`}
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="删除常用食物？"
                        onConfirm={() => void dietRepo.removeFavorite(favorite.id)}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 size={14} />}
                          aria-label="删除常用食物"
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <button
                      type="button"
                      className="diet-favorite-button"
                      onClick={() => void addFavoriteToMeal(favorite)}
                    >
                      <Plus size={13} />
                      <span>{favorite.name}</span>
                    </button>
                  </List.Item>
                )}
              />
            )}
          </section>
        </Col>
      </Row>
    </>
  )
}

function InputNumberSmall({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Input
      type="number"
      value={value}
      min={0}
      aria-label="设置饮水量"
      style={{ width: 110 }}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}
