import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from './AppShell'
import { settingsRepo } from '@/data/repositories/settings'

const HomePage = lazy(() => import('@/features/home/HomePage').then((module) => ({ default: module.HomePage })))
const MediaPage = lazy(() => import('@/features/media/MediaPage').then((module) => ({ default: module.MediaPage })))
const DevPage = lazy(() => import('@/features/dev/DevPage').then((module) => ({ default: module.DevPage })))
const ConsultPage = lazy(() => import('@/features/consult/ConsultPage').then((module) => ({ default: module.ConsultPage })))
const FitnessPage = lazy(() => import('@/features/fitness/FitnessPage').then((module) => ({ default: module.FitnessPage })))
const DietPage = lazy(() => import('@/features/diet/DietPage').then((module) => ({ default: module.DietPage })))
const GamesPage = lazy(() => import('@/features/games/GamesPage').then((module) => ({ default: module.GamesPage })))
const PlanPage = lazy(() => import('@/features/plan/PlanPage').then((module) => ({ default: module.PlanPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function IndexRedirect() {
  const settings = useLiveQuery(() => settingsRepo.get(), [], undefined)
  return <Navigate to={settings?.defaultRoute ?? '/home'} replace />
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="route-loading">正在加载页面...</div>}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<IndexRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/dev" element={<DevPage />} />
          <Route path="/consult" element={<ConsultPage />} />
          <Route path="/fitness" element={<FitnessPage />} />
          <Route path="/diet" element={<DietPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
