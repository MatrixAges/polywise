CREATE SCHEMA "MEMORY";
--> statement-breakpoint
CREATE SCHEMA "METADATA";
--> statement-breakpoint
CREATE SCHEMA "SYSTEM";
--> statement-breakpoint
CREATE SCHEMA "USER";
--> statement-breakpoint
CREATE TABLE "SYSTEM"."agent" (
	"id" uuid PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"avatar" bytea,
	"prompt" text DEFAULT 'You are a personal agent assistant.' NOT NULL,
	"soul" text DEFAULT '' NOT NULL,
	"memory" text DEFAULT '',
	"vectors" vector(1024),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."article" (
	"id" uuid PRIMARY KEY,
	"document_id" uuid,
	"content" text NOT NULL,
	"title" varchar(100) NOT NULL,
	"url" text,
	"hash" text UNIQUE,
	"metadata" jsonb DEFAULT '{}',
	"long" boolean GENERATED ALWAYS AS (char_length(content) > 12000) STORED,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."chunk" (
	"id" uuid PRIMARY KEY,
	"article_id" text,
	"content" text,
	"vectors" vector(1024),
	"keywords" text NOT NULL,
	"as_body" boolean DEFAULT false,
	"position" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."document" (
	"id" uuid PRIMARY KEY,
	"title" varchar(100) NOT NULL,
	"description" varchar(600),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."edge" (
	"id" uuid PRIMARY KEY,
	"relation" varchar(100) NOT NULL,
	"vectors" vector(1024),
	"agent_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"growth" real DEFAULT 1 NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"distance" real DEFAULT 1 NOT NULL,
	"bandwidth" real DEFAULT 1 NOT NULL,
	"active_times" integer DEFAULT 1 NOT NULL,
	"active_at" timestamp DEFAULT now() NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."node" (
	"id" uuid PRIMARY KEY,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"vectors" vector(1024),
	"active_level" real DEFAULT 0 NOT NULL,
	"active_sens" real DEFAULT 0 NOT NULL,
	"active_times" integer DEFAULT 1 NOT NULL,
	"active_at" timestamp DEFAULT now() NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_agent_name_unique" UNIQUE("agent_id","name")
);
--> statement-breakpoint
CREATE TABLE "SYSTEM"."task" (
	"id" uuid PRIMARY KEY,
	"type" text NOT NULL,
	"progress" text NOT NULL,
	"status" "task_status" DEFAULT 'pending'::"task_status",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "SYSTEM"."agent_article" (
	"agent_id" uuid,
	"article_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_article_pkey" PRIMARY KEY("agent_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "SYSTEM"."agent_document" (
	"agent_id" uuid,
	"document_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_document_pkey" PRIMARY KEY("agent_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "MEMORY"."node_chunk" (
	"node_id" uuid,
	"chunk_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_chunk_pkey" PRIMARY KEY("node_id","chunk_id")
);
--> statement-breakpoint
CREATE INDEX "article_document_id_idx" ON "MEMORY"."article" ("document_id");--> statement-breakpoint
CREATE INDEX "article_url_idx" ON "MEMORY"."article" USING gin ("url" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "chunk_article_id_idx" ON "MEMORY"."chunk" ("article_id");--> statement-breakpoint
CREATE INDEX "chunk_vectors_idx" ON "MEMORY"."chunk" USING hnsw ("vectors" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chunk_keywords_idx" ON "MEMORY"."chunk" USING gin (to_tsvector('simple', "keywords"));--> statement-breakpoint
CREATE INDEX "edge_vectors_idx" ON "MEMORY"."edge" USING hnsw ("vectors" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "edge_agent_id_idx" ON "MEMORY"."edge" ("agent_id");--> statement-breakpoint
CREATE INDEX "edge_source_idx" ON "MEMORY"."edge" ("source_id");--> statement-breakpoint
CREATE INDEX "edge_target_idx" ON "MEMORY"."edge" ("target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "edge_source_target_idx" ON "MEMORY"."edge" ("source_id","target_id");--> statement-breakpoint
CREATE INDEX "node_agent_id_idx" ON "MEMORY"."node" ("agent_id");--> statement-breakpoint
CREATE INDEX "node_vectors_idx" ON "MEMORY"."node" USING hnsw ("vectors" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "agent_article_article_id_idx" ON "SYSTEM"."agent_article" ("article_id");--> statement-breakpoint
CREATE INDEX "agent_document_document_id_idx" ON "SYSTEM"."agent_document" ("document_id");--> statement-breakpoint
CREATE INDEX "node_chunk_chunk_id_idx" ON "MEMORY"."node_chunk" ("chunk_id");--> statement-breakpoint
ALTER TABLE "MEMORY"."article" ADD CONSTRAINT "article_document_id_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "MEMORY"."document"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."chunk" ADD CONSTRAINT "chunk_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "MEMORY"."article"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."edge" ADD CONSTRAINT "edge_agent_id_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "SYSTEM"."agent"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."edge" ADD CONSTRAINT "edge_source_id_node_id_fkey" FOREIGN KEY ("source_id") REFERENCES "MEMORY"."node"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."edge" ADD CONSTRAINT "edge_target_id_node_id_fkey" FOREIGN KEY ("target_id") REFERENCES "MEMORY"."node"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."node" ADD CONSTRAINT "node_agent_id_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "SYSTEM"."agent"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "SYSTEM"."agent_article" ADD CONSTRAINT "agent_article_agent_id_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "SYSTEM"."agent"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "SYSTEM"."agent_article" ADD CONSTRAINT "agent_article_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "MEMORY"."article"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "SYSTEM"."agent_document" ADD CONSTRAINT "agent_document_agent_id_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "SYSTEM"."agent"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "SYSTEM"."agent_document" ADD CONSTRAINT "agent_document_document_id_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "MEMORY"."document"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."node_chunk" ADD CONSTRAINT "node_chunk_node_id_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "MEMORY"."node"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "MEMORY"."node_chunk" ADD CONSTRAINT "node_chunk_chunk_id_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "MEMORY"."chunk"("id") ON DELETE CASCADE;