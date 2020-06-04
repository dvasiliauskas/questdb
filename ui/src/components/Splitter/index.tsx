import React, {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import styled from "styled-components"

import { color } from "utils"

type Props = Readonly<{
  onChange: (x: number) => void
}>

const Wrapper = styled.div`
  display: flex;
  width: 6px;
  height: 100%;
  background: ${color("gray1")};

  &:hover {
    background: ${color("gray2")};
    cursor: ew-resize;
  }
`

const Ghost = styled(Wrapper)`
  position: absolute;
  width: 6px;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: ${color("gray2")};
  cursor: ew-resize;
`

type Position = Readonly<{
  x: number
}>

export const Splitter = ({ onChange }: Props) => {
  const [pressed, setPressed] = useState(false)
  const [left, setLeft] = useState<number>(0)
  const [xOffset, setXOffset] = useState<number>(0)
  const splitter = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<Position>({ x: 0 })

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setPosition({
      x: event.clientX,
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mouseup", handleMouseUp)
    document.removeEventListener("mousemove", handleMouseMove)
    setPressed(false)
  }, [handleMouseMove])

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (splitter.current && splitter.current.parentElement) {
        const { x } = splitter.current.parentElement.getBoundingClientRect()

        setLeft(event.clientX - x)
        setXOffset(x)
        setPressed(true)

        document.addEventListener("mouseup", handleMouseUp)
        document.addEventListener("mousemove", handleMouseMove)
      }
    },
    [handleMouseMove, handleMouseUp],
  )

  useEffect(() => {
    if (!pressed && position.x) {
      onChange(position.x - left - xOffset)
      setLeft(0)
      setPosition({ x: 0 })
    }
  }, [onChange, position, pressed, left, xOffset])

  return (
    <>
      <Wrapper onMouseDown={handleMouseDown} ref={splitter} />

      {position.x > 0 && (
        <Ghost
          style={{
            left: `${position.x - xOffset}px`,
          }}
        />
      )}
    </>
  )
}
