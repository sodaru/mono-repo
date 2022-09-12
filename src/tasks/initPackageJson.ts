import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { mkdir } from "fs/promises";
import { join, relative } from "path";
import { PackageJson } from "../types";
import { readRootPackageJson } from "../utils";

export const initPackageJson = async (
  dir: string,
  packagesDir: string,
  packageDirName: string
): Promise<void> => {
  const rootPackageJson = await readRootPackageJson(dir);
  const packageDir = join(packagesDir, packageDirName);
  const packageJsonPath = join(packageDir, "package.json");
  let packageJson: PackageJson = { name: packageDirName, version: "" };
  try {
    packageJson = (await readJsonFileStore(packageJsonPath)) as PackageJson;
  } catch (e) {
    // dont do anything
  }

  const { version, author, bugs, homepage, license, repository } =
    rootPackageJson;

  packageJson.version = version;
  packageJson.description = ""; // place holders
  packageJson.main = "index.js"; // place holders
  if (homepage?.length > 0) {
    const packageRelativePath = relative(dir, packageDir).replaceAll("\\", "/");
    const homepageUrl = new URL(homepage);
    homepageUrl.pathname += "/" + packageRelativePath;
    packageJson.homepage = homepageUrl.toString();
  }
  packageJson.author = author;
  packageJson.bugs = bugs;
  packageJson.license = license;
  packageJson.repository = repository;

  updateJsonFileStore(packageJsonPath, packageJson);
  await mkdir(packageDir, { recursive: true });
  await saveJsonFileStore(packageJsonPath);
};
