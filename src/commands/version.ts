import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { list } from "../tasks/list";
import { version } from "../tasks/version";
import { getPackagesDir, readRootPackageJson } from "../utils";

type VersionOptions = CommonOptions & PackageFiltersOption;

const versionAction = async (options: VersionOptions) => {
  const dir = process.cwd();

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  const packages = await taskRunner(
    `load local packages`,
    list,
    options.verbose,
    packagesDir
  );

  await taskRunner(
    `bump version`,
    version,
    options.verbose,
    packagesDir,
    rootPackageJson.version,
    packages,
    options.packages
  );
};

const versionCommand = new Command("version");
versionCommand.action(versionAction);
addPackageFiltersOption(versionCommand);

export default versionCommand;
