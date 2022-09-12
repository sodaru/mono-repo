import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import { list } from "../tasks/list";
import { version } from "../tasks/version";
import { getPackagesDir, readRootPackageJson } from "../utils";

const versionAction = async (options: CommonOptions) => {
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
    packages
  );
};

const versionCommand = new Command("version");
versionCommand.action(versionAction);

export default versionCommand;
