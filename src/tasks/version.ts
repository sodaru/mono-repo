import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { Package, PackageJson } from "../types";
import {
  dependencyTypes,
  dependencyTypeToPackageJsonKey,
  handleErrorInSettledPromises,
  infoLog
} from "../utils";

export const version = async (
  dir: string,
  newVersion: string,
  packages: Package[]
) => {
  const result = await Promise.allSettled(
    packages.map(async pkg => {
      infoLog(pkg.name, "Versioning", newVersion);

      const packageDir = join(dir, pkg.dirName);
      const packageJsonPath = join(packageDir, "package.json");
      const packageJson = (await readJsonFileStore(
        packageJsonPath
      )) as PackageJson;

      packageJson.version = newVersion;
      dependencyTypes.forEach(type => {
        const localDependencies = pkg.dependencies.local[type];
        if (localDependencies) {
          Object.keys(localDependencies).forEach(localDependency => {
            localDependencies[localDependency] = `^${newVersion}`;
            packageJson[dependencyTypeToPackageJsonKey[type]][
              localDependency
            ] = `^${newVersion}`;
          });
        }
      });

      updateJsonFileStore(packageJsonPath, packageJson);
      await saveJsonFileStore(packageJsonPath);

      // update package-lock.json
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
    })
  );

  handleErrorInSettledPromises(result);
};
