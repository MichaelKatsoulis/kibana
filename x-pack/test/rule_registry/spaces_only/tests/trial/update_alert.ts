/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import expect from '@kbn/expect';

import { superUser } from '../../../common/lib/authentication/users';
import type { User } from '../../../common/lib/authentication/types';
import { FtrProviderContext } from '../../../common/ftr_provider_context';
import { getSpaceUrlPrefix } from '../../../common/lib/authentication/spaces';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const esArchiver = getService('esArchiver');

  const TEST_URL = '/internal/rac/alerts';
  const ALERTS_INDEX_URL = `${TEST_URL}/index`;
  const SPACE1 = 'space1';
  const SPACE2 = 'space2';
  const APM_ALERT_ID = 'NoxgpHkBqbdrfX07MqXV';
  const APM_ALERT_INDEX = '.alerts-observability.apm.alerts';
  const SECURITY_SOLUTION_ALERT_INDEX = '.alerts-security.alerts';
  const ALERT_VERSION = Buffer.from(JSON.stringify([0, 1]), 'utf8').toString('base64'); // required for optimistic concurrency control

  const getAPMIndexName = async (user: User) => {
    const {
      body: indexNames,
    }: { body: { index_name: string[] | undefined } } = await supertestWithoutAuth
      .get(`${getSpaceUrlPrefix(SPACE1)}${ALERTS_INDEX_URL}`)
      .set('kbn-xsrf', 'true')
      .expect(200);
    const observabilityIndex = indexNames?.index_name?.find(
      (indexName) => indexName === APM_ALERT_INDEX
    );
    expect(observabilityIndex).to.eql(APM_ALERT_INDEX); // assert this here so we can use constants in the dynamically-defined test cases below
  };

  const getSecuritySolutionIndexName = async (user: User) => {
    const {
      body: indexNames,
    }: { body: { index_name: string[] | undefined } } = await supertestWithoutAuth
      .get(`${getSpaceUrlPrefix(SPACE1)}${ALERTS_INDEX_URL}`)
      .set('kbn-xsrf', 'true')
      .expect(200);
    const securitySolution = indexNames?.index_name?.find((indexName) =>
      indexName.startsWith(SECURITY_SOLUTION_ALERT_INDEX)
    );
    expect(securitySolution).to.eql(`${SECURITY_SOLUTION_ALERT_INDEX}-${SPACE1}`); // assert this here so we can use constants in the dynamically-defined test cases below
  };

  describe('Alert - Update - RBAC - spaces', () => {
    before(async () => {
      await getSecuritySolutionIndexName(superUser);
      await getAPMIndexName(superUser);
    });

    before(async () => {
      await esArchiver.load('x-pack/test/functional/es_archives/rule_registry/alerts');
    });

    after(async () => {
      await esArchiver.unload('x-pack/test/functional/es_archives/rule_registry/alerts');
    });

    it('should return a 404 when superuser accesses not-existent alert', async () => {
      await supertestWithoutAuth
        .post(`${getSpaceUrlPrefix()}${TEST_URL}`)
        .set('kbn-xsrf', 'true')
        .send({
          ids: ['this id does not exist'],
          status: 'closed',
          index: APM_ALERT_INDEX,
          _version: Buffer.from(JSON.stringify([0, 1]), 'utf8').toString('base64'),
        })
        .expect(404);
    });

    it('should return a 404 when superuser accesses not-existent alerts as data index', async () => {
      await supertestWithoutAuth
        .post(`${getSpaceUrlPrefix()}${TEST_URL}`)
        .set('kbn-xsrf', 'true')
        .send({
          ids: [APM_ALERT_ID],
          status: 'closed',
          index: 'this index does not exist',
          _version: Buffer.from(JSON.stringify([0, 1]), 'utf8').toString('base64'),
        })
        .expect(404);
    });

    it(`${superUser.username} should be able to update alert ${APM_ALERT_ID} in ${SPACE2}/${APM_ALERT_INDEX}`, async () => {
      await esArchiver.load('x-pack/test/functional/es_archives/rule_registry/alerts'); // since this is a success case, reload the test data immediately beforehand
      await supertestWithoutAuth
        .post(`${getSpaceUrlPrefix(SPACE2)}${TEST_URL}`)
        .set('kbn-xsrf', 'true')
        .send({
          ids: [APM_ALERT_ID],
          status: 'closed',
          index: APM_ALERT_INDEX,
          _version: ALERT_VERSION,
        })
        .expect(200);
    });
  });
};
