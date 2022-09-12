import { readJsonFileStore } from "nodejs-file-utils";
import chalk from "chalk";
import { join } from "path";
import { npmRunner } from "../npmRunner";
import { Package, PackageJson } from "../types";
import { filterPackages, infoLog } from "../utils";

export const run = async (
  dir: string,
  script: string,
  scriptArgs: string[],
  packages: Package[],
  packageFilters: string[],
  verbose: boolean
) => {
  const filteredPackages = filterPackages(packages, packageFilters);
  const _scriptArgs = [...scriptArgs];
  if (_scriptArgs.length > 0) {
    _scriptArgs.unshift("--");
  }

  for (const pkg of filteredPackages) {
    const packageDir = join(dir, pkg.dirName);
    const packageJson = (await readJsonFileStore(
      join(packageDir, "package.json")
    )) as PackageJson;

    if (packageJson.scripts && packageJson.scripts[script]) {
      infoLog(
        pkg.name,
        "Running",
        ["npm", "run", script, ..._scriptArgs].join(" ")
      );

      await npmRunner(
        join(dir, pkg.dirName),
        "run",
        [script, "--foreground-scripts", ..._scriptArgs],
        verbose,
        chalk.green.bold("[" + pkg.name + "] ")
      );
    }
  }
};
