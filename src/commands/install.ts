import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { install } from "../tasks/install";
import { link } from "../tasks/link";
import { list } from "../tasks/list";
import { InstallSaveType } from "../types";
import { getPackagesDir, readRootPackageJson } from "../utils";

type InstallOptions = CommonOptions &
  PackageFiltersOption & {
    save?: boolean;
    saveDev?: boolean;
    savePeer?: boolean;
    dependencies?: string[];
  };

const defaultOptions: InstallOptions = {
  verbose: false,
  packages: [],
  save: false,
  saveDev: false,
  savePeer: false,
  dependencies: []
};

const installAction = async (options: InstallOptions) => {
  const dir = process.cwd();
  const _options = { ...defaultOptions, ...options };
  const saveOptions: InstallSaveType[] = [];
  if (_options.save) {
    saveOptions.push("save");
  }
  if (_options.saveDev) {
    saveOptions.push("save-dev");
  }
  if (_options.savePeer) {
    saveOptions.push("save-peer");
  }
  if (saveOptions.length > 1) {
    throw new Error(
      `Choose only one option among (--save, --save-dev, --save-peer)`
    );
  }
  if (saveOptions.length == 0) {
    saveOptions.push("save");
  }
  const saveType = saveOptions[0];

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  const packages = await taskRunner(
    `load local packages`,
    list,
    _options.verbose,
    packagesDir
  );

  await taskRunner(
    `install packages`,
    install,
    _options.verbose,
    packagesDir,
    rootPackageJson.version,
    packages,
    _options.dependencies,
    saveType,
    _options.packages,
    _options.verbose
  );

  await taskRunner(
    `Symlink local dependencies`,
    link,
    _options.verbose,
    packagesDir,
    packages
  );
};

const installCommand = new Command("install");
installCommand.action(installAction);
addPackageFiltersOption(installCommand);
installCommand.option("--save", "Save to dependencies");
installCommand.option("--save-dev", "Save to devDependencies");
installCommand.option("--save-peer", "Save to peerDependencies");
installCommand.option(
  "-d, --dependencies <dependencies...>",
  "Dependencies to be installed"
);

export default installCommand;
