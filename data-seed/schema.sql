-- Create services reference table
CREATE TABLE IF NOT EXISTS services (
    service_id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    description TEXT
);

-- Create trace_events table for distributed tracing
CREATE TABLE IF NOT EXISTS trace_events (
    trace_event_id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    status TEXT
);

-- Create main logs table
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    service_id TEXT NOT NULL,
    instance_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    trace_event_id TEXT NOT NULL,
    message_template TEXT NOT NULL,
    message_formatted TEXT NOT NULL,
    params_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_service_id ON logs(service_id);
CREATE INDEX IF NOT EXISTS idx_logs_trace_event_id ON logs(trace_event_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_trace_events_user_id ON trace_events(user_id);

-- Insert reference data for services
INSERT OR REPLACE INTO services (service_id, service_name, description) VALUES
    ('data-service', 'Data Service', 'Handles data operations'),
    ('user-service', 'User Service', 'Manages user authentication and profiles'),
    ('order-service', 'Order Service', 'Processes customer orders'),
    ('payment-service', 'Payment Service', 'Handles payment processing');
