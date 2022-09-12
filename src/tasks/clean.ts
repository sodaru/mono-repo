import { join } from "path";
import rimraf from "rimraf";
import { Package } from "../types";
import {
  filterPackages,
  handleErrorInSettledPromises,
  infoLog
} from "../utils";

export const clean = async (
  dir: string,
  packages: Package[],
  packageFilters: string[]
): Promise<void> => {
  const filteredPackages = filterPackages(packages, packageFilters);
  const result = await Promise.allSettled(
    filteredPackages.map(pkg => {
      return new Promise<void>((resolve, reject) => {
        infoLog(pkg.name, "Cleaning", "node_modules");
        rimraf(join(dir, pkg.dirName, "node_modules"), err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    })
  );

  handleErrorInSettledPromises(result);
};
