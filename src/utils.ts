import { logInfo } from "nodejs-cli-runner";
import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { Node } from "graph-dsa";
import { existsSync } from "fs";
import { lstat, mkdir, stat, symlink, unlink } from "fs/promises";
import { dirname, join } from "path";
import { sync as rimrafSync } from "rimraf";
import {
  DependencyType,
  InstallSaveType,
  Package,
  RootPackageJson
} from "./types";

export default class ErrorSet extends Error {
  private _errors: Error[] = [];
  constructor(errors: Error[]) {
    super(errors.map(e => e.message).join("\n"));

    this._errors = errors;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get errors(): Error[] {
    return [...this._errors];
  }
}

export const dependencyTypes: DependencyType[] = ["dep", "dev", "peer"];
export const dependencyTypeToPackageJsonKey: Record<DependencyType, string> = {
  dep: "dependencies",
  dev: "devDependencies",
  peer: "peerDependencies"
};

export const saveTypeToDependencyType: Record<InstallSaveType, DependencyType> =
  {
    save: "dep",
    "save-dev": "dev",
    "save-peer": "peer"
  };

export const link = async (src: string, dest: string): Promise<void> => {
  const srcStat = await stat(src);
  if (!srcStat.isDirectory()) {
    throw new Error(`'${src}' is not a directory`);
  }

  try {
    const stats = await lstat(dest); // throws error if there is no symlink at destination
    if (stats.isSymbolicLink() || stats.isFile()) {
      await unlink(dest); // delete link or file at destination
    } else if (stats.isDirectory()) {
      rimrafSync(dest); // delete directory at destination
    }
  } catch (e) {
    // dont do anything
  }
  const destDir = dirname(dest);
  await mkdir(destDir, { recursive: true });
  await symlink(src, dest, "junction");
};

export const getAllLocalDependencies = (pkg: Package): string[] => {
  return Object.keys({
    ...pkg.dependencies.local.dep,
    ...pkg.dependencies.local.dev,
    ...pkg.dependencies.local.peer
  });
};

export const packagesToNodes = (packages: Package[]): Node[] => {
  return packages.map(
    pkg =>
      ({
        name: pkg.name,
        children: getAllLocalDependencies(pkg)
      } as Node)
  );
};

export const cleanLocalDependenciesFromPackageJson = async (
  dir: string,
  pkg: Package
) => {
  const packageJsonPath = join(dir, pkg.dirName, "package.json");
  const packageJson = await readJsonFileStore(packageJsonPath);

  dependencyTypes.forEach(type => {
    const localDependencies = pkg.dependencies.local[type];
    const dependencyKey = dependencyTypeToPackageJsonKey[type];
    if (localDependencies && packageJson[dependencyKey]) {
      Object.keys(localDependencies).forEach(dependency => {
        delete packageJson[dependencyKey][dependency];
      });
    }
  });

  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};

export const insertLocalDependenciesToPackageJson = async (
  dir: string,
  pkg: Package
) => {
  const packageJsonPath = join(dir, pkg.dirName, "package.json");
  const packageJson = await readJsonFileStore(packageJsonPath, true);

  dependencyTypes.forEach(type => {
    const localDependencies = pkg.dependencies.local[type];
    const dependencyKey = dependencyTypeToPackageJsonKey[type];
    if (localDependencies) {
      if (!packageJson[dependencyKey]) {
        packageJson[dependencyKey] = {};
      }
      packageJson[dependencyKey] = {
        ...(packageJson[dependencyKey] as Record<string, string>),
        ...localDependencies
      };
    }
  });

  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};

export const filterPackages = (
  packages: Package[],
  packageFilters?: string[]
): Package[] => {
  return packageFilters && packageFilters.length > 0
    ? packages.filter(pkg => packageFilters.includes(pkg.name))
    : packages;
};

export const handleErrorInSettledPromises = (
  settled: PromiseSettledResult<unknown>[]
): void => {
  const failures = settled.filter(
    r => r.status == "rejected"
  ) as PromiseRejectedResult[];
  if (failures.length > 0) {
    throw new ErrorSet(failures.map(f => f.reason));
  }
};

export const infoLog = (
  packageName: string,
  action: string,
  message: string
) => {
  logInfo(`[${packageName}] ${action}: ${message}`);
};

export const readRootPackageJson = async (dir: string) => {
  return (await readJsonFileStore(
    join(dir, "package.json")
  )) as RootPackageJson;
};

export const getPackagesDir = async (
  dir: string,
  packageJson: RootPackageJson
): Promise<string> => {
  const defaultPackagesDir = "packages";
  const _packagesDir = packageJson.packagesDir || defaultPackagesDir;
  const packagesDir = join(dir, _packagesDir);
  if (!existsSync(packagesDir)) {
    await mkdir(packagesDir, { recursive: true });
  }
  return packagesDir;
};
