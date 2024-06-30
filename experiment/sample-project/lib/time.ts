export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

export const getTimestmap = (): string => {
	const now = new Date()
	const year = now.getUTCFullYear().toString()
	const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
	const day = now.getUTCDate().toString().padStart(2, "0")
	const hours = now.getUTCHours().toString().padStart(2, "0")
	const minutes = now.getUTCMinutes().toString().padStart(2, "0")
	const seconds = now.getUTCSeconds().toString().padStart(2, "0")

	return `${year}${month}${day}-${hours}${minutes}${seconds}`
}
