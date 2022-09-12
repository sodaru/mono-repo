import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { list } from "../tasks/list";
import { run } from "../tasks/run";
import { sort } from "../tasks/sort";
import { getPackagesDir, readRootPackageJson } from "../utils";

type RunOptions = CommonOptions & PackageFiltersOption;

const runAction = async (
  script: string,
  scriptArgs: string[],
  options: RunOptions
) => {
  const dir = process.cwd();

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  const packages = await taskRunner(
    `load local packages`,
    list,
    options.verbose,
    packagesDir
  );

  const sortedPackages = await taskRunner(
    `sort local packages`,
    async (...args) => {
      return sort(...args);
    },
    options.verbose,
    packages
  );

  await taskRunner(
    `run script`,
    run,
    options.verbose,
    packagesDir,
    script,
    scriptArgs,
    sortedPackages,
    options.packages,
    options.verbose
  );
};

const runCommand = new Command("run");
runCommand.action(runAction);
addPackageFiltersOption(runCommand);
runCommand.argument("<script>", "npm script to run");
runCommand.argument("[scriptArgs...]", "arguments for npm scripts");

export default runCommand;
