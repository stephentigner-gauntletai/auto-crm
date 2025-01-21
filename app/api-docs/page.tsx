'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface PathItem {
	get?: Operation;
	post?: Operation;
	put?: Operation;
	delete?: Operation;
	parameters?: Parameter[];
}

interface Operation {
	summary?: string;
	description?: string;
	tags?: string[];
	parameters?: Parameter[];
	requestBody?: RequestBody;
	responses: Record<string, Response>;
}

interface Parameter {
	name: string;
	in: string;
	description?: string;
	required?: boolean;
	schema: Schema;
}

interface RequestBody {
	description?: string;
	required?: boolean;
	content: Record<string, { schema: Schema }>;
}

interface Response {
	description: string;
	content?: Record<string, { schema: Schema }>;
}

interface Schema {
	type: string;
	format?: string;
	properties?: Record<string, Schema>;
	items?: Schema;
	required?: string[];
	enum?: string[];
}

interface OpenAPISpec {
	openapi: string;
	info: {
		title: string;
		version: string;
		description?: string;
	};
	paths: Record<string, PathItem>;
	components?: {
		schemas?: Record<string, Schema>;
		securitySchemes?: Record<string, SecurityScheme>;
	};
}

interface SecurityScheme {
	type: string;
	scheme?: string;
	bearerFormat?: string;
}

export default function ApiDocs() {
	const [spec, setSpec] = useState<OpenAPISpec | null>(null);

	useEffect(() => {
		fetch('/api/docs')
			.then((response) => response.json())
			.then((data) => setSpec(data));
	}, []);

	if (!spec) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg">Loading API documentation...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<SwaggerUI spec={spec} />
		</div>
	);
}
