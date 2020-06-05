export type Notification = Readonly<{
  createdAt?: Date
  title: string
  line1?: string
  line2?: string
}>

export type QueryStateShape = Readonly<{
  notifications: Notification[]
  running: boolean
}>

export enum QueryAT {
  ADD_NOTIFICATION = "QUERY/ADD_NOTIFICATION",
  CLEANUP_NOTIFICATIONS = "QUERY/CLEANUP_NOTIFICATIONS",
  STOP_RUNNING = "QUERY/STOP_RUNNING",
  TOGGLE_RUNNING = "QUERY/TOGGLE_RUNNING",
}

type AddNotificationAction = Readonly<{
  payload: Notification
  type: QueryAT.ADD_NOTIFICATION
}>

type CleanupNotificationsAction = Readonly<{
  type: QueryAT.CLEANUP_NOTIFICATIONS
}>

type ToggleRunningAction = Readonly<{
  type: QueryAT.TOGGLE_RUNNING
}>

type StopRunningAction = Readonly<{
  type: QueryAT.STOP_RUNNING
}>

export type QueryAction =
  | AddNotificationAction
  | CleanupNotificationsAction
  | StopRunningAction
  | ToggleRunningAction
