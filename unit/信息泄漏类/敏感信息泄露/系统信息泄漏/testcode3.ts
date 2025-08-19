import { useEnv } from '@directus/env';
import formatTitle from '@directus/format-title';
import { spec } from '@directus/specs';
import { isSystemCollection } from '@directus/system-data';
import type { Accountability, FieldOverview, Permission, SchemaOverview, Type } from '@directus/types';
import type { Knex } from 'knex';
import { version } from 'directus/version';
import { cloneDeep, mergeWith } from 'lodash-es';
import type {
	OpenAPIObject,
	ParameterObject,
	PathItemObject,
	ReferenceObject,
	SchemaObject,
	TagObject,
} from 'openapi3-ts/oas30';
import { OAS_REQUIRED_SCHEMAS } from '../constants.js';
import getDatabase from '../database/index.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { fetchAllowedFieldMap } from '../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import type { AbstractServiceOptions } from '../types/index.js';
import { getRelationType } from '../utils/get-relation-type.js';
import { reduceSchema } from '../utils/reduce-schema.js';
import { GraphQLService } from './graphql/index.js';

const env = useEnv();

export class SpecificationService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	oas: OASSpecsService;
	graphql: GraphQLSpecsService;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || getDatabase();
		this.schema = options.schema;

		this.oas = new OASSpecsService(options);
		this.graphql = new GraphQLSpecsService(options);
	}
}

interface SpecificationSubService {
	generate: (_?: any) => Promise<any>;
}

class OASSpecsService implements SpecificationSubService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || getDatabase();

		this.schema = options.schema;
	}

	async generate(host?: string) {
		let schemaForSpec = this.schema;
		let permissions: Permission[] = [];

		if (this.accountability && this.accountability.admin !== true) {
			const allowedFields = await fetchAllowedFieldMap(
				{
					accountability: this.accountability,
					action: 'read',
				},
				{ schema: this.schema, knex: this.knex },
			);

			schemaForSpec = reduceSchema(this.schema, allowedFields);

			const policies = await fetchPolicies(this.accountability, { schema: this.schema, knex: this.knex });

			permissions = await fetchPermissions(
				{ policies, accountability: this.accountability },
				{ schema: this.schema, knex: this.knex },
			);
		}

		const tags = await this.generateTags(schemaForSpec);
		const paths = await this.generatePaths(schemaForSpec, permissions, tags);
		const components = await this.generateComponents(schemaForSpec, tags);

		const isDefaultPublicUrl = env['PUBLIC_URL'] === '/';
		const url = isDefaultPublicUrl && host ? host : (env['PUBLIC_URL'] as string);

		const spec: OpenAPIObject = {
			openapi: '3.0.1',
			info: {
				title: 'Dynamic API Specification',
				description:
					'This is a dynamically generated API specification for all endpoints existing on the current project.',
				version: version, //here CVE-2025-53887
			},
			servers: [
				{
					url,
					description: 'Your current Directus instance.',
				},
			],
			paths,
		};

		if (tags) spec.tags = tags;
		if (components) spec.components = components;

		return spec;
	}

	
}
/*
@directus/api is a real-time API and App dashboard for managing SQL database content

Affected versions of this package are vulnerable to Exposure of Sensitive System Information to an Unauthorized Control Sphere via the endpoint. An attacker can disclose the exact version number without authentication and identify known weaknesses in the core or dependencies by querying this endpoint./server/specs/oas
*/