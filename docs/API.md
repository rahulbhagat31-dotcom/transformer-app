# API Documentation

## Base URL
```
http://localhost:3000
```

---

## Authentication

### POST /auth/login
Login to the system.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "role": "string"
  }
}
```

### POST /auth/logout
Logout from the system.

**Headers**: `user-id: string`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Transformers

### GET /transformers
Get all transformers.

**Headers**: `user-id: string`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "woNo": "string",
      "customer": "string",
      "rating": "string",
      "voltage": "string",
      "status": "string"
    }
  ]
}
```

### POST /transformers
Create a new transformer.

**Headers**: `user-id: string`

**Request Body**:
```json
{
  "woNo": "string",
  "customer": "string",
  "rating": "string",
  "voltage": "string",
  "type": "string"
}
```

### PUT /transformers/:id
Update a transformer.

**Headers**: `user-id: string`

**Request Body**: Same as POST

### DELETE /transformers/:id
Delete a transformer.

**Headers**: `user-id: string`

---

## Calculations

### POST /calculations/design
Perform transformer design calculations.

**Headers**: `user-id: string`

**Request Body**:
```json
{
  "rating": "number",
  "voltage": "string",
  "frequency": "number",
  "phases": "number",
  "connection": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currents": {},
    "coreDesign": {},
    "windingDesign": {},
    "losses": {},
    "efficiency": "number"
  }
}
```

---

## Checklist

### GET /checklist/:woNo
Get checklist for a work order.

**Headers**: `user-id: string`

### POST /checklist
Create or update checklist.

**Headers**: `user-id: string`

**Request Body**:
```json
{
  "woNo": "string",
  "stage": "string",
  "items": []
}
```

---

## Audit Log

### GET /audit
Get audit logs with filters.

**Headers**: `user-id: string`

**Query Parameters**:
- `entityType`: string (optional)
- `entityId`: string (optional)
- `startDate`: string (optional)
- `endDate`: string (optional)

---

## Export

### POST /export/pdf
Export data as PDF.

**Headers**: `user-id: string`

**Request Body**:
```json
{
  "type": "string",
  "data": {}
}
```

---

## Analytics

### GET /analytics/dashboard
Get dashboard analytics.

**Headers**: `user-id: string`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalTransformers": "number",
    "inProduction": "number",
    "completed": "number",
    "qualityScore": "number"
  }
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common Status Codes**:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
