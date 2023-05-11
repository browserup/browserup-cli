import "axios";

function retryWithExponentialBackoff(fn, maxAttempts = 5, baseDelayMs = 1000) {
    let attempt = 1

    const execute = async () => {
        try {
            return fn()
        } catch (error) {
            if (attempt >= maxAttempts) {
                throw error
            }

            const delayMs = baseDelayMs * 2 ** attempt
            log.info(`Retry attempt ${attempt} after ${delayMs}ms`)
            await new Promise((resolve) => setTimeout(resolve, delayMs))

            attempt++
            return execute()
        }
    }

    return execute()
}


async function makeRequest() {
    const url = "https://example.com/api/data"
    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        log.info(`Error: ${error.message}`)
        throw error
    }
}

async function getDataWithRetries() {
    try {
        const data = await retryWithExponentialBackoff(makeRequest)
        log.info(`Data: ${data}`)
    } catch (error) {
        log.info(`Failed to get data: ${error.message}`)
    }
}
