import "child_process";
import "fs/promises";
import chalk from "chalk";
import * as AWS from "@aws-sdk/client-cloudformation";
import {decoratedError, ErrorType} from "../../browserup_errors.mjs";

const STACK_CREATE_TIMEOUT_MINUTES = 20;
const STACK_CAPABILITIES = ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"];

const WAIT_FOR_STACK_CREATE = {
    delaySec: 4, retries: 500, maxElapsedTimeSec: 1000,
};

const WAIT_FOR_STACK_UPDATE = {
    delaySec: 4, retries: 500, maxElapsedTimeSec: 1500,
};

const WAIT_FOR_STACK_DESTROY = {
    delaySec: 20, retries: 500, maxElapsedTimeSec: 1000,
};

import "async-await-retry";
import ora from "ora";
import {readFileSync} from "fs";
import path, { join} from "path";
import {execSync} from "child_process";
import {Retry} from "../../utils/retry.mjs";
import {LogSpinner} from "../../utils/log_spinner.mjs";

export class AwsCfClient {

    static async readAwsResource(fileName) {
        const __dirname = path.resolve();
        return readFileSync(join(__dirname, "lib/services/aws/aws-resources", fileName), "utf8");
    }

    static async prepareFailedEventsReport(region, stackId) {
        const cfClient = new AWS.CloudFormation(region);

        const failedEvents = (
            await cfClient.describeStackEvents({StackName: stackId}).promise()
        ).StackEvents.filter((e) => e.ResourceStatus === "CREATE_FAILED");

        return failedEvents.map((fe) => [
            {"Logical Resource ID": fe.LogicalResourceId, Reason: fe.ResourceStatusReason},
        ]);
    }

    // Private methods

    static async applyChangeSet(changeSetName, stackName, region) {
        const cfClient = new AWS.CloudFormation({region});

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

    static async prepareUpdateParams(stackParams, stackToUpdate) {
        const existingParameters = stackToUpdate.parameters.reduce((acc, p) => {
            acc[p.parameterKey] = p.parameterValue;
            return acc;
        }, {});

        const allStackParams = { ...existingParameters, ...stackParams };

        return Object.entries(allStackParams).map(([name, value]) => {
            const isNewValueProvided = Object.hasOwnProperty.call(stackParams, name);
            const param = {
                parameterKey: name,
                usePreviousValue: !isNewValueProvided
            };

            if (isNewValueProvided) {
                param.parameterValue = value;
            }

            return param;
        });
    }

    static async createChangeSet(templateName, changeSetName, region, stackOptions) {
        const template = await this.readAwsResource(templateName)
        const cfClient = new AWS.CloudFormation({region});
        const stackToUpdate = await this.getStackByName(region, stackOptions.name);
        log.info("Preparing changes set...");
        const input = {
            StackName: stackOptions.name,
            TemplateBody: template,
            Parameters: this.prepareUpdateParams(stackOptions.params, stackToUpdate),
            Tags: stackToUpdate.tags,
            ChangeSetName: changeSetName,
            ChangeSetType: 'UPDATE',
            Capabilities: STACK_CAPABILITIES,
        }
        await cfClient.send(new AWS.CreateChangeSetCommand(input))
    }

    static async updateStack(templateName, stackOptions, region, changeSetName, bypassConfirmation) {
        const changes = await this.createChangeSet(templateName, changeSetName, region, stackOptions);
        log.info("The following resources will be replaced: ");
        log.info(changes.map(r => ({
            name: r.ResourceChange.LogicalResourceId,
            type: r.ResourceChange.ResourceType
        })));

        if (!bypassConfirmation) {
            if (!(await this.userConfirmsUpdate())) {
                return;
            }
        }

        log.debug(`Applying changes set: "${changeSetName}" to stack: "${stackOptions.name}"`);
        await this.applyChangeSet(changeSetName, stackOptions.name, region);
        await this.waitForStack({
            stackName: stackOptions.name,
            stackId: (await AwsCfClient.getStackByName(region, stackOptions.name)).StackId
        }, region, WAIT_FOR_STACK_UPDATE);
    }

    static async getAllStacks(region) {
        const cfClient = new AWS.CloudFormation({region});
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
        const stacks = await AwsCfClient.getAllStacks(region);
        const stack = stacks.find(s => s.StackName === stackName);

        if (!stack) {
            throw decoratedError(`Stack not found by name: ${stackName}`);
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

    static async createStack({ templateName, stackOptions, region }) {
        const cfClient = new AWS.CloudFormation({region});

        const stackId = (
            await cfClient
                .createStack({
                    StackName: stackOptions.name,
                    TemplateBody: await AwsCfClient.readAwsResource(templateName),
                    Parameters: Object.entries(stackOptions.params).map(([n, v]) => ({
                        ParameterKey: n,
                        ParameterValue: v,
                    })),
                    Tags: Object.entries(stackOptions.tags).map(([name, value]) => ({Key: name, Value: value})),
                    TimeoutInMinutes: STACK_CREATE_TIMEOUT_MINUTES,
                    OnFailure: "DELETE",
                    Capabilities: STACK_CAPABILITIES,
                    EnableTerminationProtection: false,
                })
        ).StackId;

        return {stackName: stackOptions.name, stackId};
    }

    static async getAllStacks(region) {
        const cfClient = new AWS.CloudFormation({ region: region });

        let stacksResp = await cfClient.send(new AWS.DescribeStacksCommand({}));
        let stacks = stacksResp.Stacks;
        let allStacks = [...stacks];

        while (stacks.length > 0 && stacksResp.NextToken) {
            stacksResp = await cfClient.send(new AWS.DescribeStacksCommand({ NextToken: stacksResp.NextToken }));
            stacks = stacksResp.Stacks;
            allStacks.push(...stacks);
        }

        return allStacks;
    }

    static async waitForStack(stackName, stackId, region, waitStrategy = WAIT_FOR_STACK_CREATE) {
        const cfClient = new AWS.CloudFormation({region});
        let lastStackStatus = "UNKNOWN";
        const logStatus = `Waiting up to ${waitStrategy.maxElapsedTimeSec} seconds for Stack "${stackName}"...`;
        try {
            await Retry.retry({
                waitStrategy: waitStrategy,
                retryableErrorTypes: [ErrorType.STACK_OPERATION_IN_PROGRESS],
                retryFunc: async () => {
                    const stackStats = await AwsCfClient.stackResourcesStats(stackId, region);
                    const inProgressCount = (stackStats["CREATE_IN_PROGRESS"] || 0) + (stackStats["UPDATE_IN_PROGRESS"] || 0);
                    const completeCount = (stackStats["CREATE_COMPLETE"] || 0) + (stackStats["UPDATE_COMPLETE"] || 0);
                    LogSpinner.updateLogSpinner(`${logStatus} (In progress: ${inProgressCount}, Completed: ${completeCount})`)

                    const stacks = (await cfClient.describeStacks({StackName: stackId})).Stacks;

                    if (stacks.length === 0) {
                        throw decoratedError(`No stacks found for stack name: ${stackId} (not created yet?)`);
                    }

                    const stack = stacks[0];
                    lastStackStatus = stack.StackStatus;

                    if (lastStackStatus === "CREATE_COMPLETE" || lastStackStatus === "UPDATE_COMPLETE") {
                        return;
                    }

                    if (lastStackStatus.match(/(fail)|(delete)/i)) {
                        throw decoratedError(`Failed to deploy stack "${stackId}", stack status: "${lastStackStatus}"`);
                    }
                    throw decoratedError({
                        msg: `Stack is not ready yet, status: "${lastStackStatus}"`,
                        type: ErrorType.STACK_OPERATION_IN_PROGRESS
                    });
                }
            });
        } catch (err) {
            if (err.message.startsWith("Stack is not ready yet")) {
                throw decoratedError(`Timed out waiting for stack, status: "${lastStackStatus}"`);
            }
            throw err;
        } finally {
            spinner.stop();
        }

        return (await cfClient.describeStacks({StackName: stackId})).Stacks[0];
    }

    static async stackResourcesStats(stackId, region) {
        const cfClient = new AWS.CloudFormation({region});
        const stackResources = await cfClient.describeStackResources({StackName: stackId});
        const result = stackResources.StackResources.reduce((acc, resource) => {
            acc[resource.ResourceStatus] = (acc[resource.ResourceStatus] || 0) + 1;
            return acc;
        }, {});

        result["ALL"] = stackResources.StackResources.length;
        return result;
    }

    static async waitForStacksToDestroy(region, stacks) {
        const cfClient = new AWS.CloudFormation({region});
        const stackIds = stacks.map(stack => stack.StackId);
        const stackNames = stacks.map(stack => stack.StackName);
        log.info(`Waiting up to ${WAIT_FOR_STACK_DESTROY.maxElapsedTimeSec} seconds until the following stacks are deleted: ${stackNames.join(", ")}`);

        await Retry.retry({
            waitStrategy: WAIT_FOR_STACK_DESTROY,
            retryableErrorTypes: [ErrorType.STACK_OPERATION_IN_PROGRESS],
            retryFunc: async () => {
                const pulledStacks = (await cfClient.send(new AWS.DescribeStacksCommand({}))).Stacks;
                const remainingStacks = pulledStacks.filter(stack => stackIds.includes(stack.StackId));

                if (remainingStacks.length === 0 || remainingStacks.every(stack => stack.StackStatus === "DELETE_COMPLETE")) {
                    return;
                }
                const failedToDeleteStacks = remainingStacks.filter(stack => stack.StackStatus.match(/fail/i));

                if (failedToDeleteStacks.length > 0) {
                    throw decoratedError(`Failed to delete stacks with IDs: ${failedToDeleteStacks.map(stack => stack.StackId).join(",")}`);
                }
                throw decoratedError({
                    msg: "Stack is not deleted yet, it's in progress...",
                    type: ErrorType.STACK_OPERATION_IN_PROGRESS
                });
            }
        })
    }

    static getStackOutputParams(clusterStack, outputParams) {
        return Object.keys(outputParams).reduce((result, paramKey) => {
            const paramValue = clusterStack.Outputs.find((o) => o.OutputKey === outputParams[paramKey]);
            result[paramKey] = paramValue ? paramValue.OutputValue : undefined;
            return result;
        }, {});
    }
}

export default AwsCfClient;
