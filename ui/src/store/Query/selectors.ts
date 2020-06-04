import { StoreShape } from "types"

const getRunning: (store: StoreShape) => boolean = (store) =>
  store.query.running

export default {
  getRunning,
}
