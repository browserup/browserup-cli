import isPortReachable from 'is-port-reachable';

export async function checkLocalPortsAreFree() {
    const services = {
        "s3_minio_port_1": 6790,
        "s3_minio_port_2": 6791,
        "mysql_port": 3306,
        "redis_port": 6892,
        "rabbitmq_peer_discovery_port": 6769,
        "rabbitmq_queue_port": 6772,
        "rabbitmq_management_port": 6767,
        "zookeeper_client_port": 6781,
        "webconsole_port": 6730,
        "grid_java_api_port": 8080,
        "chronograf_port": 6788,
        "s3_minio_host_port_1": 9000,
        "grafana_port": 6799
    };
    return await checkPortsFree(services);
}

export async function checkPortsFree(services) {
    let messages = [];

    for (const [service, port] of Object.entries(services)) {
        const inUse = await isPortReachable(port, { host: 'localhost' });
        if (inUse) {
            messages.push(`Port ${port} is used, but needed for ${service}`);
        }
    }
    return messages;
}

