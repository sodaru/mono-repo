import { existsSync } from "fs";
import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import { join } from "path";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { gitRunner } from "../gitRunner";
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

  if (existsSync(join(dir, ".git"))) {
    await taskRunner(
      `stage changes to git`,
      gitRunner,
      options.verbose,
      dir,
      "add",
      ["-A"],
      options.verbose
    );
  }
};

const versionCommand = new Command("version");
versionCommand.action(versionAction);
addPackageFiltersOption(versionCommand);

export default versionCommand;
