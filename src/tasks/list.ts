import { readdir } from "fs/promises";
import { Dependencies, DependencyType, Package, PackageJson } from "../types";
import { readJsonFileStore } from "nodejs-file-utils";
import { join } from "path";
import { dependencyTypes, dependencyTypeToPackageJsonKey } from "../utils";

const updateLocalDependencies = (packages: Package[]): Package[] => {
  const packageNames = packages.map(p => p.name);

  const splitDependencies = (_package: Package, type: DependencyType): void => {
    const localDependencies: Dependencies = {};
    const externalDependencies: Dependencies = {};
    const deps = _package.dependencies.external[type];
    Object.keys(deps).forEach(depName => {
      if (packageNames.includes(depName)) {
        localDependencies[depName] = deps[depName];
      } else {
        externalDependencies[depName] = deps[depName];
      }
    });

    if (Object.keys(localDependencies).length > 0) {
      _package.dependencies.local[type] = localDependencies;
    } else {
      delete _package.dependencies.local[type];
    }

    if (Object.keys(externalDependencies).length > 0) {
      _package.dependencies.external[type] = externalDependencies;
    } else {
      delete _package.dependencies.external[type];
    }
  };

  packages.forEach(_package => {
    dependencyTypes.forEach(type => {
      if (_package.dependencies.external[type]) {
        splitDependencies(_package, type);
      }
    });
  });

  return packages;
};

export const list = async (dir: string): Promise<Package[]> => {
  const packageDirNames = await readdir(dir);
  const packages = await Promise.all(
    packageDirNames.map(async (packageDirName): Promise<Package> => {
      const packageJson = (await readJsonFileStore(
        join(dir, packageDirName, "package.json")
      )) as PackageJson;
      packageDirNames.push(packageJson.name);

      return {
        name: packageJson.name,
        dirName: packageDirName,
        dependencies: {
          local: {},
          external: Object.fromEntries(
            dependencyTypes.map(type => [
              type,
              packageJson[dependencyTypeToPackageJsonKey[type]]
            ])
          )
        }
      };
    })
  );
  updateLocalDependencies(packages);

  return packages;
};
