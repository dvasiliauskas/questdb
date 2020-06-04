import { Ace as AceBuilds, Range } from "ace-builds"
import React, { useCallback, useEffect, useRef, useState } from "react"
import ReactAce from "react-ace"
import { useDispatch, useSelector } from "react-redux"
import styled from "styled-components"

import { PaneContent } from "components"
import { actions, selectors } from "store"
import { theme } from "theme"
import { BusEvent, color, ExecResult, QuestDB } from "utils"

import questdbMode from "./questdbMode"
import {
  getQueryFromCursor,
  getQueryFromSelection,
  loadPreferences,
  savePreferences,
  toTextPosition,
} from "./utils"

const quest = new QuestDB({ port: BACKEND_PORT })

const Content = styled(PaneContent)`
  .ace-dracula .ace_marker-layer .ace_selected-word {
    box-shadow: inset 0px 0px 0px 1px ${color("draculaOrange")};
    transform: scale(1.05);
    z-index: 6;
  }
`

enum Command {
  EXECUTE = "execute",
  EXECUTE_AT = "execute_at",
  FOCUS_GRID = "focus_grid",
}

const Ace = () => {
  const [fetching, setFetching] = useState(false)
  const [value, setValue] = useState("")
  const aceEditor = useRef<ReactAce | null>(null)
  const dispatch = useDispatch()
  const running = useSelector(selectors.query.getRunning)

  const handleChange = useCallback((value) => {
    setValue(value)
  }, [])

  const setError = (editor: AceBuilds.Editor, err: string) => {
    const position = toTextPosition(err.query, err.position)
    setFetching(false)
    dispatch(actions.query.stopRunning())
    const token = editor.session.getTokenAt(
      position.row - 1,
      position.column,
    ) || {
      value: "",
    }
    const range = new Range(
      position.row - 1,
      position.column - 1,
      position.row - 1,
      position.column + token.value.length - 1,
    )

    editor.session.addMarker(range, "js-syntax-error", "text", true)

    editor.gotoLine(position.row, position.column - 1, true)
    editor.focus()
  }

  const setResult = (result: ExecResult) => {
    console.log(result)
    setFetching(false)
    dispatch(actions.query.stopRunning())
    // bus.trigger(BusEvent.MSG_QUERY_DATASET, row)
  }

  useEffect(() => {
    if (!running && fetching) {
      quest.abort()
      dispatch(actions.query.stopRunning())
      setFetching(false)
    }
  }, [dispatch, running, fetching])

  useEffect(() => {
    if (!aceEditor.current) {
      return
    }

    const { editor } = aceEditor.current

    if (running) {
      savePreferences(editor)
      const markers = editor.session.getMarkers()

      if (markers) {
        Object.values(markers).forEach((_m, i) => {
          editor.session.removeMarker(i)
        })
      }

      const request =
        editor.getSelectedText() === ""
          ? getQueryFromCursor(editor)
          : getQueryFromSelection(editor)

      if (request && request.query) {
        void quest
          .queryRaw(request.query)
          .then(setResult)
          .catch((error) => setError(editor, error))
        setFetching(true)
      } else {
        dispatch(actions.query.stopRunning())
      }
    }
  }, [dispatch, running])

  useEffect(() => {
    if (!aceEditor.current) {
      return
    }

    const { editor } = aceEditor.current

    const toggleRunning = () => {
      dispatch(actions.query.toggleRunning())
    }

    editor.getSession().setMode(questdbMode)

    editor.commands.addCommand({
      bindKey: "F9",
      name: Command.EXECUTE,
      exec: toggleRunning,
    })

    editor.commands.addCommand({
      bindKey: {
        mac: "Command-Enter",
        win: "Ctrl-Enter",
      },
      exec: toggleRunning,
      name: Command.EXECUTE_AT,
    })

    editor.commands.addCommand({
      bindKey: "F2",
      exec: () => {
        window.bus.trigger("grid.focus")
      },
      name: Command.FOCUS_GRID,
    })

    window.bus.on(BusEvent.MSG_QUERY_FIND_N_EXEC, (_event, query) => {
      const row = editor.session.getLength()
      const text = `\n${query};`

      editor.find(`'${query}'`, {
        wrap: true,
        caseSensitive: true,
        preventScroll: false,
      })

      editor.session.insert({ column: 0, row }, text)
      editor.selection.moveCursorToPosition({ column: 0, row: row + 1 })
      editor.selection.selectLine()

      toggleRunning()
    })

    window.bus.on("editor.insert.column", (_event, column) => {
      editor.insert(column)
      editor.focus()
    })

    window.bus.on(BusEvent.MSG_EDITOR_FOCUS, () => {
      editor.scrollToLine(
        editor.getCursorPosition().row + 1,
        true,
        true,
        () => {},
      )
      editor.focus()
    })
    window.bus.on("preferences.load", () => {
      loadPreferences(editor)
    })
    window.bus.on("preferences.save", () => {
      savePreferences(editor)
    })
    window.bus.on("editor.set", (_event, query) => {
      if (query) {
        editor.setValue(query)
      }
    })
  }, [])

  return (
    <Content>
      <ReactAce
        editorProps={{
          $blockScrolling: Infinity,
        }}
        fontSize={theme.fontSize.md}
        height="100%"
        mode="text"
        name="questdb-sql-editor"
        onChange={handleChange}
        ref={aceEditor}
        setOptions={{
          fontFamily: theme.fontMonospace,
          highlightActiveLine: false,
          showIndentGuide: true,
          showLineNumbers: true,
          showPrintMargin: false,
        }}
        theme="dracula"
        value={value}
        width="100%"
      />
    </Content>
  )
}

export default Ace
