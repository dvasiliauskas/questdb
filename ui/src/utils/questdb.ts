type ColumnDefinition = Readonly<{ name: string; type: string }>

type Value = string | number | boolean
type RawData = Record<string, Value>

enum Type {
  DDL = "ddl",
  DQL = "dql",
  ERROR = "error",
}

type HostConfig = Readonly<{
  host: string
  port: number
}>

type Timings = {
  compiler: number
  count: number
  execute: number
}

type RawDqlResult = {
  columns: ColumnDefinition[]
  count: number
  dataset: any[][]
  ddl: undefined
  query: string
  timings: Timings
}

type RawDdlResult = {
  ddl: "OK"
}

type RawErrorResult = {
  error: string
  position: number
  query: string
}

export type ErrorResult = RawErrorResult & {
  type: Type.ERROR
}

export type DdlResult = {
  type: Type.DDL
}

export type Result<T extends Record<string, any>> =
  | {
      columns: ColumnDefinition[]
      count: number
      data: T[]
      timings: Timings
      type: Type.DQL
    }
  | ErrorResult
  | DdlResult

export type RawResult = RawDqlResult | RawDdlResult

export type QuestDBTable = {
  tableName: string
}

export type QuestDBColumn = {
  columnName: string
  columnType: string
}

const hostConfig: HostConfig = {
  host: "http://localhost",
  port: 9000,
}

export const encodeParams = (
  params: Record<string, string | number | boolean>,
) =>
  Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&")

export class QuestDB {
  private _config: HostConfig
  private _controllers: AbortController[] = []

  static Type = Type

  constructor(config?: string | Partial<HostConfig>) {
    if (!config) {
      this._config = hostConfig
    } else if (typeof config === "string") {
      this._config = {
        ...hostConfig,
        host: config,
      }
    } else if (typeof config === "object") {
      this._config = {
        ...hostConfig,
        ...config,
      }
    } else {
      this._config = hostConfig
    }
  }

  abort = () => {
    this._controllers.forEach((controller) => {
      controller.abort()
    })
  }

  async query<T>(query: string): Promise<Result<T>> {
    const controller = new AbortController()
    const payload = {
      query,
      timings: true,
    }

    this._controllers.push(controller)
    const response = await fetch(
      `${this._config.host}:${this._config.port}/exec?${encodeParams(payload)}`,
      { signal: controller.signal },
    )

    const index = this._controllers.indexOf(controller)

    if (index >= 0) {
      this._controllers.splice(index, 1)
    }

    if (!response.ok) {
      return {
        error: response.statusText,
        position: -1,
        query,
        type: Type.ERROR,
      }
    }

    const data = (await response.json()) as RawResult

    if (data.ddl) {
      return { type: Type.DDL }
    }

    const { columns, count, dataset, timings } = data

    const parsed = (dataset.map(
      (row) =>
        row.reduce(
          (acc: RawData, val: Value, idx) => ({
            ...acc,
            [columns[idx].name]: val,
          }),
          {},
        ) as RawData,
    ) as unknown) as T[]

    return {
      columns,
      count,
      data: parsed,
      timings,
      type: Type.DQL,
    }
  }

  async queryRaw(
    query: string,
  ): Promise<
    (Omit<RawDqlResult, "ddl"> & { type: Type.DQL }) | DdlResult | ErrorResult
  > {
    const controller = new AbortController()
    const payload = {
      query,
      timings: true,
    }

    this._controllers.push(controller)
    const response = await fetch(
      `${this._config.host}:${this._config.port}/exec?${encodeParams(payload)}`,
      { signal: controller.signal },
    )

    const index = this._controllers.indexOf(controller)

    if (index >= 0) {
      this._controllers.splice(index, 1)
    }

    if (response.ok) {
      const data = (await response.json()) as RawResult

      if (data.ddl) {
        return {
          type: Type.DDL,
        }
      }

      return {
        ...data,
        type: Type.DQL,
      }
    }

    if (response.status === 400) {
      const data = (await response.json()) as RawErrorResult

      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({
        ...data,
        type: Type.ERROR,
      })
    }

    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({
      error: "",
      position: -1,
      query,
      type: Type.ERROR,
    })
  }

  async showTables(): Promise<Result<QuestDBTable>> {
    const response = await this.query<QuestDBTable>("SHOW TABLES;")

    if (response.type === Type.DQL) {
      return {
        ...response,
        data: response.data.slice().sort((a, b) => {
          if (a.tableName > b.tableName) {
            return 1
          }

          if (a.tableName < b.tableName) {
            return -1
          }

          return 0
        }),
      }
    }

    return response
  }

  async showColumns(table: string): Promise<Result<QuestDBColumn>> {
    return await this.query<QuestDBColumn>(`SHOW COLUMNS FROM '${table}';`)
  }
}
