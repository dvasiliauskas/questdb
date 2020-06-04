import React, { useCallback, useEffect, useRef, useState } from "react"
import { TransitionGroup } from "react-transition-group"
import { from, combineLatest, of } from "rxjs"
import { delay, startWith } from "rxjs/operators"
import styled from "styled-components"
import { Database } from "@styled-icons/entypo/Database"
import { Loader3 } from "@styled-icons/remix-fill/Loader3"
import { Refresh } from "@styled-icons/remix-line/Refresh"

import {
  PaneContent,
  PaneWrapper,
  PopperHover,
  PaneMenu,
  SecondaryButton,
  spinAnimation,
  Text,
  Tooltip,
} from "components"
import { color, QuestDB, QuestDBTable } from "utils"

import Table from "./Table"

type Props = Readonly<{
  widthOffset?: number
}>

const Wrapper = styled(PaneWrapper)<{
  basis?: number
}>`
  flex: 0 0 350px;
  ${({ basis }) => basis && `flex-basis: ${basis}px`};
`

const Menu = styled(PaneMenu)`
  justify-content: space-between;
`

const Content = styled(PaneContent)`
  display: block;
  font-family: ${({ theme }) => theme.fontMonospace};
`

const DatabaseIcon = styled(Database)`
  margin-right: 1rem;
`

const Loader = styled(Loader3)`
  margin-left: 1rem;
  align-self: center;
  color: ${color("draculaForeground")};
  ${spinAnimation};
`

const FlexSpacer = styled.div`
  flex: 1;
`

const Schema = ({ widthOffset }: Props) => {
  const [quest] = useState(new QuestDB({ port: BACKEND_PORT }))
  const [loading, setLoading] = useState(false)
  const element = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState<number>()
  const [tables, setTables] = useState<QuestDBTable[]>()
  const [opened, setOpened] = useState<string>()

  const handleChange = useCallback((name: string) => {
    setOpened(name)
  }, [])

  const fetchTables = useCallback(() => {
    combineLatest(
      from(quest.showTables()).pipe(startWith(null)),
      of(true).pipe(delay(1000), startWith(false)),
    ).subscribe(([response, loading]) => {
      if (response && !response.error) {
        setTables(response.data)
        setLoading(false)
      } else {
        setLoading(loading)
      }
    })
  }, [quest])

  useEffect(() => {
    void fetchTables()
  }, [fetchTables])

  useEffect(() => {
    if (element.current && widthOffset) {
      setWidth(element.current.getBoundingClientRect().width + widthOffset)
    }
  }, [widthOffset])

  return (
    <Wrapper basis={width} ref={element}>
      <Menu>
        <Text color="draculaForeground">
          <DatabaseIcon size="18px" />
          Tables
        </Text>

        <PopperHover
          delay={350}
          placement="bottom"
          trigger={
            <SecondaryButton onClick={fetchTables}>
              <Refresh size="16px" />
            </SecondaryButton>
          }
        >
          <Tooltip>Refresh</Tooltip>
        </PopperHover>
      </Menu>

      <Content>
        {loading && <Loader size="48px" />}
        {!loading && tables && (
          <TransitionGroup component={null}>
            {tables.map(({ tableName }) => (
              <Table
                expanded={tableName === opened}
                key={tableName}
                onChange={handleChange}
                tableName={tableName}
              />
            ))}
          </TransitionGroup>
        )}
        {!loading && <FlexSpacer />}
      </Content>
    </Wrapper>
  )
}

export default Schema
