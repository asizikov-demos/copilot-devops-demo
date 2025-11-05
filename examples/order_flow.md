# Order Processing Flow

## Overview

This document describes the end-to-end order processing flow for the e-commerce platform, including all services involved and their interactions.

## Services

The platform consists of four main services:

1. **User Service** - Manages user authentication and profiles
2. **Order Service** - Processes customer orders and manages order lifecycle
3. **Payment Service** - Handles payment processing via payment gateway
4. **Data Service** - Handles data operations and lookups

## Service Architecture

```mermaid
graph TB
    subgraph "E-Commerce Platform"
        US[User Service]
        OS[Order Service]
        PS[Payment Service]
        DS[Data Service]
        
        US -->|User Authentication| OS
        OS -->|Process Payment| PS
        OS -->|Data Lookups| DS
        PS -->|Payment Confirmation| OS
    end
    
    subgraph "External Systems"
        PG[Payment Gateway]
        DB[(Database)]
    end
    
    PS -->|Payment Processing| PG
    DS -->|Data Operations| DB
    US -->|User Data| DB
    OS -->|Order Data| DB
```

## Order Processing Flow

### Complete Order Lifecycle Sequence

```mermaid
sequenceDiagram
    participant User
    participant UserService as User Service
    participant OrderService as Order Service
    participant PaymentService as Payment Service
    participant DataService as Data Service
    participant Gateway as Payment Gateway
    
    %% User Login
    User->>UserService: Login Request
    UserService->>UserService: Look up user
    UserService->>UserService: Verify password
    UserService-->>User: Login Success
    
    %% Order Creation
    User->>OrderService: Create Order
    OrderService->>OrderService: Create order ID
    OrderService->>OrderService: Validate order items
    OrderService-->>User: Order Created Successfully
    
    %% Payment Processing
    OrderService->>PaymentService: Process Payment
    PaymentService->>PaymentService: Validate payment amount
    PaymentService->>Gateway: Contact Payment Gateway
    Gateway-->>PaymentService: Payment Response
    
    alt Payment Success
        PaymentService-->>OrderService: Payment Successful
        OrderService->>OrderService: Confirm payment received
        OrderService->>OrderService: Allocate inventory
        OrderService->>OrderService: Start fulfillment
        OrderService-->>User: Order Fulfillment Started
    else Payment Failed
        PaymentService-->>OrderService: Payment Failed
        OrderService-->>User: Order Payment Failed
    end
```

## Event Types

The system tracks the following event types:

1. **user_login** - User authentication events
2. **order_creation** - Order creation and validation
3. **payment_processing** - Payment processing via gateway
4. **order_fulfillment** - Order fulfillment and inventory allocation
5. **data_lookup** - Data retrieval operations

## Order Processing Steps

### 1. Order Creation
- **Service**: Order Service
- **Steps**:
  1. Receive order creation request from user
  2. Generate unique order ID
  3. Validate order items
  4. Create order record
  5. Return order confirmation

### 2. Payment Processing
- **Service**: Payment Service
- **Steps**:
  1. Receive payment request from Order Service
  2. Validate payment amount
  3. Contact external payment gateway
  4. Process payment response
  5. Return payment result (success/failure)

### 3. Order Fulfillment
- **Service**: Order Service
- **Steps**:
  1. Receive payment confirmation from Payment Service
  2. Allocate inventory for the order
  3. Initiate fulfillment process
  4. Calculate estimated delivery date
  5. Update order status

## Error Handling

The system handles various failure scenarios:

- **Order Creation Failures**: OutOfMemoryError, validation errors
- **Payment Failures**: Payment gateway timeout, insufficient funds, invalid payment details
- **Data Lookup Failures**: Timeout, connection errors

## Flow Diagram: Successful Order

```mermaid
flowchart TD
    Start([User Places Order]) --> Create[Order Service: Create Order]
    Create --> Validate[Order Service: Validate Items]
    Validate --> Success{Validation<br/>Success?}
    
    Success -->|No| Fail1([Order Creation Failed])
    Success -->|Yes| OrderCreated[Order Created]
    
    OrderCreated --> Payment[Payment Service: Process Payment]
    Payment --> Gateway[Contact Payment Gateway]
    Gateway --> PaymentResult{Payment<br/>Success?}
    
    PaymentResult -->|No| Fail2([Payment Failed])
    PaymentResult -->|Yes| Confirm[Order Service: Payment Confirmed]
    
    Confirm --> Allocate[Order Service: Allocate Inventory]
    Allocate --> Fulfill[Order Service: Start Fulfillment]
    Fulfill --> Complete([Order Fulfillment Started])
    
    style Start fill:#e1f5ff
    style Complete fill:#d4edda
    style Fail1 fill:#f8d7da
    style Fail2 fill:#f8d7da
```

## Key Observations

1. **Sequential Processing**: Orders are processed in a sequential manner: Creation → Payment → Fulfillment
2. **Service Isolation**: Each service handles its specific domain (user, order, payment, data)
3. **Event Tracking**: All operations are tracked via trace events with status monitoring
4. **Multiple Instances**: Each service runs multiple instances for scalability and reliability
5. **External Dependencies**: Payment service depends on external payment gateway
6. **Failure Recovery**: System handles failures gracefully at each stage (order creation, payment processing)

## Status Tracking

Each trace event has a status:
- `success` - Operation completed successfully
- `failed` - Operation failed with error details logged
