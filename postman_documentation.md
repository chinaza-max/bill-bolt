# Bill Bolt API — Complete Postman Documentation

This document contains full HTTP endpoints, parameters, request payloads, headers, and responses for the entire Bill Bolt backend service.

---

## ─── Authentication & Onboarding (Unprotected) ───
Base URL Path: `/api/v1/auth`

### 1. User Registration
* **Method**: `POST`
* **Route**: `/registerUser`
* **Body (JSON)**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john.doe@example.com",
  "password": "SecurePassword123",
  "tel": "+2348012345678",
  "telCode": "NG"
}
```

### 2. Login User
* **Method**: `POST`
* **Route**: `/loginUser`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

### 3. Check Google Email
* **Method**: `POST`
* **Route**: `/checkGoogleEmail`
* **Body (JSON)**:
```json
{
  "email": "john.doe@gmail.com"
}
```

### 4. Google Signup
* **Method**: `POST`
* **Route**: `/googleSignup`
* **Body (JSON)**:
```json
{
  "email": "john.doe@gmail.com",
  "googleId": "google_sub_id",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 5. Send Verification Code (Email/Tel)
* **Method**: `POST`
* **Route**: `/sendVerificationCodeEmailOrTel`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com",
  "tel": "+2348012345678"
}
```

### 6. Verify Code (Email/Tel)
* **Method**: `POST`
* **Route**: `/verifyEmailorTel`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com",
  "tel": "+2348012345678",
  "otp": "123456"
}
```

### 7. Send Password Reset Link
* **Method**: `POST`
* **Route**: `/sendPasswordResetLink`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com"
}
```

### 8. Reset Password
* **Method**: `POST`
* **Route**: `/resetPassword`
* **Body (JSON)**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123"
}
```

### 9. Send PIN Reset OTP
* **Method**: `POST`
* **Route**: `/sendPinResetOtp`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com"
}
```

### 10. Verify PIN Reset OTP
* **Method**: `POST`
* **Route**: `/verifyPinResetOtp`
* **Body (JSON)**:
```json
{
  "emailAddress": "john.doe@example.com",
  "otp": "123456"
}
```

### 11. Refresh Access Token
* **Method**: `POST`
* **Route**: `/refreshAccessToken`
* **Body (JSON)**:
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

### 12. Ping
* **Method**: `GET`
* **Route**: `/ping`

---

## ─── Protected Routes (Requires Bearer Token) ───
Base URL Path: `/api/v1/user`
Headers required:
```http
Authorization: Bearer <your_jwt_access_token>
```

### 1. User Profile & Settings

#### 1.1 Get Profile Information
* **Method**: `GET`
* **Route**: `/getProfileInformation`

#### 1.2 Update Profile
* **Method**: `POST`
* **Route**: `/updateProfile`
* **Body (Multipart/Form-Data)**:
  * `image` (File)
  * `firstName` (String)
  * `lastName` (String)
  * `describeYou` (String)
  * `lat` (String)
  * `lng` (String)

#### 1.3 Update PIN
* **Method**: `POST`
* **Route**: `/updatePin`
* **Body (JSON)**:
```json
{
  "oldPin": "1234",
  "newPin": "5678"
}
```

#### 1.4 Set PIN
* **Method**: `POST`
* **Route**: `/setPin`
* **Body (JSON)**:
```json
{
  "pin": "1234"
}
```

#### 1.5 Enter Passcode (Verification)
* **Method**: `POST`
* **Route**: `/enterPassCode`
* **Body (JSON)**:
```json
{
  "passCode": "123456"
}
```

---

### 2. Identity Verification (NIN)

#### 2.1 Initiate NIN Verification
* **Method**: `POST`
* **Route**: `/initiateNINVerify`
* **Body (JSON)**:
```json
{
  "nin": "12345678901"
}
```

#### 2.2 Verify NIN with OTP
* **Method**: `POST`
* **Route**: `/verifyNIN`
* **Body (JSON)**:
```json
{
  "nin": "12345678901",
  "otp": "987654"
}
```

#### 2.3 Upload NIN Image Card
* **Method**: `POST`
* **Route**: `/uploadNIN`
* **Body (Multipart/Form-Data)**:
  * `ninImage` (File)

---

### 3. Virtual Accounts & Wallet Operations

#### 3.1 Generate Virtual Account
* **Method**: `POST`
* **Route**: `/generateAccountVirtual`

#### 3.2 Get Bank Details
* **Method**: `GET`
* **Route**: `/bank-details`

#### 3.3 Get Available Bank List
* **Method**: `GET`
* **Route**: `/getBank`

#### 3.4 Name Enquiry
* **Method**: `GET`
* **Route**: `/nameEnquiry?accountNumber=1234567890&bankCode=999222`

#### 3.5 Bank Transfer
* **Method**: `GET`
* **Route**: `/transferMoney?amount=5000&accountNumber=1234567890&bankCode=999222&narration=Transfer`

#### 3.6 Confirm Transfer Receipt
* **Method**: `POST`
* **Route**: `/confirmTransfer`
* **Body (JSON)**:
```json
{
  "transactionId": "tx_id_here"
}
```

---

### 4. Transactions & Order Management

#### 4.1 Get General Transaction List
* **Method**: `GET`
* **Route**: `/getGeneralTransaction`

#### 4.2 Get Transaction History
* **Method**: `GET`
* **Route**: `/getTransactionHistory`

#### 4.3 Get Transaction History (Orders)
* **Method**: `GET`
* **Route**: `/getTransactionHistoryOrder`

#### 4.4 Get My Orders
* **Method**: `GET`
* **Route**: `/getMyOrders?page=1&limit=10`

#### 4.5 Get My Order Details
* **Method**: `GET`
* **Route**: `/getMyOrderDetails?orderId=12`

#### 4.6 Accept or Cancel Order
* **Method**: `POST`
* **Route**: `/orderAcceptOrCancel`
* **Body (JSON)**:
```json
{
  "orderId": 12,
  "action": "accept" 
}
```

#### 4.7 Verify & Complete Order
* **Method**: `POST`
* **Route**: `/verifyCompleteOrder`
* **Body (JSON)**:
```json
{
  "orderId": 12,
  "otp": "482019"
}
```

#### 4.8 Get Order Charge Summary
* **Method**: `POST`
* **Route**: `/getChargeSummary`
* **Body (JSON)**:
```json
{
  "merchantId": 5,
  "amount": 5000
}
```

#### 4.9 Pay For Order
* **Method**: `POST`
* **Route**: `/makeOrderPayment`
* **Body (JSON)**:
```json
{
  "orderId": 12
}
```

---

### 5. Merchants & Advertisements (Ads)

#### 5.1 Signup as Merchant
* **Method**: `POST`
* **Route**: `/signupMerchant`
* **Body (JSON)**:
```json
{
  "displayName": "Okonkwo Cash Point",
  "minAmount": 1000,
  "maxAmount": 50000
}
```

#### 5.2 Get Merchant Information
* **Method**: `POST`
* **Route**: `/getMerchantInformation`
* **Body (JSON)**:
```json
{
  "merchantId": 12
}
```

#### 5.3 Get Merchant Profile Details
* **Method**: `GET`
* **Route**: `/getMerchantProfile`

#### 5.4 Check if User Has Merchant Ads Active
* **Method**: `GET`
* **Route**: `/hasMerchantAds`

#### 5.5 Create Merchant Ad Postings
* **Method**: `POST`
* **Route**: `/createMerchantAds`
* **Body (JSON)**:
```json
{
  "amount": 10000,
  "charge": 300
}
```

#### 5.6 Get My Active Ad Postings
* **Method**: `GET`
* **Route**: `/getMyAds`

#### 5.7 Get Default System Ad Settings
* **Method**: `GET`
* **Route**: `/getdefaultAds`

#### 5.8 Get My Transaction Range/Limits
* **Method**: `GET`
* **Route**: `/getMyRangeLimit`

#### 5.9 Get Merchant Order Performance Stats
* **Method**: `GET`
* **Route**: `/getOrderStatistic`

#### 5.10 Get Merchant Pending Orders
* **Method**: `GET`
* **Route**: `/merchant/pendingOrders`

---

### 6. Special Withdrawal Features (New)

#### 6.1 Get All / Active Denominations
* **Method**: `GET`
* **Route**: `/api/v1/user/sw/denominations`
* **Headers**: `Authorization: Bearer <TOKEN>` *(available to all authenticated users)*
* **Description**: Returns denominations for Special Withdrawal. By default, only returns **enabled** denominations. Admin can pass `?includeAll=true` to see **all** denominations including disabled ones.
* **Query Parameters**:
  * `includeAll` *(boolean string, optional, default: `false`)*: Pass `"true"` to include disabled/all denominations (admin use). Pass `"false"` or omit for active-only (public use).
* **Example URLs**:
  * `GET /api/v1/user/sw/denominations` — Returns only enabled denominations (for customers/merchants).
  * `GET /api/v1/user/sw/denominations?includeAll=true` — Returns all denominations including disabled (for admin panel).
* **Default denominations seeded at startup** (NGN): ₦5, ₦10, ₦20, ₦50, ₦100, ₦200, ₦500, ₦1000.
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Denominations retrieved successfully",
  "data": [
    { "id": 1, "value": 5,    "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 2, "value": 10,   "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 3, "value": 20,   "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 4, "value": 50,   "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 5, "value": 100,  "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 6, "value": 200,  "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 7, "value": 500,  "currency": "NGN", "isEnabled": true, "isDeleted": false },
    { "id": 8, "value": 1000, "currency": "NGN", "isEnabled": true, "isDeleted": false }
  ]
}
```
*(Results are sorted by `value` ASC)*

#### 6.2 Get Distance Cost Quotation
* **Method**: `POST`
* **Route**: `/sw/quotation`
* **Body (JSON)**:
```json
{
  "merchantId": 12,
  "denominationId": 7,
  "amount": 10000,
  "deliveryLat": "6.4281",
  "deliveryLng": "3.4219"
}
```

#### 6.3 Place Special Withdrawal Request
* **Method**: `POST`
* **Route**: `/sw/request`
* **Body (JSON)**:
```json
{
  "merchantId": 12,
  "denominationId": 7,
  "amount": 10000,
  "deliveryLat": "6.4281",
  "deliveryLng": "3.4219",
  "deliveryAddress": "12 Admiralty Way, Lekki Phase 1"
}
```

#### 6.4 Transition Special Withdrawal Action
* **Method**: `POST`
* **Route**: `/sw/request/action`
* **Body (JSON)**:
```json
{
  "requestId": 1,
  "action": "complete",
  "otp": "589211"
}
```
*(Valid actions: `accept`, `reject`, `cancel`, `enRoute`, `arrived`, `complete`)*

#### 6.5 List My Special Withdrawal Requests
* **Method**: `GET`
* **Route**: `/sw/requests?role=client&status=completed&page=1&limit=20`

#### 6.6 Get Specific Request Details
* **Method**: `GET`
* **Route**: `/sw/request/1`

#### 6.7 Get Merchant Special Withdrawal Profile
* **Method**: `GET`
* **Route**: `/sw/merchant/profile`

#### 6.8 Update Merchant Special Withdrawal Profile Settings
* **Method**: `POST`
* **Route**: `/sw/merchant/profile`
* **Body (JSON)**:
```json
{
  "isEnabled": true,
  "minWithdrawalAmount": 1000,
  "maxWithdrawalAmount": 100000,
  "autoAccept": true,
  "isOnline": true,
}
```

#### 6.9 Get Merchant Denomination Charges
* **Method**: `GET`
* **Route**: `/sw/merchant/charges`

#### 6.10 Update Merchant Denomination Charges
* **Method**: `POST`
* **Route**: `/sw/merchant/charges`
* **Body (JSON)**:
```json
{
  "charges": [
    { "denominationId": 7, "charge": 150 },
    { "denominationId": 8, "charge": 250 }
  ]
}
```

#### 6.11 Get Merchant Special Withdrawal Earnings Summary
* **Method**: `GET`
* **Route**: `/sw/merchant/earnings`

---

### 7. Support & Complaints

#### 7.1 Submit Customer Complaint
* **Method**: `POST`
* **Route**: `/submitComplain`
* **Body (JSON)**:
```json
{
  "title": "Failed Bank Transfer",
  "description": "I did not receive funds but my wallet was debited."
}
```

#### 7.2 Get Complaints Log
* **Method**: `GET`
* **Route**: `/getComplaints`

---

### 8. Push Notifications

#### 8.1 Get Notifications List
* **Method**: `GET`
* **Route**: `/notification`

#### 8.2 Get Unread Count
* **Method**: `GET`
* **Route**: `/notification/unread/count`

#### 8.3 Mark Notification as Read
* **Method**: `POST`
* **Route**: `/notification/read`
* **Body (JSON)**:
```json
{
  "notificationId": "notif_id_here"
}
```

#### 8.4 Delete/Dismiss Notification
* **Method**: `POST`
* **Route**: `/notification/delete`
* **Body (JSON)**:
```json
{
  "notificationId": "notif_id_here"
}
```

#### 8.5 Update FCM Notification Push Token
* **Method**: `POST`
* **Route**: `/updateToken`
* **Body (JSON)**:
```json
{
  "token": "fcm_token_device_string"
}
```

---

## ─── Admin Console Endpoints (Requires Admin Privilege) ───
Base URL Path: `/api/v1/user`

### 1. General System Administration

#### 1.1 Dashboard Stats Overview
* **Method**: `GET`
* **Route**: `/dashBoardStatistic`

#### 1.2 Get User List (Admin Dashboard view)
* **Method**: `GET`
* **Route**: `/getUsers?page=1&limit=20`

#### 1.3 Get All System Settings
* **Method**: `GET`
* **Route**: `/api/v1/user/getSettings`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Description**: Returns all global configuration settings stored in the system (row 1 of `Setting` table), including general system configs, verification toggles, gateway configurations, tier limits, break points, and Special Withdrawal settings.
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "successfully.",
  "data": {
    "id": 1,
    "distanceThreshold": 10,
    "validFor": 900,
    "walletBalance": {
      "previous": 0,
      "current": 0
    },
    "callbackUrl": "https://api.billbolt.com/webhook",
    "maxOrderPerMerchant": 5,
    "tiers": [
      {
        "name": "Tier 1",
        "maxAmount": 50000,
        "maxTransfersPerDay": 5,
        "uniqueNumber": 1,
        "country": "NG"
      }
    ],
    "gateWayEnvironment": "sandBox",
    "activeGateway": "safeHaven.gateway",
    "isMatchRunning": false,
    "defaultAds": [],
    "gatewayService": [],
    "serviceCharge": [],
    "gatewayList": ["safeHaven.gateway", "paystack.gateway"],
    "breakPoint": [],
    "ninVerificationEnabled": true,
    "ninImageUploadEnabled": true,
    "nameVerificationEnabled": true,
    "faceVerificationEnabled": true,
    "matchStartedAt": null,
    "specialWithdrawalEnabled": true,
    "defaultTransportationPricePerMeter": 0.5,
    "specialWithdrawalCompanyChargePercentage": 10.0,
    "specialWithdrawalChargeBearer": "Customer",
    "specialWithdrawalDefaultCurrency": "NGN",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-07-25T20:00:00.000Z"
  }
}
```

#### 1.4 Update All / Any System Settings
* **Method**: `POST`
* **Route**: `/api/v1/user/manageBreakPoint`
* **Headers**: 
  * `Authorization: Bearer <ADMIN_TOKEN>`
  * `Content-Type: application/json`
* **Description**: Updates one or multiple fields in the global system settings table. Accepts general configuration parameters, verification toggles, break points, and Special Withdrawal configuration.
* **Body (JSON)**:
```json
{
  "distanceThreshold": 10,
  "validFor": 900,
  "maxOrderPerMerchant": 5,
  "gateWayEnvironment": "sandBox",
  "activeGateway": "safeHaven.gateway",
  "callbackUrl": "https://api.billbolt.com/webhook",
  "specialWithdrawalEnabled": true,
  "defaultTransportationPricePerMeter": 0.5,
  "specialWithdrawalCompanyChargePercentage": 10.0,
  "specialWithdrawalChargeBearer": "Customer",
  "specialWithdrawalDefaultCurrency": "NGN"
}
```
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Settings updated successfully",
  "data": {
    "id": 1,
    "distanceThreshold": 10,
    "validFor": 900,
    "maxOrderPerMerchant": 5,
    "gateWayEnvironment": "sandBox",
    "activeGateway": "safeHaven.gateway",
    "specialWithdrawalEnabled": true,
    "defaultTransportationPricePerMeter": 0.5,
    "specialWithdrawalCompanyChargePercentage": 10.0,
    "specialWithdrawalChargeBearer": "Customer",
    "specialWithdrawalDefaultCurrency": "NGN",
    "updatedAt": "2026-07-25T20:20:00.000Z"
  }
}
```


#### 1.5 Toggle User Account Lock State
* **Method**: `POST`
* **Route**: `/toggleUserAccount`
* **Body (JSON)**:
```json
{
  "userId": 5,
  "status": true
}
```

#### 1.6 Toggle Withdrawal Access State
* **Method**: `POST`
* **Route**: `/toggleWithdrawal`
* **Body (JSON)**:
```json
{
  "userId": 5,
  "allow": false
}
```

#### 1.7 Admin Create New Admin User
* **Method**: `POST`
* **Route**: `/createAdmin`
* **Body (JSON)**:
```json
{
  "emailAddress": "newadmin@example.com",
  "password": "SecurePassword123",
  "firstName": "Super",
  "lastName": "Admin",
  "privilege": "admin"
}
```

---

### 2. Admin Special Withdrawal Management

#### 2.1 Get Special Withdrawal Settings
* **Method**: `GET`
* **Route**: `/api/v1/user/sw/admin/settings`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Description**: Fetches current global system settings for Special Withdrawal, including master toggle, transportation rates, company fee percentage, charge bearer, and currency.
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Settings retrieved successfully",
  "data": {
    "specialWithdrawalEnabled": true,
    "defaultTransportationPricePerMeter": 0.5,
    "specialWithdrawalCompanyChargePercentage": 10.0,
    "specialWithdrawalChargeBearer": "Customer",
    "specialWithdrawalDefaultCurrency": "NGN"
  }
}
```

#### 2.2 Update Special Withdrawal Settings
* **Method**: `PATCH`
* **Route**: `/api/v1/user/sw/admin/settings`
* **Headers**: 
  * `Authorization: Bearer <ADMIN_TOKEN>`
  * `Content-Type: application/json`
* **Description**: Partial update of global Special Withdrawal configuration. All payload fields are optional, but at least one setting must be provided.
* **Body (JSON)**:
```json
{
  "specialWithdrawalEnabled": true,
  "defaultTransportationPricePerMeter": 0.5,
  "specialWithdrawalCompanyChargePercentage": 10.0,
  "specialWithdrawalChargeBearer": "Customer",
  "specialWithdrawalDefaultCurrency": "NGN"
}
```
* **Field Specifications**:
  * `specialWithdrawalEnabled` *(boolean, optional)*: Master feature toggle for enabling (`true`) or disabling (`false`) Special Withdrawal nationwide.
  * `defaultTransportationPricePerMeter` *(number, min 0, optional)*: Default price charged per meter for delivery/logistics distance calculation.
  * `specialWithdrawalCompanyChargePercentage` *(number, min 0, max 100, optional)*: Percentage fee retained by the platform on each withdrawal.
  * `specialWithdrawalChargeBearer` *(string, enum, optional)*: Who pays the company commission fee. Allowed values: `"Customer"`, `"Merchant"`, or `"Both"`.
  * `specialWithdrawalDefaultCurrency` *(string, optional)*: Default currency code (e.g., `"NGN"`).
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Settings updated successfully",
  "data": {
    "id": 1,
    "specialWithdrawalEnabled": true,
    "defaultTransportationPricePerMeter": 0.5,
    "specialWithdrawalCompanyChargePercentage": 10,
    "specialWithdrawalChargeBearer": "Customer",
    "specialWithdrawalDefaultCurrency": "NGN",
    "updatedAt": "2026-07-25T19:50:00.000Z"
  }
}
```

#### 2.3 Create Denomination Configuration
* **Method**: `POST`
* **Route**: `/api/v1/user/sw/admin/denomination`
* **Headers**: 
  * `Authorization: Bearer <ADMIN_TOKEN>`
  * `Content-Type: application/json`
* **Body (JSON)**:
```json
{
  "value": 500,
  "currency": "NGN",
  "isEnabled": true
}
```
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Denomination created successfully",
  "data": {
    "id": 8,
    "value": 500,
    "currency": "NGN",
    "isEnabled": true,
    "isDeleted": false,
    "updatedAt": "2026-07-25T19:50:00.000Z",
    "createdAt": "2026-07-25T19:50:00.000Z"
  }
}
```

#### 2.4 Update Denomination Configuration
* **Method**: `PATCH`
* **Route**: `/api/v1/user/sw/admin/denomination`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body (JSON)**:
```json
{
  "denominationId": 7,
  "isEnabled": false
}
```

#### 2.5 Delete Denomination Configuration (Soft-Delete)
* **Method**: `DELETE`
* **Route**: `/api/v1/user/sw/admin/denomination/7`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`

#### 2.6 Approve, Suspend, Disable, or Set Pending for Merchant's Special Withdrawal Service Status
* **Method**: `POST`
* **Route**: `/api/v1/user/sw/admin/merchant/status`
* **Headers**: 
  * `Authorization: Bearer <ADMIN_TOKEN>`
  * `Content-Type: application/json`
* **Body (JSON)**:
```json
{
  "merchantId": 12,
  "serviceStatus": "Active"
}
```
*(Valid service statuses: `"Pending"`, `"Active"`, `"Suspended"`, `"Disabled"`. Automatically dispatches push notifications to the merchant.)*
* **Success Response (200 OK)**:
```json
{
  "status": 200,
  "message": "Merchant status updated successfully",
  "data": {
    "id": 5,
    "merchantId": 12,
    "isEnabled": true,
    "serviceStatus": "Active",
    "minWithdrawalAmount": 1000,
    "maxWithdrawalAmount": 50000,
    "updatedAt": "2026-07-25T20:55:00.000Z"
  }
}
```

#### 2.7 List Special Withdrawal Merchant Profiles (Filter by Status / Exclude Pending)
* **Method**: `GET`
* **Route**: `/api/v1/user/sw/admin/merchants`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Description**: Returns special withdrawal merchant profiles with flexible filters. Supports filtering by exact `serviceStatus`, excluding `Pending` profiles, or filtering by `isEnabled`.
* **Query Parameters**:
  * `excludePending` *(boolean/string, optional)*: Pass `"true"` to fetch all merchants whose `serviceStatus` is **NOT equal to `Pending`** (i.e. returns `Active`, `Suspended`, `Disabled`).
  * `serviceStatusNot` *(string, optional)*: Filter by excluding a specific status (e.g. `serviceStatusNot=Pending`).
  * `serviceStatus` *(string, optional)*: Exact status match (`"Pending"`, `"Active"`, `"Suspended"`, `"Disabled"`). Can also pass `!Pending` to exclude `Pending`.
  * `isEnabled` *(boolean/string, optional)*: Filter by whether merchant has enabled special withdrawal (`"true"` or `"false"`).
  * `page` *(number, optional, default: 1)*: Page number.
  * `limit` *(number, optional, default: 20)*: Page size.

* **Example Request 1 (Fetch merchants whose service status is NOT Pending)**:
  `GET /api/v1/user/sw/admin/merchants?excludePending=true&page=1&limit=20`

* **Example Request 2 (Fetch Pending approval applications)**:
  `GET /api/v1/user/sw/admin/merchants?serviceStatus=Pending&page=1&limit=20`

* **Success Response Example (200 OK)**:
```json
{
  "status": 200,
  "message": "Merchants retrieved successfully",
  "data": {
    "merchants": [
      {
        "id": 1,
        "merchantId": 12,
        "isEnabled": true,
        "minWithdrawalAmount": 1000,
        "maxWithdrawalAmount": 500000,
        "autoAccept": false,
        "isOnline": true,
        "serviceStatus": "Active",
        "rating": "5.00",
        "createdAt": "2026-07-20T10:00:00.000Z",
        "Merchant": {
          "id": 12,
          "firstName": "Super",
          "lastName": "Vendor",
          "emailAddress": "vendor@example.com",
          "tel": "+2348012345678",
          "imageUrl": "https://...",
          "lat": "6.5244",
          "lng": "3.3792",
          "isOnline": true,
          "state": "Lagos"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

#### 2.8 Special Withdrawal Analytics Overview
* **Method**: `GET`
* **Route**: `/api/v1/user/sw/admin/analytics`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`

