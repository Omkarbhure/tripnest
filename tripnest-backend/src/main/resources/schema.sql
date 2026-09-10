-- TripNest PostgreSQL Schema Definition

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    city VARCHAR(255),
    description TEXT,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS attractions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    destination_id INT REFERENCES destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    favorite_destination_id INT REFERENCES destinations(id),
    oauth_google BOOLEAN DEFAULT FALSE,
    address TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    destination_id INT REFERENCES destinations(id),
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    description TEXT,
    status VARCHAR(50),
    user_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_members (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_join_requests (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    created_at TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    day_date DATE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    itinerary_id INT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    total_budget NUMERIC,
    spent_amount NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    budget_id INT REFERENCES budgets(id) ON DELETE CASCADE,
    payer_id INT REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    expense_date DATE,
    receipt_url TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    related_trip_id INT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);
