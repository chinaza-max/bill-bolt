# Identity Verification Service (NIN) API Documentation

Welcome to the Identity Verification Service API. This service enables external apps and internal services to verify National Identification Numbers (NIN) seamlessly, manage API keys, fund identity wallets via virtual bank accounts, view real-time balance and transaction history, and receive automated webhook notifications.

---

## Base URL

```text
https://your-domain.com/api/v1/identity
```

---

## Authentication

All requests to protected endpoints require authentication via one of the following methods in HTTP Headers:

### Method 1: API Key Header (Recommended for Server-to-Server)
```http
x-api-key: id_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Method 2: Bearer Token (Recommended for Dashboard Clients)
```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 1. Authentication & API Key Management

### 1.1 Register API Account
**`POST /api/v1/identity/auth/register`**

Creates a new client account for identity verification.

**Request Body:**
```json
{
  "companyName": "Acme Fintech Solutions Ltd",
  "cacNumber": "RC1234567",
  "address": "123 Technology Way, Victoria Island, Lagos",
  "contactName": "John Doe",
  "email": "dev@acmefintech.com",
  "password": "SecretPassword123",
  "phoneNumber": "08012345678"
}
```

**Response (201 Created):**
```json
{
  "status": 201,
  "message": "Identity client registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client": {
      "id": 1,
      "companyName": "Acme Fintech Solutions Ltd",
      "cacNumber": "RC1234567",
      "address": "123 Technology Way, Victoria Island, Lagos",
      "contactName": "John Doe",
      "email": "dev@acmefintech.com",
      "phoneNumber": "08012345678",
      "apiKey": "id_live_8f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
      "walletBalance": 0,
      "webhookUrl": null,
      "createdAt": "2026-08-07T19:30:00.000Z"
    }
  }
}
```

---

### 1.2 Login
**`POST /api/v1/identity/auth/login`**

Authenticates identity client credentials and returns JWT token and API Key.

**Request Body:**
```json
{
  "email": "dev@acmefintech.com",
  "password": "SecretPassword123"
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client": {
      "id": 1,
      "companyName": "Acme Fintech Solutions Ltd",
      "apiKey": "id_live_8f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
      "walletBalance": 1500.0,
      "webhookUrl": "https://api.acmefintech.com/webhooks/identity"
    }
  }
}
```

---

### 1.3 View Profile
**`GET /api/v1/identity/profile`**

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Client profile retrieved successfully",
  "data": {
    "id": 1,
    "companyName": "Acme Fintech Solutions Ltd",
    "cacNumber": "RC1234567",
    "address": "123 Technology Way, Victoria Island, Lagos",
    "contactName": "John Doe",
    "email": "dev@acmefintech.com",
    "phoneNumber": "08012345678",
    "apiKey": "id_live_8f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    "walletBalance": 1500.0,
    "webhookUrl": "https://api.acmefintech.com/webhooks/identity",
    "status": "active",
    "createdAt": "2026-08-07T19:30:00.000Z"
  }
}
```

---

### 1.4 Rotate API Key
**`POST /api/v1/identity/api-key/rotate`**

Invalidates the current API Key and generates a brand-new API key.

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "API Key rotated successfully",
  "data": {
    "apiKey": "id_live_99887766554433221100aabbccddeeff1122334455667788"
  }
}
```

---

### 1.5 Set Webhook URL
**`POST /api/v1/identity/settings/webhook`**

Registers or updates your HTTP Webhook URL to receive automated async verification and wallet funding event payloads.

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Request Body:**
```json
{
  "webhookUrl": "https://api.acmefintech.com/webhooks/identity"
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Webhook URL updated successfully",
  "data": {
    "webhookUrl": "https://api.acmefintech.com/webhooks/identity"
  }
}
```

---

## 2. Wallet & Funding

### 2.1 Fund Wallet (Generate Virtual Account)
**`POST /api/v1/identity/wallet/fund`**

Generates a dedicated dynamic virtual bank account number to credit your identity verification balance.

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Request Body:**
```json
{
  "amount": 5000
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Virtual account generated for wallet funding. Transfer funds to complete.",
  "data": {
    "transactionId": "ID_FUND_17400011223344",
    "virtualAccount": {
      "bankName": "SafeHaven Microfinance Bank",
      "accountNumber": "9901234567",
      "accountName": "BILLBOLT - Acme Fintech Solutions Ltd",
      "bankCode": "090286",
      "amount": 5000,
      "expiresInSeconds": 900
    }
  }
}
```

---

### 2.2 Get Wallet Balance
**`GET /api/v1/identity/wallet/balance`**

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "walletBalance": 4940.0,
    "currency": "NGN"
  }
}
```

---

### 2.3 List Transactions & Verification History
**`GET /api/v1/identity/transactions?page=1&limit=20&type=verification_nin`**

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Query Parameters:**
- `page`: Page number (default: `1`)
- `limit`: Number of records per page (default: `20`)
- `type`: `funding`, `verification_nin`, `verification_bvn`
- `status`: `pending`, `successful`, `failed`

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "total": 1,
    "page": 1,
    "pages": 1,
    "transactions": [
      {
        "id": 10,
        "clientId": 1,
        "transactionId": "ID_NIN_17400055443322",
        "type": "verification_nin",
        "amount": 60,
        "previousBalance": 5000,
        "newBalance": 4940,
        "paymentStatus": "successful",
        "identityNumber": "72022553879",
        "identityId": "6a761a8da4069463bbd97463",
        "createdAt": "2026-08-07T19:35:00.000Z"
      }
    ]
  }
}
```

---

## 3. NIN Identity Verification

The fee for each NIN verification is automatically debited from your identity wallet balance based on the current setting (default: **₦60 per verification**).
`debitAccountNumber` is **NOT required** in your request payload — it is managed securely on the backend.

### 3.1 Initiate NIN Verification
**`POST /api/v1/identity/nin/initiate`**

Initiates NIN verification. Triggers an OTP sent to the registered phone number attached to the NIN.

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Request Body:**
```json
{
  "number": "72022553879",
  "async": false
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "OTP sent. Copy the identityId from data below and use it to call verify endpoint.",
  "data": {
    "statusCode": 200,
    "data": {
      "_id": "6a761a8da4069463bbd97463",
      "clientId": "695e5e45aec27700242d76e0",
      "identityNumber": "72022553879",
      "type": "NIN",
      "amount": 50,
      "status": "SUCCESS",
      "debitAccountNumber": "0117169247",
      "otpVerified": false,
      "otpResendCount": 0,
      "createdAt": "2026-08-07T17:49:01.051Z",
      "provider": "truztcube",
      "otpId": "6a761a902ec299002520b1f8"
    },
    "phoneAndDobVerified": false,
    "message": "Otp sent successfully to phone number ending with 4615. Didn’t get it? Dial *347*238#."
  }
}
```

---

### 3.2 Validate / Verify NIN OTP
**`POST /api/v1/identity/nin/verify`**

Validates the OTP code entered by the user. On success, returns full NIN record details.

**Headers:** `x-api-key: <API_KEY>` or `Authorization: Bearer <TOKEN>`

**Request Body:**
```json
{
  "identityId": "6a761a8da4069463bbd97463",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "status": 200,
  "message": "Verification result retrieved successfully",
  "data": {
    "statusCode": 200,
    "message": "record fetched successfully",
    "data": {
      "_id": "6a761a8da4069463bbd97463",
      "identityNumber": "72022553879",
      "type": "NIN",
      "status": "SUCCESS",
      "otpVerified": true,
      "providerResponse": {
        "nin": "72022553879",
        "fullName": "CHINAZA OGBONNA",
        "firstName": "CHINAZA",
        "middleName": "",
        "lastName": "OGBONNA",
        "dateOfBirth": "28-07-1999",
        "gender": "m",
        "phone": "08184724615",
        "residentialAddress": "7B JAYMOLA CLOSE MINISTERS HILL"
      }
    }
  }
}
```

---

## 4. Webhook Payload Specifications

When you set your `webhookUrl`, our server automatically posts real-time event notifications to your server.

### 4.1 Webhook Event: `identity.wallet.funded`
Sent when your virtual bank transfer payment completes and your wallet is credited.

```json
{
  "event": "identity.wallet.funded",
  "timestamp": "2026-08-07T19:40:00.000Z",
  "data": {
    "transactionId": "ID_FUND_17400011223344",
    "amount": 5000,
    "previousBalance": 0,
    "newBalance": 5000,
    "status": "successful"
  }
}
```

### 4.2 Webhook Event: `identity.nin.verified`
Sent asynchronously when a NIN verification OTP is validated.

```json
{
  "event": "identity.nin.verified",
  "timestamp": "2026-08-07T19:42:00.000Z",
  "data": {
    "transactionId": "ID_NIN_17400055443322",
    "identityId": "6a761a8da4069463bbd97463",
    "status": "SUCCESS",
    "verificationResult": {
      "statusCode": 200,
      "message": "record fetched successfully",
      "data": {
        "identityNumber": "72022553879",
        "otpVerified": true,
        "providerResponse": {
          "nin": "72022553879",
          "fullName": "CHINAZA OGBONNA",
          "firstName": "CHINAZA",
          "lastName": "OGBONNA",
          "dateOfBirth": "28-07-1999",
          "gender": "m",
          "phone": "08184724615"
        }
      }
    }
  }
}
```

---

## 5. Internal Backend Access (Without Client API Key)

If your internal backend needs to trigger NIN verification directly without creating or using an external client API key:

### 5.1 Internal Initiate NIN
**`POST /api/v1/identity/internal/nin/initiate`**

**Headers:**
```http
Content-Type: application/json
x-internal-service: true
```

**Request Body:**
```json
{
  "number": "72022553879"
}
```

### 5.2 Internal Verify NIN OTP
**`POST /api/v1/identity/internal/nin/verify`**

**Headers:**
```http
Content-Type: application/json
x-internal-service: true
```

**Request Body:**
```json
{
  "identityId": "6a761a8da4069463bbd97463",
  "otp": "123456"
}
```
