import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IE213 Blog System API",
      version: "1.0.0",
      description:
        "API documentation for IE213 Blog System - A comprehensive blogging platform with user management, posts, comments, and categories",
      contact: {
        name: "IE213 Team",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "http://localhost:5000/v1/api",
        description: "API v1 endpoint",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
        clientId: {
          type: "apiKey",
          in: "header",
          name: "x-client-id",
          description: "User ID for authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "moderator", "user"] },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            categoryId: { type: "string" },
            authorId: { type: "string" },
            status: { type: "string", enum: ["draft", "published"] },
            likesCount: { type: "number" },
            commentsCount: { type: "number" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            postId: { type: "string" },
            userId: { type: "string" },
            content: { type: "string" },
            parentId: { type: "string" },
            likesCount: { type: "number" },
            commentLeft: { type: "number" },
            commentRight: { type: "number" },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            postCount: { type: "number" },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: { type: "number" },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string" },
            status: { type: "number" },
            metadata: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        clientId: [],
      },
    ],
  },
  apis: [
    "./src/docs/**/*.ts",
    "./src/controllers/**/*.ts",
    "./src/models/**/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
