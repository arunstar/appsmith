import { ENTITY_TYPE } from "design-system-old";
import type { DataTree, ConfigTree } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { PluginType } from "entities/Action";

const dataTree: DataTree = {
  action1: {
    actionId: "123",
    data: {},
    config: {},
    datasourceUrl: "",
    isLoading: false,
    run: {},
    clear: {},
    responseMeta: { isExecutionSuccess: false },
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
  },
};

const configTree: ConfigTree = {
  action1: {
    pluginId: "",
    actionId: "123",
    pluginType: PluginType.API,
    dynamicBindingPathList: [],
    name: "action1",
    bindingPaths: {},
    reactivePaths: {},
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    dependencyMap: {},
    logBlackList: {},
  },
};

export const evalContext = createEvaluationContext({
  dataTree,
  configTree,
  resolvedFunctions: {},
  isTriggerBased: true,
  context: {},
});
