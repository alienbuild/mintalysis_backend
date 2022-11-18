export const encodeCursor = cursor => Buffer.from(cursor).toString('base64')

export const decodeCursor = cursor => Buffer.from(cursor, 'base64').toString('ascii')

