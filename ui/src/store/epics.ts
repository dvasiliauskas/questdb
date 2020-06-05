import { combineEpics } from "redux-observable"

import consoleEpic from "./Console/epics"
import queryEpic from "./Query/epics"

export default combineEpics(...consoleEpic, ...queryEpic)
