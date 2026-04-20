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

function isPublicOperation(openApiPath, method) {
  if (!openApiPath.startsWith("/api")) return true;
  if (openApiPath.startsWith("/api/public")) return true;

  if (openApiPath.startsWith("/api/auth")) {
    const publicAuthPaths = new Set([
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/check",
    ]);
    return publicAuthPaths.has(openApiPath);
  }

  if (openApiPath.startsWith("/api/subscription")) {
    const publicSubscriptionPaths = new Set([
      "/api/subscription/plans",
      "/api/subscription/webhook",
    ]);
    return publicSubscriptionPaths.has(openApiPath);
  }

  // Health check endpoint is public.
  if (openApiPath === "/api/health" && method.toUpperCase() === "GET") {
    return true;
  }

  return false;
}

function inferRequestBody(openApiPath, method) {
  const upperMethod = method.toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(upperMethod)) {
    return undefined;
  }

  // Upload endpoints should prompt for multipart form data in Swagger UI.
  if (openApiPath.includes("/upload") || openApiPath.includes("/avatar")) {
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            minProperties: 1,
            additionalProperties: true,
          },
        },
      },
    };
  }

  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          minProperties: 1,
          additionalProperties: true,
        },
      },
    },
  };
}

function getPostOperationOverride(openApiPath) {
  const map = {
    "/api/auth/register": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password", "password2", "role"],
              properties: {
                name: { type: "string", example: "John Doe" },
                email: { type: "string", format: "email", example: "john@example.com" },
                password: { type: "string", format: "password", example: "password123" },
                password2: { type: "string", format: "password", example: "password123" },
                role: { type: "string", enum: ["buyer", "seller", "employee"], example: "buyer" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email", example: "user1@gmail.com" },
                password: { type: "string", format: "password", example: "password123" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      requestBody: null,
      description: "Logout current authenticated user (no request body required).",
    },
    "/api/buyer/track-view/{bookId}": {
      requestBody: null,
      description: "Track view for a book by path param only.",
    },
    "/api/buyer/cart/add/{bookId}": {
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                quantity: { type: "integer", minimum: 1, example: 1 },
              },
            },
          },
        },
      },
    },
    "/api/buyer/cart/save-for-later/{itemId}": {
      requestBody: null,
      description: "Move cart item to saved list using path param only.",
    },
    "/api/buyer/cart/move-to-cart/{itemId}": {
      requestBody: null,
      description: "Move saved item back to cart using path param only.",
    },
    "/api/buyer/addresses": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fullName", "phone", "street", "city", "state", "zipCode"],
              properties: {
                fullName: { type: "string", example: "John Doe" },
                phone: { type: "string", example: "9876543210" },
                street: { type: "string", example: "MG Road" },
                city: { type: "string", example: "Bengaluru" },
                state: { type: "string", example: "Karnataka" },
                zipCode: { type: "string", example: "560001" },
                country: { type: "string", example: "India" },
                isDefault: { type: "boolean", example: true },
              },
            },
          },
        },
      },
    },
    "/api/buyer/complaints": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subject", "description", "category"],
              properties: {
                subject: { type: "string", example: "Order issue" },
                description: { type: "string", example: "Item delivered damaged." },
                category: { type: "string", example: "Delivery" },
                bookId: { type: "string", example: "67d9e89c10ca416728ac3120" },
                orderId: { type: "string", example: "67d9e89c10ca416728ac3121" },
              },
            },
          },
        },
      },
    },
    "/api/buyer/complaints/{id}/comment": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string", example: "Please share update." },
              },
            },
          },
        },
      },
    },
    "/api/seller/books": {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["title", "author", "isbn", "price", "stock", "format"],
              properties: {
                title: { type: "string", example: "Clean Code" },
                author: { type: "string", example: "Robert C. Martin" },
                description: { type: "string" },
                isbn: { type: "string", example: "9780132350884" },
                price: { type: "number", example: 499 },
                discountPrice: { type: "number", example: 399 },
                publisher: { type: "string" },
                publishedDate: { type: "string", format: "date" },
                pageCount: { type: "integer" },
                language: { type: "string", example: "English" },
                genres: {
                  oneOf: [
                    { type: "string", example: "Programming" },
                    { type: "array", items: { type: "string" } },
                  ],
                },
                condition: { type: "string", example: "new" },
                stock: { type: "integer", minimum: 1, example: 10 },
                format: { type: "string", example: "paperback" },
                coverImageUrl: { type: "string", format: "uri" },
                coverImage: { type: "string" },
                epubFile: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    },
    "/api/seller/complaints": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subject", "description", "category"],
              properties: {
                subject: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/seller/complaints/{id}/comment": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/admin/content/{id}/approve": {
      requestBody: null,
      description: "Approve a book by path param only.",
    },
    "/api/admin/content/{id}/reject": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: { type: "string", example: "Inappropriate content" },
              },
            },
          },
        },
      },
    },
    "/api/admin/complaints/{id}/comment": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/admin/complaints/{id}/resolve": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["action", "details"],
              properties: {
                action: { type: "string", example: "refund" },
                details: { type: "string", example: "Refund approved and processed." },
                adminResponse: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/library/add/{bookId}": {
      requestBody: null,
      description: "Add book using path param only.",
    },
    "/api/library/bookmark": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bookId", "isBookmarked"],
              properties: {
                bookId: { type: "string" },
                currentPage: { type: "integer", example: 12 },
                isBookmarked: { type: "boolean", example: true },
              },
            },
          },
        },
      },
    },
    "/api/library/annotations": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bookId", "cfi", "text"],
              properties: {
                bookId: { type: "string" },
                cfi: { type: "string" },
                text: { type: "string" },
                note: { type: "string" },
                color: { type: "string", example: "#FFD700" },
              },
            },
          },
        },
      },
    },
    "/api/admin/moderator/verify-user": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId", "action"],
              properties: {
                userId: { type: "string" },
                action: { type: "string", enum: ["approve", "reject"] },
              },
            },
          },
        },
      },
    },
    "/api/admin/moderator/users/{id}/verify": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["action"],
              properties: {
                action: { type: "string", enum: ["approve", "reject"] },
              },
            },
          },
        },
      },
    },
    "/api/orders/create-payment-intent": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount", "items", "shippingAddress"],
              properties: {
                amount: { type: "number", example: 799 },
                items: { type: "array", items: { type: "object", additionalProperties: true } },
                shippingAddress: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
    "/api/orders": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items", "shippingAddress", "paymentMethod"],
              properties: {
                items: { type: "array", minItems: 1, items: { type: "object", additionalProperties: true } },
                shippingAddress: { type: "object", additionalProperties: true },
                paymentMethod: { type: "string", example: "card" },
                totalAmount: { type: "number" },
                paymentIntentId: { type: "string" },
                subtotal: { type: "number" },
                tax: { type: "number" },
                shippingCost: { type: "number" },
              },
            },
          },
        },
      },
    },
    "/api/public/contact": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subject", "message"],
              properties: {
                name: { type: "string", description: "Required for guest users" },
                email: { type: "string", format: "email", description: "Required for guest users" },
                subject: { type: "string" },
                message: { type: "string" },
                type: { type: "string", example: "General Inquiry" },
              },
            },
          },
        },
      },
    },
    "/api/reviews": {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["bookId", "rating"],
              properties: {
                bookId: { type: "string" },
                rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                reviewText: { type: "string" },
                images: { type: "array", items: { type: "string", format: "binary" } },
                video: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    },
    "/api/subscription/create-checkout-session": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["planId"],
              properties: {
                planId: { type: "string", enum: ["premium", "premium_plus"], example: "premium" },
              },
            },
          },
        },
      },
    },
    "/api/subscription/cancel": {
      requestBody: null,
      description: "Cancel active subscription for current user (no body required).",
    },
    "/api/subscription/webhook": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", additionalProperties: true },
          },
        },
      },
      security: [],
    },
    "/api/videos/upload": {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["title", "bookId", "video"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                bookId: { type: "string" },
                tags: { type: "string", description: "Comma-separated tags" },
                video: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    },
    "/api/videos/{id}/like": {
      requestBody: null,
      description: "Like/unlike uses path param only.",
    },
    "/api/videos/{id}/comment": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/employee/review-book": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bookId", "action"],
              properties: {
                bookId: { type: "string" },
                action: { type: "string", enum: ["approve", "reject"] },
                rejectionReason: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/employee/resolve-complaint": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["complaintId", "resolutionNotes"],
              properties: {
                complaintId: { type: "string" },
                resolutionNotes: { type: "string" },
                resolutionAction: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/employee/escalate-complaint": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["complaintId"],
              properties: {
                complaintId: { type: "string" },
                escalationReason: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/highlights": {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["bookId", "text", "page", "position"],
              properties: {
                bookId: { type: "string" },
                text: { type: "string" },
                page: { type: "integer", example: 12 },
                color: { type: "string", example: "rgba(255,248,220,0.6)" },
                position: {
                  type: "object",
                  required: ["startOffset", "endOffset"],
                  properties: {
                    startOffset: { type: "integer", example: 10 },
                    endOffset: { type: "integer", example: 80 },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return map[openApiPath];
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
      const publicOperation = isPublicOperation(endpointPath, method);

      const operation = {
        tags: [tag],
        summary: `${method} ${endpointPath}`,
        operationId: operationIdFor(method, endpointPath),
        parameters: pathParameters,
        security: publicOperation ? [] : [{ bearerAuth: [] }, { sessionCookie: [] }],
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

      const requestBody = inferRequestBody(endpointPath, method);
      if (requestBody) {
        operation.requestBody = requestBody;
      }

      if (method.toUpperCase() === "POST") {
        const override = getPostOperationOverride(endpointPath);
        if (override) {
          if (typeof override.description === "string") {
            operation.description = override.description;
          }
          if (Object.prototype.hasOwnProperty.call(override, "requestBody")) {
            if (override.requestBody === null) {
              delete operation.requestBody;
            } else {
              operation.requestBody = override.requestBody;
            }
          }
          if (Object.prototype.hasOwnProperty.call(override, "security")) {
            operation.security = override.security;
          }
        }
      }

      paths[endpointPath][lowerMethod] = operation;
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
        // Default to backend URL; can be overridden via BACKEND_URL env.
        url: process.env.BACKEND_URL || `http://localhost:${DEFAULT_PORT}`,
        description: "Backend server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
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
      swaggerOptions: {
        persistAuthorization: true,
        // Force credentials so session cookies are sent with Try-It-Out calls.
        requestInterceptor: (req) => {
          req.credentials = "include";
          return req;
        },
      },
    })
  );
}

module.exports = {
  setupSwagger,
};