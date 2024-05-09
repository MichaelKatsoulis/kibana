/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { IRouter, Logger } from '@kbn/core/server';
import { RuleRegistryPluginStartContract } from '@kbn/rule-registry-plugin/server';
import { registerPodsRoute } from './pods';
import { registerDeploymentsRoute } from './deployments';
import { registerDaemonsetsRoute } from './daemonsets';
import { registerEventsRoute } from './events';


export const registerRoutes = (
  router: IRouter,
  logger: Logger,
  ruleRegistry: RuleRegistryPluginStartContract
) => {
  registerPodsRoute(router, logger);
  registerDeploymentsRoute(router, logger);
  registerDaemonsetsRoute(router, logger);
  registerEventsRoute(router, logger);
};
