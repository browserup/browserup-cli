import "fs";
import "aws-sdk";
import "child_process";
import "fs/promises";
import chalk from "chalk";
import "@aws-sdk/client-cloudformation";

const STACK_CREATE_TIMEOUT_MINUTES = 20;
const STACK_CAPABILITIES = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"];

const WAIT_FOR_STACK_CREATE = {
    delaySec: 3, retries: 300, maxElapsedTimeSec: 1000,
};

const WAIT_FOR_STACK_UPDATE = {
    delaySec: 3, retries: 300, maxElapsedTimeSec: 1500,
};

const WAIT_FOR_STACK_DESTROY = {
    delaySec: 20, retries: 30, maxElapsedTimeSec: 1000,
};

import "async-await-retry";
import ora from "ora";

export class AwsCfClient {

    static async runWithRetries(waitStrategy, logStatus = null, retryFunction) {
            let spinner = ora({
                text: logStatus,
                spinner: "dots",
                discardStdin: false
            }).start();

        try {
            await retry(
                async () => {
                    await retryFunction();
                },
                {
                    retries: waitStrategy.retries,
                    factor: 1,
                    minTimeout: waitStrategy.delaySec * 1000,
                    maxTimeout: waitStrategy.maxElapsedTimeSec * 1000,
                }
            );
        } catch (error) {
            throw error;
        }
        finally {
            spinner.stop();
        }
    }

    static readAwsResource(fileName) {
        return readFileSync(join(dirname(__filename), "..", "aws-resources", fileName), "utf8");
    }

    static async prepareFailedEventsReport(region, stackId) {
        const cfClient = new CloudFormation({region});

        const failedEvents = (
            await cfClient.describeStackEvents({StackName: stackId}).promise()
        ).StackEvents.filter((e) => e.ResourceStatus === "CREATE_FAILED");

        return failedEvents.map((fe) => [
            {"Logical Resource ID": fe.LogicalResourceId, Reason: fe.ResourceStatusReason},
        ]);
    }

    // Private methods

    static async applyChangeSet(changeSetName, stackName, region) {
        const cfClient = new CloudFormation({region});

        await cfClient.executeChangeSet({
            ChangeSetName: changeSetName,
            StackName: stackName,
            DisableRollback: false
        }).promise();
    }

    static async userConfirmsUpdate() {
        process.stdout.write("Do you confirm the upgrade? (Y/n)\n");
        const input = execSync("read -n 1 -s user_input && echo $user_input").toString().trim().toLowerCase();

        switch (input) {
            case "":
            case "y":
            case "yes":
                return true;
            case "n":
            case "no":
                return false;
            default:
                log.warn(chalk.yellow("Invalid input. Please enter \"yes\" or \"no\"."));
                return this.userConfirmsUpdate();
        }
    }

    static async updateStack(templateName, stackOptions, region, changeSetName, bypassConfirmation) {
        const changes = await createChangeSet(templateName, changeSetName, region, stackOptions);
        log.info("The following resources will be replaced: ");
        log.info(changes.map(r => ({
            name: r.ResourceChange.LogicalResourceId,
            type: r.ResourceChange.ResourceType
        })));

        if (!bypassConfirmation) {
            if (!await userConfirmsUpdate()) {
                return;
            }
        }

        log.debug(`Applying changes set: "${changeSetName}" to stack: "${stackOptions.name}"`);
        await applyChangeSet(changeSetName, stackOptions.name, region);
        await waitForStack({
            stackName: stackOptions.name,
            stackId: (await getStackByName(region, stackOptions.name)).StackId
        }, region, WAIT_FOR_STACK_UPDATE);
    }

    static async getAllStacks(region) {
        const cfClient = new CloudFormation({region});
        let stacks = [];
        let nextToken;

        do {
            const stacksResp = await cfClient.describeStacks({NextToken: nextToken}).promise();
            stacks.push(...stacksResp.Stacks);
            nextToken = stacksResp.NextToken;
        } while (nextToken);

        return stacks;
    }

    static async getStackByName(region, stackName) {
        const stacks = await getAllStacks(region);
        const stack = stacks.find(s => s.StackName === stackName);

        if (!stack) {
            throw new Error(`Stack not found by name: ${stackName}`);
        }

        return stack;
    }

    static getStacksByTagsFilters(stacks, tagFilters) {
        return stacks.filter(stack =>
            Object.entries(tagFilters).every(([tagFilterKey, tagFilterValue]) =>
                stack.Tags.some(tag => tag.Key === tagFilterKey && (!tagFilterValue || tag.Value === tagFilterValue))
            )
        );
    }


    static async readAwsResource(templateName) {
        try {
            const data = await readFile(templateName, "utf8");
            return data;
        } catch (err) {
            log.error(`Error reading file: ${err}`);
            throw err;
        }
    }

    static async createStack(templateName, stackOptions, region) {
        const cfClient = new CloudFormation({region});

        const stackId = (
            await cfClient
                .createStack({
                    StackName: stackOptions.name,
                    TemplateBody: await readAwsResource(templateName),
                    Parameters: stackOptions.params.map(([n, v]) => ({
                        ParameterKey: n,
                        ParameterValue: v,
                    })),
                    Tags: stackOptions.tags.map(([name, value]) => ({Key: name, Value: value})),
                    TimeoutInMinutes: STACK_CREATE_TIMEOUT_MINUTES,
                    OnFailure: "DELETE",
                    Capabilities: STACK_CAPABILITIES,
                    EnableTerminationProtection: false,
                })
                .promise()
        ).StackId;

        return {stackName: stackOptions.name, stackId};
    }

    // ...

    static async waitForStack({stackName, stackId}, region, waitStrategy = WAIT_FOR_STACK_CREATE) {
        const cfClient = new AWS.CloudFormation({region});
        let lastStackStatus = "UNKNOWN";
        const logStatus = `Waiting up to ${waitStrategy.maxElapsedTimeSec} seconds for Stack "${stackName}"...`;
        const spinner = ora(logStatus).start();

        try {
            await this.runWithRetries(waitStrategy, logStatus, async () => {
                const stackStats = await stackResourcesStats(stackId, region);
                const inProgressCount = (stackStats["CREATE_IN_PROGRESS"] || 0) + (stackStats["UPDATE_IN_PROGRESS"] || 0);
                const completeCount = (stackStats["CREATE_COMPLETE"] || 0) + (stackStats["UPDATE_COMPLETE"] || 0);

                spinner.text = `${logStatus} (In progress: ${inProgressCount}, Completed: ${completeCount})`;

                const stacks = (await cfClient.describeStacks({StackName: stackId}).promise()).Stacks;

                if (stacks.length === 0) {
                    throw new Error(`No stacks found for stack name: ${stackId} (not created yet?)`);
                }

                const stack = stacks[0];
                lastStackStatus = stack.StackStatus;

                if (lastStackStatus === "CREATE_COMPLETE" || lastStackStatus === "UPDATE_COMPLETE") {
                    return;
                }

                if (lastStackStatus.match(/(fail)|(delete)/i)) {
                    throw new Error(`Failed to deploy stack "${stackId}", stack status: "${lastStackStatus}"`);
                }

                throw new Error(`Stack is not ready yet, status: "${lastStackStatus}"`);
            });
        } catch (err) {
            if (err.message.startsWith("Stack is not ready yet")) {
                throw new Error(`Timed out waiting for stack, status: "${lastStackStatus}"`);
            }
            throw err;
        } finally {
            spinner.stop();
        }

        return (await cfClient.describeStacks({StackName: stackId}).promise()).Stacks[0];
    }

    static async stackResourcesStats(stackId, region) {
        const cfClient = new CloudFormation({region});
        const stackResources = await cfClient.describeStackResources({StackName: stackId}).promise();
        const result = stackResources.StackResources.reduce((acc, resource) => {
            acc[resource.ResourceStatus] = (acc[resource.ResourceStatus] || 0) + 1;
            return acc;
        }, {});

        result["ALL"] = stackResources.StackResources.length;
        return result;
    }

// ...

    static async waitForStacksToDestroy(region, stacks) {
        const cfClient = new AWS.CloudFormation({region});
        const stackIds = stacks.map(stack => stack.StackId);
        const stackNames = stacks.map(stack => stack.StackName);
        const logStatus = `Waiting up to ${WAIT_FOR_STACK_DESTROY.maxElapsedTimeSec} seconds until the following stacks are deleted: ${stackNames.join(", ")}`;

        await this.runWithRetries(WAIT_FOR_STACK_DESTROY, logStatus, async () => {
            const pulledStacks = (await cfClient.describeStacks().promise()).Stacks;
            const remainingStacks = pulledStacks.filter(stack => stackIds.includes(stack.StackId));

            if (remainingStacks.length === 0 || remainingStacks.every(stack => stack.StackStatus === "DELETE_COMPLETE")) {
                return;
            }

            const failedToDeleteStacks = remainingStacks.filter(stack => stack.StackStatus.match(/fail/i));

            if (failedToDeleteStacks.length > 0) {
                throw new Error(`Failed to delete stacks with IDs: ${failedToDeleteStacks.map(stack => stack.StackId).join(",")}`);
            }

            throw new Error("Stack is not deleted yet, it's in progress...");
        });
    }

}

export default AwsCfClient;
