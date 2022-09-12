import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { clean } from "../tasks/clean";
import { list } from "../tasks/list";
import { getPackagesDir, readRootPackageJson } from "../utils";

type CleanOptions = CommonOptions & PackageFiltersOption;

const defaultOptions: CleanOptions = {
  verbose: false,
  packages: []
};

const cleanAction = async (options: CleanOptions) => {
  const dir = process.cwd();
  const _options = { ...defaultOptions, ...options };

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  const packages = await taskRunner(
    `load local packages`,
    list,
    _options.verbose,
    packagesDir
  );

  await taskRunner(
    `clean packages`,
    clean,
    _options.verbose,
    packagesDir,
    packages,
    _options.packages
  );
};

const cleanCommand = new Command("clean");
cleanCommand.action(cleanAction);
addPackageFiltersOption(cleanCommand);

export default cleanCommand;
