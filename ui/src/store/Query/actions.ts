import { QueryAction, QueryAT } from "types"

const stopRunning = (): QueryAction => ({
  type: QueryAT.STOP_RUNNING,
})

const toggleRunning = (): QueryAction => ({
  type: QueryAT.TOGGLE_RUNNING,
})

export default { stopRunning, toggleRunning }
