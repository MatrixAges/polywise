import { app } from '../consts'

const createEnableRlsSql = (schema_name: string, table_name: string) =>
	`ALTER TABLE ${schema_name}.${table_name} ENABLE ROW LEVEL SECURITY;`

const createScopePredicateSql = (alias_name?: string) => {
	const prefix_text = alias_name ? `${alias_name}.` : ''
	return `
    ${prefix_text}idol_id = current_setting('app.idol_id', true)
    AND ${prefix_text}project_id = current_setting('app.project_id', true)
    AND (
      current_setting('app.workspace_id', true) IS NULL
      OR current_setting('app.workspace_id', true) = ''
      OR ${prefix_text}workspace_id = current_setting('app.workspace_id', true)
    )
  `
}

const createPolicyIfMissingSql = (params: {
	policy_name: string
	schema_name: string
	table_name: string
	using_sql: string
	with_check_sql: string
}) => {
	const { policy_name, schema_name, table_name, using_sql, with_check_sql } = params

	return `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = '${policy_name}'
      AND n.nspname = '${schema_name}'
      AND c.relname = '${table_name}'
  ) THEN
    CREATE POLICY ${policy_name}
    ON ${schema_name}.${table_name}
    FOR ALL
    USING (${using_sql})
    WITH CHECK (${with_check_sql});
  END IF;
END
$$;
`
}

export const sql_enable_rls_nodes = createEnableRlsSql(app.schema_brain, 'nodes')
export const sql_enable_rls_node_sources = createEnableRlsSql(app.schema_brain, 'node_sources')
export const sql_enable_rls_edges = createEnableRlsSql(app.schema_brain, 'edges')
export const sql_enable_rls_articles = createEnableRlsSql(app.schema_memory, 'articles')
export const sql_enable_rls_article_embeddings = createEnableRlsSql(app.schema_memory, 'article_embeddings')
export const sql_enable_rls_contexts = createEnableRlsSql(app.schema_memory, 'contexts')
export const sql_enable_rls_context_edges = createEnableRlsSql(app.schema_memory, 'context_edges')

export const sql_create_policy_nodes_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'nodes_scope_policy',
	schema_name: app.schema_brain,
	table_name: 'nodes',
	using_sql: createScopePredicateSql(),
	with_check_sql: createScopePredicateSql()
})

export const sql_create_policy_edges_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'edges_scope_policy',
	schema_name: app.schema_brain,
	table_name: 'edges',
	using_sql: createScopePredicateSql(),
	with_check_sql: createScopePredicateSql()
})

export const sql_create_policy_articles_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'articles_scope_policy',
	schema_name: app.schema_memory,
	table_name: 'articles',
	using_sql: createScopePredicateSql(),
	with_check_sql: createScopePredicateSql()
})

export const sql_create_policy_article_embeddings_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'article_embeddings_scope_policy',
	schema_name: app.schema_memory,
	table_name: 'article_embeddings',
	using_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_memory}.articles a WHERE a.id = article_id AND ${createScopePredicateSql('a')})
  `,
	with_check_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_memory}.articles a WHERE a.id = article_id AND ${createScopePredicateSql('a')})
  `
})

export const sql_create_policy_node_sources_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'node_sources_scope_policy',
	schema_name: app.schema_brain,
	table_name: 'node_sources',
	using_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_brain}.nodes n WHERE n.id = node_id AND ${createScopePredicateSql('n')})
    AND EXISTS (SELECT 1 FROM ${app.schema_memory}.articles a WHERE a.id = article_id AND ${createScopePredicateSql('a')})
  `,
	with_check_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_brain}.nodes n WHERE n.id = node_id AND ${createScopePredicateSql('n')})
    AND EXISTS (SELECT 1 FROM ${app.schema_memory}.articles a WHERE a.id = article_id AND ${createScopePredicateSql('a')})
  `
})

export const sql_create_policy_contexts_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'contexts_scope_policy',
	schema_name: app.schema_memory,
	table_name: 'contexts',
	using_sql: 'TRUE',
	with_check_sql: 'TRUE'
})

export const sql_create_policy_context_edges_scope_if_missing = createPolicyIfMissingSql({
	policy_name: 'context_edges_scope_policy',
	schema_name: app.schema_memory,
	table_name: 'context_edges',
	using_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_memory}.contexts c1 WHERE c1.id = source_id)
    AND EXISTS (SELECT 1 FROM ${app.schema_memory}.contexts c2 WHERE c2.id = target_id)
  `,
	with_check_sql: `
    EXISTS (SELECT 1 FROM ${app.schema_memory}.contexts c1 WHERE c1.id = source_id)
    AND EXISTS (SELECT 1 FROM ${app.schema_memory}.contexts c2 WHERE c2.id = target_id)
  `
})
