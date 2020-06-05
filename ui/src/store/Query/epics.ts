import { Epic } from "redux-observable"
import { interval, of } from "rxjs"
import { switchMap } from "rxjs/operators"

import { actions } from "store"
import { StoreAction, StoreShape } from "types"

export const cleanupNotifications: Epic<
  StoreAction,
  StoreAction,
  StoreShape
> = () =>
  interval(1000).pipe(switchMap(() => of(actions.query.cleanupNotifications())))

export default [cleanupNotifications]
