import isPortReachable from 'is-port-reachable';

export async function checkLocalPortsAreFree() {
    const start = 22200;
    const end = 22213;
    const rangeArray = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    return await checkPortsFree(rangeArray);
}

export async function checkPortsFree(ports, host = 'localhost') {
    let messages = [];
    for (const port in ports) {
        const inUse = await isPortReachable(port, { host: host });
        if (inUse) {
            messages.push(`Port ${port} is used on ${host}, but needed for browserup`);
        }
    }
    return messages;
}

