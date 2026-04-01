const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const listEndpoints = require("express-list-endpoints");

const DEFAULT_PORT = process.env.PORT || 5000;

function normalizePath(endpointPath) {
  if (!endpointPath) return "/";

  const withoutTrailingSlash = endpointPath.length > 1
    ? endpointPath.replace(/\/$/, "")
    : endpointPath;

  return withoutTrailingSlash.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function getPathParameters(openApiPath) {
  const matches = openApiPath.match(/\{([A-Za-z0-9_]+)\}/g) || [];
  return matches.map((match) => {
    const name = match.replace(/[{}]/g, "");
    return {
      name,
      in: "path",
      required: true,
      schema: { type: "string" },
      description: `${name} path parameter`,
    };
  });
}

function deriveTag(openApiPath) {
  const parts = openApiPath.split("/").filter(Boolean);
  if (parts.length === 0) return "General";

  if (parts[0] === "api" && parts[1]) {
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  }

  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function operationIdFor(method, openApiPath) {
  const normalized = openApiPath
    .replace(/[{}]/g, "")
    .replace(/[^A-Za-z0-9/]/g, "")
    .split("/")
    .filter(Boolean)
    .join("_");

  return `${method.toLowerCase()}_${normalized || "root"}`;
}

function buildAutoPaths(app) {
  const paths = {};
  const endpoints = listEndpoints(app);

  endpoints.forEach((endpoint) => {
    const endpointPath = normalizePath(endpoint.path);

    if (!endpointPath.startsWith("/api")) return;
    if (endpointPath.startsWith("/api/docs") || endpointPath.startsWith("/api/openapi")) return;
    if (endpointPath.includes("*") || endpointPath.includes("(")) return;

    const pathParameters = getPathParameters(endpointPath);
    const tag = deriveTag(endpointPath);

    if (!paths[endpointPath]) {
      paths[endpointPath] = {};
    }

    endpoint.methods.forEach((method) => {
      const lowerMethod = method.toLowerCase();

      paths[endpointPath][lowerMethod] = {
        tags: [tag],
        summary: `${method} ${endpointPath}`,
        operationId: operationIdFor(method, endpointPath),
        parameters: pathParameters,
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      };
    });
  });

  return paths;
}

function setupSwagger(app) {
  const definition = {
    openapi: "3.0.3",
    info: {
      title: "Bookish Backend API",
      version: "1.0.0",
      description: "Interactive API documentation for the Bookish backend.",
    },
    servers: [
      {
        url: process.env.BACKEND_URL || `http://localhost:${DEFAULT_PORT}`,
        description: "Backend server",
      },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "bookish.sid",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong" },
          },
        },
      },
    },
  };

  const swaggerSpec = swaggerJSDoc({
    definition,
    apis: [
      path.join(__dirname, "../routes/*.js"),
      path.join(__dirname, "../app.js"),
    ],
  });

  const autoPaths = buildAutoPaths(app);
  swaggerSpec.paths = {
    ...autoPaths,
    ...swaggerSpec.paths,
  };

  app.get("/api/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Bookish API Docs",
      explorer: true,
    })
  );
}

module.exports = {
  setupSwagger,
};