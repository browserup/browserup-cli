import axios from 'axios';

function retryWithExponentialBackoff(fn, maxAttempts = 5, baseDelayMs = 1000) {
    let attempt = 1

    const execute = async () => {
        try {
            return fn()
        } catch (e) {
            if (attempt >= maxAttempts) {
                throw e
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
    } catch (e) {
        log.info(`Error: ${e.message}`)
        throw e;
    }
}

async function getDataWithRetries() {
    try {
        const data = await retryWithExponentialBackoff(makeRequest)
        log.info(`Data: ${data}`)
    } catch (e) {
        log.info(`Failed to get data: ${e.message}`)
    }
}

export async function getPublicIP() {
    try {
        const response = await axios.get('https://api.ipify.org');
        return response.data;
    } catch (error) {
        return null;
    }
}
