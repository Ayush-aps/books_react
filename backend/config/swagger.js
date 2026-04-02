/**
 * Swagger / OpenAPI 3.0 setup
 *
 * All endpoint documentation lives as @swagger JSDoc comments
 * directly in the route files under /routes/*.js — this file
 * only wires up the spec shell, the shared component schemas,
 * and the Swagger UI express middleware.
 */

const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const DEFAULT_PORT = process.env.PORT || 5000;

function setupSwagger(app) {
  const definition = {
    openapi: "3.0.3",

    info: {
      title: "Bookish Backend API",
      version: "1.0.0",
      description: `
## Authentication

This API uses **session-based authentication** via a \`bookish.sid\` cookie.

**How to authenticate in Swagger UI:**
1. Expand **Auth → POST /api/auth/login**, click **Try it out**, fill in your credentials and click **Execute**.
2. The server sets the \`bookish.sid\` session cookie in your browser automatically.
3. All subsequent requests from this page will carry that cookie — no copy-paste needed.
4. To end the session call **Auth → POST /api/auth/logout**.

> Endpoints marked with a 🔒 padlock require an active session.
      `.trim(),
      contact: {
        name: "Bookish Support",
        email: "support@bookish.com",
      },
    },

    servers: [
      {
        url: process.env.BACKEND_URL || `http://localhost:${DEFAULT_PORT}`,
        description: "Local development server",
      },
    ],

    // Tag descriptions shown in the sidebar
    tags: [
      { name: "Auth",               description: "Register, login, logout, and session check" },
      { name: "Public",             description: "Publicly accessible endpoints — no login required" },
      { name: "Books",              description: "Public book browsing and detail lookup" },
      { name: "Buyer",              description: "Buyer dashboard, cart, checkout, orders, profile, complaints" },
      { name: "Seller",             description: "Seller inventory, book management, orders, complaints" },
      { name: "Orders",             description: "Shared order operations (create, pay, cancel, return)" },
      { name: "Library",            description: "Digital library — requires an active subscription" },
      { name: "Subscription",       description: "Subscription plans, checkout, and billing management" },
      { name: "Reviews",            description: "Book review creation and management" },
      { name: "Highlights",         description: "In-reader text highlights" },
      { name: "Videos",             description: "Book summary video content" },
      { name: "Admin",              description: "Admin-only management endpoints" },
      { name: "Moderator",          description: "Moderator endpoints — require moderator or admin session" },
      { name: "Employee",           description: "Employee endpoints — require employee, moderator, or admin session" },
    ],

    components: {
      // ----------------------------------------------------------------
      // Security scheme
      // ----------------------------------------------------------------
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "bookish.sid",
          description:
            "Session cookie set automatically after `POST /api/auth/login`. " +
            "The browser sends it with every request — no manual input needed.",
        },
      },

      // ----------------------------------------------------------------
      // Reusable schemas
      // ----------------------------------------------------------------
      schemas: {
        // Generic success wrapper
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
          },
        },

        // Generic error wrapper
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong" },
          },
        },

        // Pagination envelope
        Pagination: {
          type: "object",
          properties: {
            currentPage: { type: "integer", example: 1 },
            totalPages:  { type: "integer", example: 5 },
            totalItems:  { type: "integer", example: 50 },
            limit:       { type: "integer", example: 12 },
          },
        },

        // Minimal user object returned in most responses
        UserSummary: {
          type: "object",
          properties: {
            _id:    { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            name:   { type: "string", example: "Jane Doe" },
            email:  { type: "string", example: "jane@example.com" },
            role:   { type: "string", enum: ["buyer", "seller", "admin", "moderator", "employee"], example: "buyer" },
            avatar: { type: "string", example: "/img/users/default-avatar.jpg" },
          },
        },

        // Minimal book object returned in list responses
        BookSummary: {
          type: "object",
          properties: {
            _id:        { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            title:      { type: "string", example: "The Great Gatsby" },
            author:     { type: "string", example: "F. Scott Fitzgerald" },
            price:      { type: "number", example: 299 },
            coverImage: { type: "string", example: "https://res.cloudinary.com/..." },
            genres:     { type: "array", items: { type: "string" }, example: ["Fiction", "Classic"] },
            condition:  { type: "string", enum: ["new", "like-new", "good", "fair"], example: "new" },
            rating:     { type: "number", example: 4.5 },
          },
        },

        // Address object
        Address: {
          type: "object",
          required: ["name", "street", "city", "state", "zipCode", "phone"],
          properties: {
            name:    { type: "string", example: "Jane Doe" },
            street:  { type: "string", example: "123 Main St" },
            city:    { type: "string", example: "Mumbai" },
            state:   { type: "string", example: "Maharashtra" },
            zipCode: { type: "string", example: "400001" },
            country: { type: "string", example: "India" },
            phone:   { type: "string", example: "9876543210" },
          },
        },
      },

      // ----------------------------------------------------------------
      // Reusable parameters
      // ----------------------------------------------------------------
      parameters: {
        IdParam: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "MongoDB ObjectId",
          example: "64f1a2b3c4d5e6f7a8b9c0d1",
        },
        BookIdParam: {
          name: "bookId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "MongoDB ObjectId of the book",
          example: "64f1a2b3c4d5e6f7a8b9c0d2",
        },
        PageParam: {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
          description: "Page number (1-indexed)",
        },
        LimitParam: {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 12 },
          description: "Number of results per page",
        },
      },

      // ----------------------------------------------------------------
      // Reusable responses
      // ----------------------------------------------------------------
      responses: {
        Unauthorized: {
          description: "Unauthorized — session cookie missing or expired",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Please log in to access this resource" },
            },
          },
        },
        Forbidden: {
          description: "Forbidden — insufficient role or account not approved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Access denied." },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Resource not found" },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Internal server error" },
            },
          },
        },
      },
    },
  };

  // Scan every route file for @swagger JSDoc blocks
  const swaggerSpec = swaggerJSDoc({
    definition,
    apis: [
      path.join(__dirname, "../routes/*.js"),
    ],
  });

  // Serve the raw spec JSON
  app.get("/api/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Serve the interactive UI
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Bookish API Docs",
      explorer: true,
      swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true,
        // credentials:'include' ensures the bookish.sid cookie is sent
        requestInterceptor: `(req) => { req.credentials = 'include'; return req; }`,
      },
      customCss: ".topbar { display: none; }",
    })
  );
}

module.exports = { setupSwagger };