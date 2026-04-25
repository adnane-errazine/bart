-- BART Database Schema
-- Run once in Supabase SQL editor or via seed.py

create table if not exists artist (
    id          text primary key,
    name        text not null,
    nationality text,
    movement    text,
    bio         text
);

create table if not exists artwork (
    id              text primary key,
    artist_id       text references artist(id),
    artist_name     text not null,
    category        text not null,
    title           text not null,
    year_created    integer,
    medium          text,
    dimensions_cm   text,
    description     text,
    creation_context text,
    artwork_style   text,
    notable_owners  text,
    bart_score      real,
    image_url       text
);

create table if not exists sale (
    id                    text primary key,
    artwork_id            text references artwork(id),
    sale_date             date not null,
    auction_house         text,
    sale_price_eur        real not null,
    estimate_low_eur      real,
    estimate_high_eur     real,
    sold_above_estimate   boolean,
    buyer_type            text,
    buyer_name            text,
    buyer_nationality     text,
    seller_type           text,
    seller_name           text,
    sale_location         text,
    source                text
);

create table if not exists signal (
    id          text primary key,
    title       text not null,
    body        text not null,
    artwork_id  text references artwork(id),
    created_at  timestamptz default now(),
    is_read     boolean default false
);

create table if not exists conversation (
    id          text primary key,
    scope       text not null,
    scope_id    text,
    created_at  timestamptz default now()
);

create table if not exists message (
    id                  text primary key,
    conversation_id     text references conversation(id) on delete cascade,
    role                text not null,
    content             text not null,
    created_at          timestamptz default now()
);

create index if not exists sale_artwork_idx  on sale(artwork_id);
create index if not exists sale_date_idx     on sale(sale_date);
create index if not exists artwork_cat_idx   on artwork(category);
create index if not exists message_conv_idx  on message(conversation_id);
