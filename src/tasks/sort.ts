import { Package } from "../types";
import { dfs } from "graph-dsa";
import { packagesToNodes } from "../utils";

export const sort = (
  packages: Package[],
  order: "dependenciesFirst" | "dependentsFirst" = "dependenciesFirst"
): Package[] => {
  const nodes = packagesToNodes(packages);

  const sortedNodes = dfs(nodes);
  if (order == "dependentsFirst") {
    sortedNodes.reverse();
  }

  const packageMap = Object.fromEntries(
    packages.map(_package => [_package.name, _package])
  );

  return sortedNodes.map(node => packageMap[node.name]);
};
