/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                 RADHE SALT BACKEND - SWAGGER/OPENAPI 3.0                      ║
 * ║                    Complete API Documentation Configuration                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Radhe Salt Backend API',
      version: '1.0.0',
      description: `
        Comprehensive REST API for Radhe Salt Distribution Management System
        
        **7 Complete Phases:**
        - Phase 1-5: Core API Infrastructure (Auth, Products, Orders, Inventory)
        - Phase 6: Admin Dashboard & Analytics (10 endpoints)
        - Phase 7: Security & Optimization (Rate limiting, Input validation, Caching, Logging)
        
        **Key Features:**
        - JWT Authentication with Role-Based Access Control
        - Rate Limiting with Exponential Backoff
        - Input Validation & Injection Prevention
        - 8 OWASP Security Headers
        - Comprehensive Request Logging & Audit Trails
        - Performance Optimization (Caching, Compression)
        - Real-time Analytics & Reporting
        
        **Base URL:** http://localhost:8000/api/v1
        **Authentication:** Bearer Token (JWT)
      `,
      termsOfService: 'http://swagger.io/terms/',
      contact: {
        name: 'API Support',
        email: 'support@radhesalt.com',
        url: 'https://radhesalt.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    externalDocs: {
      description: 'Complete API Documentation',
      url: 'https://github.com/radhesalt/backend-docs'
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development Server',
        variables: {
          port: {
            default: '8000',
            description: 'Server port'
          }
        }
      },
      {
        url: 'https://api.radhesalt.com/api/v1',
        description: 'Production Server'
      },
      {
        url: 'https://staging-api.radhesalt.com/api/v1',
        description: 'Staging Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication'
        }
      },
      schemas: {
        // ── User Schema ──
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'dealer'] },
            companyName: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // ── Product Schema ──
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'integer' },
            sku: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        },

        // ── Order Schema ──
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            dealerId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' }
                }
              }
            },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['pending', 'completed', 'failed'] }
          }
        },

        // ── Error Response Schema ──
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                details: { type: 'string' }
              }
            }
          }
        },

        // ── Success Response Schema ──
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ValidationError: {
          description: 'Bad Request - Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: { type: 'integer', example: 429 },
                  message: { type: 'string' },
                  retryAfter: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export default specs;
