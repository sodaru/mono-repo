import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import { list } from "../tasks/list";
import { publish } from "../tasks/publish";
import { getPackagesDir, readRootPackageJson } from "../utils";

const publishAction = async (options: CommonOptions) => {
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
    `publish`,
    publish,
    options.verbose,
    packagesDir,
    rootPackageJson.version,
    packages,
    options.verbose
  );
};

const publishCommand = new Command("publish");
publishCommand.action(publishAction);

export default publishCommand;
