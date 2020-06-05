import { Notification, QueryAction, QueryAT } from "types"

const addNotification = (payload: Notification): QueryAction => ({
  payload,
  type: QueryAT.ADD_NOTIFICATION,
})

const cleanupNotifications = (): QueryAction => ({
  type: QueryAT.CLEANUP_NOTIFICATIONS,
})

const stopRunning = (): QueryAction => ({
  type: QueryAT.STOP_RUNNING,
})

const toggleRunning = (): QueryAction => ({
  type: QueryAT.TOGGLE_RUNNING,
})

export default {
  addNotification,
  cleanupNotifications,
  stopRunning,
  toggleRunning,
}
