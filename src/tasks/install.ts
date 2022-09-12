import { dfs } from "graph-dsa";
import { join } from "path";
import { npmRunner } from "../npmRunner";
import { InstallSaveType, NpmPackageJob, Package } from "../types";
import {
  cleanLocalDependenciesFromPackageJson,
  filterPackages,
  handleErrorInSettledPromises,
  infoLog,
  insertLocalDependenciesToPackageJson,
  packagesToNodes,
  saveTypeToDependencyType
} from "../utils";
import chalk from "chalk";

export const validateInstall = (
  version: string,
  packages: Package[],
  packagesToBeInstalled: string[],
  saveType: InstallSaveType,
  packageFilters: string[]
): NpmPackageJob[] => {
  const npmJobs: NpmPackageJob[] = [];

  const filteredPackages = filterPackages(packages, packageFilters);
  if (packagesToBeInstalled.length == 0) {
    filteredPackages.forEach(pkg => {
      npmJobs.push({
        name: pkg.name,
        cmd: "install",
        args: []
      });
    });
    return npmJobs;
  }

  const allLocalPackageNames = packages.map(p => p.name);

  // split packages to be installed
  const localPackagesToBeInstalled: string[] = [];
  const externalPackagesToBeInstalled = packagesToBeInstalled.filter(pName => {
    if (allLocalPackageNames.includes(pName)) {
      localPackagesToBeInstalled.push(pName);
      return false;
    }
    return true;
  });

  if (localPackagesToBeInstalled.length > 0) {
    const dependencyType = saveTypeToDependencyType[saveType];
    // update local packages in packages list
    filteredPackages.forEach(pkg => {
      pkg.dependencies.local[dependencyType] = {
        ...pkg.dependencies.local[dependencyType],
        ...Object.fromEntries(
          localPackagesToBeInstalled.map(n => [n, `^${version}`])
        )
      };
      if (externalPackagesToBeInstalled.length == 0) {
        // when only local packages are to be installed , add dummy npmJob to ensure that package.json is updated with symlinked dependencies
        npmJobs.push({ name: pkg.name, cmd: "install", args: [] });
      }
    });

    // detect cyclic dependency
    dfs(packagesToNodes(packages));
  }

  if (externalPackagesToBeInstalled.length > 0) {
    filteredPackages.forEach(pkg => {
      npmJobs.push({
        name: pkg.name,
        cmd: "install",
        args: [...externalPackagesToBeInstalled, `--${saveType}`]
      });
    });
  }

  return npmJobs;
};

/**
 * Installs external dependencies to packages,
 * The local dependencies are updated in `packages`
 *
 * `link` task needs to be called on `packages` to symlink the local dependencies
 */
export const install = async (
  dir: string,
  version: string,
  packages: Package[],
  packagesToBeInstalled: string[],
  saveType: InstallSaveType,
  packageFilters: string[],
  verbose: boolean
): Promise<void> => {
  const packageMap = Object.fromEntries(packages.map(p => [p.name, p]));

  const npmJobs = validateInstall(
    version,
    packages,
    packagesToBeInstalled,
    saveType,
    packageFilters
  );

  const result = await Promise.allSettled(
    npmJobs.map(async npmJob => {
      const pkg = packageMap[npmJob.name];
      try {
        await cleanLocalDependenciesFromPackageJson(dir, pkg);
        infoLog(
          pkg.name,
          "Installing",
          ["npm", npmJob.cmd, ...npmJob.args].join(" ")
        );

        await npmRunner(
          join(dir, pkg.dirName),
          npmJob.cmd,
          [...npmJob.args, "--foreground-scripts"],
          verbose,
          chalk.cyan.bold("[" + pkg.name + "] ")
        );
      } finally {
        await insertLocalDependenciesToPackageJson(dir, pkg);
      }
    })
  );

  handleErrorInSettledPromises(result);
};
