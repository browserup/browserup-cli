import fs from 'fs';
import fse from 'fs-extra';
import ejs from 'ejs';
import path from 'path';

export class Generator {
    static BROWSERUP_CACHED_STORAGE_ROOT_DIR_NAME = ".browserup";

    // Generate a docker-compose.yml for a scenario
    static async generate(scenario_id, config) {
        const scn = config.scenario(scenario_id);
        log.debug(`Generator.generate(scn=${scn['id']})`);

        const output_path = this.dockerComposeYmlPath(scn);

        const docker_compose_scenario_template_path = path.join(__dirname, './docker-compose-scenario.ejs');
        const template = await fs.promises.readFile(docker_compose_scenario_template_path, 'utf8');
        const rendered_scenario_template = ejs.render(template, {
            open_local_ports: OPEN_LOCAL_PORTS,
            browserup_rails_local_mount_path: BROWSERUP_RAILS_LOCAL_MOUNT_PATH,
            browserup_rails_env: BROWSERUP_RAILS_ENV,
            chronograf: CHRONOGRAF,
            browserup_grid_api_debug: BROWSERUP_GRID_API_DEBUG,
            browserup_grid_api_debug_port: BROWSERUP_GRID_API_DEBUG_PORT,
            browserup_grid_api_debug_suspend: BROWSERUP_GRID_API_DEBUG_SUSPEND,
            browserup_minion_debug: BROWSERUP_MINION_DEBUG,
            browserup_minion_debug_port: BROWSERUP_MINION_DEBUG_PORT,
            browserup_minion_debug_suspend: BROWSERUP_MINION_DEBUG_SUSPEND,
            browserup_grid_coordinator_debug: BROWSERUP_GRID_COORDINATOR_DEBUG,
            browserup_grid_coordinator_debug_port: BROWSERUP_GRID_COORDINATOR_DEBUG_PORT,
            browserup_grid_coordinator_debug_suspend: BROWSERUP_GRID_COORDINATOR_DEBUG_SUSPEND
        });

        log.debug(`Rendering ${output_path}:\n>>>>${rendered_scenario_template}\n<<<<`);
        await fs.promises.writeFile(output_path, rendered_scenario_template);
        return output_path;
    }

    static cachedStorage(scn) {
        const cached_storage = path.join(
            scn['root_dir'],
            this.BROWSERUP_CACHED_STORAGE_ROOT_DIR_NAME,
            'scenarios',
            scn['id'],
            'bu'
        );

        fse.ensureDirSync(cached_storage);
        return path.resolve(cached_storage);
    }

    static dockerComposeYmlPath(scn) {
        const dest_dir = this.cachedStorage(scn);
        return path.join(dest_dir, 'docker-compose.yml');
    }
}
