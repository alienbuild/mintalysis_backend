export const encodeCursor = cursor => Buffer.from(cursor).toString('base64')
export const decodeCursor = cursor => Buffer.from(cursor, 'base64').toString('ascii')

export const truncate = (str, length) => {
    if (!str) return null;
    const ending = '...';
    if (length == null) {
        length = 200;
    }
    if (str?.length > length) {
        return str.substring(0, length - ending?.length) + ending;
    } else {
        return str;
    }
}