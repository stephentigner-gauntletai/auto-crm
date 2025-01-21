import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
	const spec = createSwaggerSpec({
		apiFolder: 'app/api',
		definition: {
			openapi: '3.0.0',
			info: {
				title: 'Auto-CRM API Documentation',
				version: '1.0.0',
				description: 'API documentation for the Auto-CRM system',
				contact: {
					name: 'API Support',
					email: 'support@example.com',
				},
			},
			components: {
				securitySchemes: {
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
					},
				},
			},
			security: [
				{
					BearerAuth: [],
				},
			],
		},
	});
	return spec;
};
