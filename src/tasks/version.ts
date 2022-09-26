import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { Package, PackageJson } from "../types";
import {
  dependencyTypeToPackageJsonKey,
  filterPackages,
  handleErrorInSettledPromises,
  infoLog
} from "../utils";

export const version = async (
  dir: string,
  newVersion: string,
  packages: Package[],
  packageFilters: string[]
) => {
  const filteredPackages = filterPackages(packages, packageFilters);
  const filteredPackageNames = filteredPackages.map(p => p.name);

  const packageMap = Object.fromEntries(packages.map(p => [p.name, p]));

  filteredPackageNames.forEach(packageName => {
    packageMap[packageName].version = newVersion;
  });

  packages.forEach(pkg => {
    Object.keys(pkg.dependencies.local).forEach(depType => {
      Object.keys(pkg.dependencies.local[depType]).forEach(depPackageName => {
        pkg.dependencies.local[depType][
          depPackageName
        ] = `^${packageMap[depPackageName].version}`;
      });
    });
  });

  const result = await Promise.allSettled(
    packages.map(async pkg => {
      if (pkg.version == newVersion) {
        infoLog(pkg.name, "Versioning", newVersion);
      }
      const packageDir = join(dir, pkg.dirName);
      const packageJsonPath = join(packageDir, "package.json");
      const packageJson = (await readJsonFileStore(
        packageJsonPath
      )) as PackageJson;

      packageJson.version = pkg.version;

      Object.keys(pkg.dependencies.local).forEach(depType => {
        const packageJsonDepKey = dependencyTypeToPackageJsonKey[depType];
        if (packageJson[packageJsonDepKey] === undefined) {
          packageJson[packageJsonDepKey] = {};
        }
        Object.keys(pkg.dependencies.local[depType]).forEach(localDep => {
          packageJson[packageJsonDepKey][localDep] =
            pkg.dependencies.local[depType][localDep];
        });
      });

      updateJsonFileStore(packageJsonPath, packageJson);
      await saveJsonFileStore(packageJsonPath);

      // update package-lock.json
      if (filteredPackageNames.includes(pkg.name)) {
        try {
          const packageLockJsonPath = join(packageDir, "package-lock.json");
          const packageLockJson = (await readJsonFileStore(
            packageLockJsonPath
          )) as Record<string, unknown>;
          packageLockJson.version = newVersion;
          if (packageLockJson.packages && packageLockJson.packages[""]) {
            packageLockJson.packages[""].version = newVersion;
          }
          updateJsonFileStore(packageLockJsonPath, packageLockJson);
          await saveJsonFileStore(packageLockJsonPath);
        } catch (e) {
          // dont do anything
        }
      }
    })
  );

  handleErrorInSettledPromises(result);
};
