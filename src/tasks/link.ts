import { join } from "path";
import { Package } from "../types";
import { getAllLocalDependencies, link as linkUtil } from "../utils";

export const link = async (dir: string, packages: Package[]): Promise<void> => {
  const packageMap = Object.fromEntries(packages.map(pkg => [pkg.name, pkg]));

  await Promise.all(
    packages.map(async _package => {
      const localDependencies = getAllLocalDependencies(_package);
      await Promise.all(
        localDependencies.map(async dependency => {
          const srcPath = join(dir, packageMap[dependency].dirName);
          const destPath = join(
            dir,
            packageMap[_package.name].dirName,
            "node_modules",
            dependency
          );
          await linkUtil(srcPath, destPath);
        })
      );
    })
  );
};
