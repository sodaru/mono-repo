import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import { create } from "../tasks/create";
import { initPackageJson } from "../tasks/initPackageJson";
import { getPackagesDir, readRootPackageJson } from "../utils";

const createAction = async (packageDirName: string, options: CommonOptions) => {
  const dir = process.cwd();

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  await taskRunner(
    `initialize package.json`,
    initPackageJson,
    options.verbose,
    dir,
    packagesDir,
    packageDirName
  );

  await taskRunner(
    `create package`,
    create,
    options.verbose,
    packagesDir,
    packageDirName
  );
};

const createCommand = new Command("create");
createCommand.argument("<package-dir-name>", "Package directory name");
createCommand.action(createAction);

export default createCommand;
