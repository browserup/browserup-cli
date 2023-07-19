

export const WAIT_FOR_BUILD_AND_UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes in millis
// Note: This assumes the script is running in the same directory as the 'dockerfiles' directory.
//export const DOCKERFILES_DIR = './dockerfiles';
const truthy = (str) => ['true', '1', 'yes'].includes((str || '').toLowerCase());

export const OPEN_LOCAL_PORTS = truthy(process.env.OPEN_LOCAL_PORTS);

export const BROWSERUP_MINION_DEBUG = truthy(process.env.BROWSERUP_MINION_DEBUG);
export const BROWSERUP_MINION_DEBUG_PORT = process.env.BROWSERUP_MINION_DEBUG_PORT || '8000';
export const BROWSERUP_MINION_DEBUG_SUSPEND = process.env.BROWSERUP_MINION_DEBUG_SUSPEND || 'y';

export const BROWSERUP_GRID_API_DEBUG = truthy(process.env.BROWSERUP_GRID_API_DEBUG);
export const BROWSERUP_GRID_API_DEBUG_PORT = process.env.BROWSERUP_GRID_API_DEBUG_PORT || '8001';
export const BROWSERUP_GRID_API_DEBUG_SUSPEND = process.env.BROWSERUP_GRID_API_DEBUG_SUSPEND || 'y';

export const BROWSERUP_GRID_COORDINATOR_DEBUG = truthy(process.env.BROWSERUP_GRID_COORDINATOR_DEBUG);
export const BROWSERUP_GRID_COORDINATOR_DEBUG_PORT = process.env.BROWSERUP_GRID_COORDINATOR_DEBUG_PORT || '8002';
export const BROWSERUP_GRID_COORDINATOR_DEBUG_SUSPEND = process.env.BROWSERUP_GRID_COORDINATOR_DEBUG_SUSPEND || 'y';

export const CHRONOGRAF = truthy(process.env.CHRONOGRAF);

export const DEBUG_WEBCONSOLE = truthy(process.env.DEBUG_WEBCONSOLE);

export const BROWSERUP_RAILS_LOCAL_MOUNT_PATH = process.env.BROWSERUP_RAILS_LOCAL_MOUNT_PATH || null;

export const BROWSERUP_RAILS_ENV = process.env.BROWSERUP_RAILS_ENV || 'development';

export const CLUSTER_URL_ENV_NAME = 'BROWSERUP_URL_OVERRIDE';

export const BROWSERUP_API_TOKEN = 'BROWSERUP_API_TOKEN';
export const BROWSERUP_CLUSTER_NAME = 'BROWSERUP_CLUSTER_NAME';
export const BROWSERUP_CLUSTER_TYPE = 'BROWSERUP_CLUSTER_TYPE';

export const BROWSERUP_CLI_VERBOSE = truthy(process.env.BROWSERUP_CLI_VERBOSE);

export const API_TOKEN_SIZE = 20;
export const CLUSTER_NAME_PREFIX = 'BrowserUp';
export const CLUSTER_NAME_REMOTE_PREFIX = CLUSTER_NAME_PREFIX;
export const CLUSTER_NAME_LOCAL_PREFIX = `${CLUSTER_NAME_PREFIX}Local`;
export const BROWSERUP_DEFAULT_IMAGE = "browserup/standard:release-1.4.7";
