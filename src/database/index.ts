import { createConnection, getConnectionOptions, Connection } from 'typeorm'

export default async (name = 'default'): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions()

  return createConnection(
    Object.assign(defaultOptions, {
      name,
      database:
        process.env.NODE_ENV === 'test'
          ? 'gostack_desafio_06_backend_tests'
          : defaultOptions.database
    })
  )
}
