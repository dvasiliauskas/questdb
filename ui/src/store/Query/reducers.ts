import { QueryAction, QueryAT, QueryStateShape } from "types"

export const initialState: QueryStateShape = {
  notifications: [],
  running: false,
}

const query = (state = initialState, action: QueryAction): QueryStateShape => {
  switch (action.type) {
    case QueryAT.ADD_NOTIFICATION: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, createdAt: new Date() },
        ],
      }
    }

    case QueryAT.CLEANUP_NOTIFICATIONS: {
      return {
        ...state,
        notifications: state.notifications.filter(({ createdAt }) => createdAt),
      }
    }

    case QueryAT.STOP_RUNNING: {
      return {
        ...state,
        running: false,
      }
    }

    case QueryAT.TOGGLE_RUNNING: {
      return {
        ...state,
        running: !state.running,
      }
    }

    default:
      return state
  }
}

export default query
