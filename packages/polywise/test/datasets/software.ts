export const software_architecture_triples = [
	{
		subject: 'Microservices',
		predicate: 'uses',
		object: 'REST APIs',
		learning_rate: 2.5,
		decay_resistance: 2.0
	},
	{
		subject: 'Microservices',
		predicate: 'replaces',
		object: 'Monolith',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'Microservices',
		predicate: 'enables',
		object: 'Horizontal Scaling',
		learning_rate: 2.4,
		decay_resistance: 2.1
	},
	{
		subject: 'REST APIs',
		predicate: 'uses',
		object: 'HTTP Protocol',
		learning_rate: 2.2,
		decay_resistance: 1.8
	},
	{
		subject: 'REST APIs',
		predicate: 'uses',
		object: 'JSON',
		learning_rate: 2.1,
		decay_resistance: 1.7
	},
	{
		subject: 'gRPC',
		predicate: 'uses',
		object: 'Protocol Buffers',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'Message Queues',
		predicate: 'uses',
		object: 'AMQP',
		learning_rate: 2.0,
		decay_resistance: 1.6
	},
	{
		subject: 'Docker',
		predicate: 'containerizes',
		object: 'Microservices',
		learning_rate: 2.6,
		decay_resistance: 2.2
	},
	{
		subject: 'Kubernetes',
		predicate: 'orchestrates',
		object: 'Docker',
		learning_rate: 2.5,
		decay_resistance: 2.1
	},
	{
		subject: 'Service Mesh',
		predicate: 'manages',
		object: 'Inter-service Traffic',
		learning_rate: 2.2,
		decay_resistance: 1.8
	},
	{
		subject: 'Istio',
		predicate: 'implements',
		object: 'Service Mesh',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'Prometheus',
		predicate: 'monitors',
		object: 'Metrics',
		learning_rate: 2.4,
		decay_resistance: 2.0
	},
	{
		subject: 'Jaeger',
		predicate: 'traces',
		object: 'Distributed Requests',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'ELK Stack',
		predicate: 'aggregates',
		object: 'Logs',
		learning_rate: 2.2,
		decay_resistance: 1.8
	},
	{
		subject: 'Circuit Breaker',
		predicate: 'prevents',
		object: 'Cascading Failures',
		learning_rate: 2.1,
		decay_resistance: 1.7
	},
	{
		subject: 'API Gateway',
		predicate: 'routes',
		object: 'REST APIs',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'Authentication',
		predicate: 'secured_by',
		object: 'OAuth 2.0',
		learning_rate: 2.5,
		decay_resistance: 2.1
	},
	{
		subject: 'OAuth 2.0',
		predicate: 'uses',
		object: 'JWT Tokens',
		learning_rate: 2.4,
		decay_resistance: 2.0
	},
	{
		subject: 'Load Balancer',
		predicate: 'distributes',
		object: 'Traffic',
		learning_rate: 2.2,
		decay_resistance: 1.8
	},
	{
		subject: 'CDN',
		predicate: 'caches',
		object: 'Static Content',
		learning_rate: 2.0,
		decay_resistance: 1.6
	},
	{
		subject: 'API Gateway',
		predicate: 'authenticates',
		object: 'JWT Tokens',
		learning_rate: 2.3,
		decay_resistance: 1.9
	},
	{
		subject: 'Kubernetes',
		predicate: 'manages',
		object: 'Pods',
		learning_rate: 2.4,
		decay_resistance: 2.0
	},
	{
		subject: 'Service Mesh',
		predicate: 'provides',
		object: 'Observability',
		learning_rate: 2.2,
		decay_resistance: 1.8
	},
	{
		subject: 'Istio',
		predicate: 'enables',
		object: 'Traffic Management',
		learning_rate: 2.3,
		decay_resistance: 1.9
	}
]

export const software_articles = [
	{
		title: 'Introduction to Microservices Architecture',
		content: 'Microservices architecture is an approach to application development where a large application is built as a suite of modular services. Each module supports a specific business goal and uses a well-defined interface to communicate with other sets of services. This architectural style has gained significant popularity in enterprise environments due to its flexibility and scalability.'
	},
	{
		title: 'Docker and Containerization Best Practices',
		content: 'Docker has revolutionized how we deploy applications. By containerizing microservices, teams can ensure consistency across environments, reduce overhead compared to virtual machines, and enable faster deployment cycles. Containerization provides process isolation and resource efficiency that traditional virtualization cannot match.'
	},
	{
		title: 'Kubernetes for Enterprise Scale',
		content: 'Kubernetes has become the de facto standard for container orchestration. It provides automated deployment, scaling, and management of containerized applications across clusters of hosts. Key features include self-healing, automated rollouts, and horizontal scaling based on CPU utilization.'
	},
	{
		title: 'Service Mesh Patterns with Istio',
		content: 'Service mesh architecture provides a dedicated infrastructure layer for handling service-to-service communication. Istio provides features like traffic management, security, and observability without requiring code changes. The service mesh handles load balancing, authentication, and monitoring at the infrastructure level.'
	},
	{
		title: 'Observability in Distributed Systems',
		content: 'Modern distributed systems require comprehensive observability. The three pillars - metrics, logs, and traces - provide different perspectives on system health and performance. Prometheus excels at metrics collection, Jaeger provides distributed tracing, and the ELK stack handles log aggregation.'
	},
	{
		title: 'API Design Best Practices',
		content: 'RESTful API design follows principles of resource-oriented architecture. Proper use of HTTP methods, status codes, and versioning strategies are essential. API gateways serve as the single entry point for all client requests, handling authentication, rate limiting, and request routing.'
	},
	{
		title: 'Security in Microservices',
		content: 'Securing microservices requires defense in depth strategies. OAuth 2.0 with JWT tokens provides stateless authentication. API gateways can enforce authentication before requests reach backend services. Service meshes like Istio provide mutual TLS between services automatically.'
	}
]
