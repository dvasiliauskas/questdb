import React, { useCallback, useState } from "react"
import { createPortal } from "react-dom"

import { Splitter } from "components"

import Editor from "../Editor"
import Footer from "../Footer"
import Schema from "../Schema"
import Sidebar from "../Sidebar"

const Layout = () => {
  const editorNode = document.getElementById("editor")
  const footerNode = document.getElementById("footer")
  const [schemaWidthOffset, setSchemaWidthOffset] = useState<number>()
  const handleSplitterChange = useCallback((offset) => {
    setSchemaWidthOffset(offset)
  }, [])

  return (
    <>
      <Sidebar />
      {editorNode &&
        createPortal(
          <>
            <Schema widthOffset={schemaWidthOffset} />
            <Splitter onChange={handleSplitterChange} />
            <Editor />
          </>,
          editorNode,
        )}
      {footerNode && createPortal(<Footer />, footerNode)}
    </>
  )
}

export default Layout
