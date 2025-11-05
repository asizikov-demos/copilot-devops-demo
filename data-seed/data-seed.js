const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'db.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/**
 * Initialize the database schema from the SQL file
 */
function initSchema() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to the database.');
        });

        // Read the schema SQL file
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

        // Execute the schema
        db.exec(schema, (err) => {
            if (err) {
                db.close();
                reject(err);
                return;
            }
            console.log('Schema initialized successfully.');
            
            db.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Database connection closed.');
                resolve();
            });
        });
    });
}

/**
 * Generate mock events and populate the database
 */
function generateEvents() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to the database for data generation.');
        });

        const services = ['data-service', 'user-service', 'order-service', 'payment-service'];
        const users = Array.from({ length: 11 }, (_, i) => `user${String(i + 1).padStart(3, '0')}`);
        const baseTime = new Date('2025-10-31 02:04:04');
        
        const logs = [];
        const traceEvents = [];
        let logId = 1;

        // Helper function to add log
        function addLog(timestamp, serviceId, instanceId, level, traceEventId, template, formatted, params) {
            logs.push({
                timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19),
                service_id: serviceId,
                instance_id: instanceId,
                level: level,
                trace_event_id: traceEventId,
                message_template: template,
                message_formatted: formatted,
                params_json: JSON.stringify(params)
            });
        }

        // Helper function to add trace event
        function addTraceEvent(traceId, userId, eventType, startedAt, completedAt, status) {
            traceEvents.push({
                trace_event_id: traceId,
                user_id: userId,
                event_type: eventType,
                started_at: startedAt.toISOString().replace('T', ' ').substring(0, 19),
                completed_at: completedAt ? completedAt.toISOString().replace('T', ' ').substring(0, 19) : null,
                status: status
            });
        }

        // Generate UUIDs for trace events
        function generateTraceId() {
            return 'trace-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }

        // 1. Services startup (04:04 - 04:10)
        console.log('Generating service startup logs...');
        services.forEach(service => {
            for (let instance = 0; instance < 5; instance++) {
                const startupTime = new Date(baseTime.getTime() + instance * 60000 + Math.random() * 60000);
                const traceId = generateTraceId();
                addLog(
                    startupTime,
                    service,
                    instance,
                    'info',
                    traceId,
                    'Service {service} instance {instance} started',
                    `Service ${service} instance ${instance} started`,
                    [service, instance]
                );
            }
        });

        // 2. User login flows
        console.log('Generating user login flows...');
        const loginStartTime = new Date(baseTime.getTime() + 10 * 60000); // Start at 04:14
        const successfulUsers = [];
        const failedUser = users[10]; // user011 fails

        users.forEach((userId, idx) => {
            const userLoginTime = new Date(loginStartTime.getTime() + idx * 30000); // 30 sec apart
            const traceId = generateTraceId();
            const instanceId = idx % 5;
            const isFailure = userId === failedUser;

            addTraceEvent(traceId, userId, 'user_login', userLoginTime, null, 'in_progress');

            // User lookup
            addLog(
                new Date(userLoginTime.getTime() + 100),
                'user-service',
                instanceId,
                'info',
                traceId,
                'Looking up user {userId}',
                `Looking up user ${userId}`,
                [userId]
            );

            addLog(
                new Date(userLoginTime.getTime() + 200),
                'user-service',
                instanceId,
                'debug',
                traceId,
                'User {userId} found in database',
                `User ${userId} found in database`,
                [userId]
            );

            // Password check
            addLog(
                new Date(userLoginTime.getTime() + 300),
                'user-service',
                instanceId,
                'debug',
                traceId,
                'Verifying password for user {userId}',
                `Verifying password for user ${userId}`,
                [userId]
            );

            if (isFailure) {
                addLog(
                    new Date(userLoginTime.getTime() + 400),
                    'user-service',
                    instanceId,
                    'warn',
                    traceId,
                    'Password verification failed for user {userId}',
                    `Password verification failed for user ${userId}`,
                    [userId]
                );
                
                addLog(
                    new Date(userLoginTime.getTime() + 500),
                    'user-service',
                    instanceId,
                    'error',
                    traceId,
                    'Login failed for user {userId}: {reason}',
                    `Login failed for user ${userId}: incorrect password`,
                    [userId, 'incorrect password']
                );

                // Update trace event
                traceEvents[traceEvents.length - 1].completed_at = new Date(userLoginTime.getTime() + 500).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'failed';
            } else {
                addLog(
                    new Date(userLoginTime.getTime() + 400),
                    'user-service',
                    instanceId,
                    'info',
                    traceId,
                    'User {userId} logged in successfully at {time}',
                    `User ${userId} logged in successfully at ${new Date(userLoginTime.getTime() + 400).toISOString().substring(11, 19)}`,
                    [userId, new Date(userLoginTime.getTime() + 400).toISOString().substring(11, 19)]
                );

                // Update trace event
                traceEvents[traceEvents.length - 1].completed_at = new Date(userLoginTime.getTime() + 400).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'success';

                successfulUsers.push({ userId, loginTime: userLoginTime, traceId });
            }
        });

        // 3. Data service lookups (some timeout)
        console.log('Generating data service lookups...');
        const usersWithData = [];
        const timeoutUsers = [successfulUsers[2], successfulUsers[7]]; // 2 users experience timeout

        successfulUsers.forEach((user, idx) => {
            const dataLookupTime = new Date(user.loginTime.getTime() + 1000);
            const traceId = generateTraceId();
            const instanceId = idx % 5;
            const hasTimeout = timeoutUsers.includes(user);

            addTraceEvent(traceId, user.userId, 'data_lookup', dataLookupTime, null, 'in_progress');

            addLog(
                dataLookupTime,
                'data-service',
                instanceId,
                'info',
                traceId,
                'Data lookup requested for user {userId}',
                `Data lookup requested for user ${user.userId}`,
                [user.userId]
            );

            if (hasTimeout) {
                addLog(
                    new Date(dataLookupTime.getTime() + 5000),
                    'data-service',
                    instanceId,
                    'error',
                    traceId,
                    'Data lookup timeout for user {userId} after {duration}ms',
                    `Data lookup timeout for user ${user.userId} after 5000ms`,
                    [user.userId, 5000]
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(dataLookupTime.getTime() + 5000).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'timeout';
            } else {
                addLog(
                    new Date(dataLookupTime.getTime() + 800),
                    'data-service',
                    instanceId,
                    'debug',
                    traceId,
                    'Fetching data from database for user {userId}',
                    `Fetching data from database for user ${user.userId}`,
                    [user.userId]
                );

                addLog(
                    new Date(dataLookupTime.getTime() + 1200),
                    'data-service',
                    instanceId,
                    'info',
                    traceId,
                    'Data lookup completed for user {userId}, returned {count} records',
                    `Data lookup completed for user ${user.userId}, returned ${Math.floor(Math.random() * 50) + 10} records`,
                    [user.userId, Math.floor(Math.random() * 50) + 10]
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(dataLookupTime.getTime() + 1200).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'success';

                usersWithData.push({ ...user, dataLookupTime });
            }
        });

        // 4. Order service creates orders
        console.log('Generating order creation flows...');
        const usersWithOrders = [];
        const oomUser = usersWithData[5]; // One order fails with OOM

        usersWithData.forEach((user, idx) => {
            const orderTime = new Date(user.dataLookupTime.getTime() + 2000);
            const traceId = generateTraceId();
            const instanceId = idx % 5;
            const isOOM = user === oomUser;

            addTraceEvent(traceId, user.userId, 'order_creation', orderTime, null, 'in_progress');

            const orderId = `ORD-${String(idx + 1).padStart(4, '0')}`;

            addLog(
                orderTime,
                'order-service',
                instanceId,
                'info',
                traceId,
                'Creating order {orderId} for user {userId}',
                `Creating order ${orderId} for user ${user.userId}`,
                [orderId, user.userId]
            );

            if (isOOM) {
                addLog(
                    new Date(orderTime.getTime() + 1000),
                    'order-service',
                    instanceId,
                    'error',
                    traceId,
                    'Failed to create order {orderId}: {error}',
                    `Failed to create order ${orderId}: OutOfMemoryError`,
                    [orderId, 'OutOfMemoryError']
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(orderTime.getTime() + 1000).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'failed';
            } else {
                addLog(
                    new Date(orderTime.getTime() + 500),
                    'order-service',
                    instanceId,
                    'debug',
                    traceId,
                    'Validating order items for order {orderId}',
                    `Validating order items for order ${orderId}`,
                    [orderId]
                );

                addLog(
                    new Date(orderTime.getTime() + 1000),
                    'order-service',
                    instanceId,
                    'info',
                    traceId,
                    'Order {orderId} created successfully for user {userId}',
                    `Order ${orderId} created successfully for user ${user.userId}`,
                    [orderId, user.userId]
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(orderTime.getTime() + 1000).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'success';

                usersWithOrders.push({ ...user, orderTime, orderId });
            }
        });

        // 5. Payment processing
        console.log('Generating payment processing flows...');
        const usersWithSuccessfulPayment = [];
        const failedPaymentUser = usersWithOrders[3]; // One payment fails

        usersWithOrders.forEach((user, idx) => {
            const paymentTime = new Date(user.orderTime.getTime() + 2000);
            const traceId = generateTraceId();
            const instanceId = idx % 5;
            const isFailed = user === failedPaymentUser;
            const amount = (Math.random() * 500 + 50).toFixed(2);

            addTraceEvent(traceId, user.userId, 'payment_processing', paymentTime, null, 'in_progress');

            addLog(
                paymentTime,
                'payment-service',
                instanceId,
                'info',
                traceId,
                'Processing payment for order {orderId}, amount ${amount}',
                `Processing payment for order ${user.orderId}, amount $${amount}`,
                [user.orderId, amount]
            );

            if (isFailed) {
                addLog(
                    new Date(paymentTime.getTime() + 1500),
                    'payment-service',
                    instanceId,
                    'error',
                    traceId,
                    'Payment failed for order {orderId}: {reason}',
                    `Payment failed for order ${user.orderId}: Payment gateway timeout`,
                    [user.orderId, 'Payment gateway timeout']
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(paymentTime.getTime() + 1500).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'failed';
            } else {
                addLog(
                    new Date(paymentTime.getTime() + 800),
                    'payment-service',
                    instanceId,
                    'debug',
                    traceId,
                    'Contacting payment gateway for order {orderId}',
                    `Contacting payment gateway for order ${user.orderId}`,
                    [user.orderId]
                );

                addLog(
                    new Date(paymentTime.getTime() + 1500),
                    'payment-service',
                    instanceId,
                    'info',
                    traceId,
                    'Payment successful for order {orderId}, transaction ID {txnId}',
                    `Payment successful for order ${user.orderId}, transaction ID TXN-${String(idx + 1).padStart(6, '0')}`,
                    [user.orderId, `TXN-${String(idx + 1).padStart(6, '0')}`]
                );

                traceEvents[traceEvents.length - 1].completed_at = new Date(paymentTime.getTime() + 1500).toISOString().replace('T', ' ').substring(0, 19);
                traceEvents[traceEvents.length - 1].status = 'success';

                usersWithSuccessfulPayment.push({ ...user, paymentTime });
            }
        });

        // 6. Order fulfillment
        console.log('Generating order fulfillment flows...');
        usersWithSuccessfulPayment.forEach((user, idx) => {
            const fulfillmentTime = new Date(user.paymentTime.getTime() + 1000);
            const traceId = generateTraceId();
            const instanceId = idx % 5;

            addTraceEvent(traceId, user.userId, 'order_fulfillment', fulfillmentTime, null, 'in_progress');

            addLog(
                fulfillmentTime,
                'order-service',
                instanceId,
                'info',
                traceId,
                'Payment confirmed for order {orderId}, starting fulfillment',
                `Payment confirmed for order ${user.orderId}, starting fulfillment`,
                [user.orderId]
            );

            addLog(
                new Date(fulfillmentTime.getTime() + 500),
                'order-service',
                instanceId,
                'debug',
                traceId,
                'Allocating inventory for order {orderId}',
                `Allocating inventory for order ${user.orderId}`,
                [user.orderId]
            );

            addLog(
                new Date(fulfillmentTime.getTime() + 1000),
                'order-service',
                instanceId,
                'info',
                traceId,
                'Order {orderId} fulfillment started, estimated delivery {date}',
                `Order ${user.orderId} fulfillment started, estimated delivery 2025-11-05`,
                [user.orderId, '2025-11-05']
            );

            traceEvents[traceEvents.length - 1].completed_at = new Date(fulfillmentTime.getTime() + 1000).toISOString().replace('T', ' ').substring(0, 19);
            traceEvents[traceEvents.length - 1].status = 'success';
        });

        // Insert all data into database
        console.log(`Inserting ${logs.length} log entries...`);
        console.log(`Inserting ${traceEvents.length} trace events...`);

        db.serialize(() => {
            // Insert trace events
            const traceStmt = db.prepare(`
                INSERT INTO trace_events (trace_event_id, user_id, event_type, started_at, completed_at, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            traceEvents.forEach(trace => {
                traceStmt.run(
                    trace.trace_event_id,
                    trace.user_id,
                    trace.event_type,
                    trace.started_at,
                    trace.completed_at,
                    trace.status
                );
            });

            traceStmt.finalize();

            // Insert logs
            const logStmt = db.prepare(`
                INSERT INTO logs (timestamp, service_id, instance_id, level, trace_event_id, message_template, message_formatted, params_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            logs.forEach(log => {
                logStmt.run(
                    log.timestamp,
                    log.service_id,
                    log.instance_id,
                    log.level,
                    log.trace_event_id,
                    log.message_template,
                    log.message_formatted,
                    log.params_json
                );
            });

            logStmt.finalize(() => {
                console.log('Data generation completed successfully!');
                console.log(`Summary:
- Services started: ${services.length * 5}
- User logins: ${users.length} (${successfulUsers.length} successful, 1 failed)
- Data lookups: ${successfulUsers.length} (${usersWithData.length} successful, ${timeoutUsers.length} timeout)
- Orders created: ${usersWithData.length} (${usersWithOrders.length} successful, 1 OOM error)
- Payments processed: ${usersWithOrders.length} (${usersWithSuccessfulPayment.length} successful, 1 failed)
- Orders fulfilled: ${usersWithSuccessfulPayment.length}`);

                db.close((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Database connection closed.');
                    resolve();
                });
            });
        });
    });
}

module.exports = {
    initSchema,
    generateEvents
};

// Allow running directly from command line
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'init') {
        initSchema()
            .then(() => console.log('Done!'))
            .catch(err => console.error('Error:', err));
    } else if (command === 'generate') {
        generateEvents();
    } else {
        console.log('Usage: node data-injection.js [init|generate]');
    }
}
