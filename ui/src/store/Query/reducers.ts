import { QueryAction, QueryAT, QueryStateShape } from "types"

export const initialState: QueryStateShape = {
  running: false,
}

const query = (state = initialState, action: QueryAction): QueryStateShape => {
  switch (action.type) {
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
