import { app } from '../consts'

export const sql_enable_rls_nodes = `ALTER TABLE ${app.db.schema_brain}.nodes ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_node_sources = `ALTER TABLE ${app.db.schema_brain}.node_sources ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_edges = `ALTER TABLE ${app.db.schema_brain}.edges ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_articles = `ALTER TABLE ${app.db.schema_memory}.articles ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_article_embeddings = `ALTER TABLE ${app.db.schema_memory}.article_embeddings ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_contexts = `ALTER TABLE ${app.db.schema_memory}.contexts ENABLE ROW LEVEL SECURITY;`
export const sql_enable_rls_context_edges = `ALTER TABLE ${app.db.schema_memory}.context_edges ENABLE ROW LEVEL SECURITY;`

export const sql_create_policy_nodes_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'nodes_scope_policy'
      AND n.nspname = '${app.db.schema_brain}'
      AND c.relname = 'nodes'
  ) THEN
    CREATE POLICY nodes_scope_policy
    ON ${app.db.schema_brain}.nodes
    FOR ALL
    USING (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    )
    WITH CHECK (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    );
  END IF;
END
$$;
`

export const sql_create_policy_edges_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'edges_scope_policy'
      AND n.nspname = '${app.db.schema_brain}'
      AND c.relname = 'edges'
  ) THEN
    CREATE POLICY edges_scope_policy
    ON ${app.db.schema_brain}.edges
    FOR ALL
    USING (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    )
    WITH CHECK (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    );
  END IF;
END
$$;
`

export const sql_create_policy_articles_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'articles_scope_policy'
      AND n.nspname = '${app.db.schema_memory}'
      AND c.relname = 'articles'
  ) THEN
    CREATE POLICY articles_scope_policy
    ON ${app.db.schema_memory}.articles
    FOR ALL
    USING (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    )
    WITH CHECK (
      context_id = current_setting('app.context_id', true)
      AND idol_id = current_setting('app.idol_id', true)
      AND (
        current_setting('app.root_ids', true) IS NULL
        OR current_setting('app.root_ids', true) = ''
        OR root_ids && string_to_array(current_setting('app.root_ids', true), ',')
      )
    );
  END IF;
END
$$;
`

export const sql_create_policy_article_embeddings_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'article_embeddings_scope_policy'
      AND n.nspname = '${app.db.schema_memory}'
      AND c.relname = 'article_embeddings'
  ) THEN
    CREATE POLICY article_embeddings_scope_policy
    ON ${app.db.schema_memory}.article_embeddings
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.articles a
        WHERE a.id = article_id
          AND a.context_id = current_setting('app.context_id', true)
          AND a.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR a.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.articles a
        WHERE a.id = article_id
          AND a.context_id = current_setting('app.context_id', true)
          AND a.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR a.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
    );
  END IF;
END
$$;
`

export const sql_create_policy_node_sources_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'node_sources_scope_policy'
      AND n.nspname = '${app.db.schema_brain}'
      AND c.relname = 'node_sources'
  ) THEN
    CREATE POLICY node_sources_scope_policy
    ON ${app.db.schema_brain}.node_sources
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_brain}.nodes n
        WHERE n.id = node_id
          AND n.context_id = current_setting('app.context_id', true)
          AND n.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR n.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
      AND EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.articles a
        WHERE a.id = article_id
          AND a.context_id = current_setting('app.context_id', true)
          AND a.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR a.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_brain}.nodes n
        WHERE n.id = node_id
          AND n.context_id = current_setting('app.context_id', true)
          AND n.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR n.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
      AND EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.articles a
        WHERE a.id = article_id
          AND a.context_id = current_setting('app.context_id', true)
          AND a.idol_id = current_setting('app.idol_id', true)
          AND (
            current_setting('app.root_ids', true) IS NULL
            OR current_setting('app.root_ids', true) = ''
            OR a.root_ids && string_to_array(current_setting('app.root_ids', true), ',')
          )
      )
    );
  END IF;
END
$$;
`

export const sql_create_policy_contexts_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'contexts_scope_policy'
      AND n.nspname = '${app.db.schema_memory}'
      AND c.relname = 'contexts'
  ) THEN
    CREATE POLICY contexts_scope_policy
    ON ${app.db.schema_memory}.contexts
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);
  END IF;
END
$$;
`

export const sql_create_policy_context_edges_scope_if_missing = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.polname = 'context_edges_scope_policy'
      AND n.nspname = '${app.db.schema_memory}'
      AND c.relname = 'context_edges'
  ) THEN
    CREATE POLICY context_edges_scope_policy
    ON ${app.db.schema_memory}.context_edges
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.contexts c1
        WHERE c1.id = source_id
      )
      AND EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.contexts c2
        WHERE c2.id = target_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.contexts c1
        WHERE c1.id = source_id
      )
      AND EXISTS (
        SELECT 1
        FROM ${app.db.schema_memory}.contexts c2
        WHERE c2.id = target_id
      )
    );
  END IF;
END
$$;
`
