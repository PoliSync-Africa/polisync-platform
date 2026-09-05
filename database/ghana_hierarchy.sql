CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES regions(id),
    name VARCHAR(150) NOT NULL
);

CREATE TABLE constituencies (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id),
    name VARCHAR(150) NOT NULL
);

CREATE TABLE electoral_areas (
    id SERIAL PRIMARY KEY,
    constituency_id INTEGER REFERENCES constituencies(id),
    name VARCHAR(150) NOT NULL
);

CREATE TABLE polling_stations (
    id SERIAL PRIMARY KEY,
    electoral_area_id INTEGER REFERENCES electoral_areas(id),
    ec_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    status VARCHAR(30) DEFAULT 'active'
);
