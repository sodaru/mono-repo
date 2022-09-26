import max from "lodash/max";
import { DependencyType, Package } from "../types";
import { dependencyTypes, filterPackages } from "../utils";

export const doesVersionsMatch = async (
  packages: Package[],
  packageFilters: string[],
  skip: string[]
): Promise<void> => {
  const dependentsMap: Record<
    string,
    { dependentName: string; type: DependencyType; version: string }[]
  > = {};

  const filteredPackages = filterPackages(packages, packageFilters);

  for (const pkg of filteredPackages) {
    const external = pkg.dependencies.external;
    for (const type of dependencyTypes) {
      for (const dependencyName in external[type] || {}) {
        if (!skip.includes(dependencyName)) {
          if (!dependentsMap[dependencyName]) {
            dependentsMap[dependencyName] = [];
          }
          dependentsMap[dependencyName].push({
            dependentName: pkg.name,
            type,
            version: external[type][dependencyName]
          });
        }
      }
    }
  }

  for (const dependencyName in dependentsMap) {
    const allVersions = dependentsMap[dependencyName].map(d => d.version);
    const versionsSet = new Set(allVersions);
    if (versionsSet.size > 1) {
      const maxVersionLength = max(Array.from(versionsSet).map(v => v.length));
      throw new Error(
        `${dependencyName} has conflicting versions at\n${dependentsMap[
          dependencyName
        ]
          .map(
            d =>
              `${d.version.padEnd(maxVersionLength)} - ${d.type.padEnd(4)} - ${
                d.dependentName
              }`
          )
          .join("\n")}`
      );
    }
  }
};
