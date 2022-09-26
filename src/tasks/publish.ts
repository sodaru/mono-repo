import { readJsonFileStore } from "nodejs-file-utils";
import chalk from "chalk";
import { join } from "path";
import { npmRunner } from "../npmRunner";
import { Package, PackageJson } from "../types";
import { infoLog } from "../utils";

export const publish = async (
  dir: string,
  rootVersion: string,
  packages: Package[],
  verbose: boolean
) => {
  for (const pkg of packages) {
    const packageDir = join(dir, pkg.dirName);
    const packageJson = (await readJsonFileStore(
      join(packageDir, "package.json")
    )) as PackageJson;

    if (!packageJson.private && packageJson.version == rootVersion) {
      infoLog(pkg.name, "Publishing", "npm publish");

      await npmRunner(
        join(dir, pkg.dirName),
        "publish",
        ["--foreground-scripts"],
        verbose,
        chalk.magenta.bold("[" + pkg.name + "] ")
      );
    }
  }
};
