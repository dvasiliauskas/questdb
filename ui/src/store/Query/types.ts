export type QueryStateShape = Readonly<{
  running: boolean
}>

export enum QueryAT {
  STOP_RUNNING = "QUERY/STOP_RUNNING",
  TOGGLE_RUNNING = "QUERY/TOGGLE_RUNNING",
}

type ToggleRunningAction = Readonly<{
  type: QueryAT.TOGGLE_RUNNING
}>

type StopRunningAction = Readonly<{
  type: QueryAT.STOP_RUNNING
}>

export type QueryAction = StopRunningAction | ToggleRunningAction
