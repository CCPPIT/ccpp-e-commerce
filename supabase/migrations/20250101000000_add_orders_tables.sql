/*
  # Create Orders and Order Items Tables
  This migration adds the necessary tables to support the order management system.

  ## Query Description:
  - Creates an `orders` table to store order details like total amount, status, and shipping information.
  - Creates an `order_items` table to store the individual products associated with each order.
  - Establishes foreign key relationships between orders, users, and products.
  - Adds Row Level Security (RLS) policies to ensure users can only access their own orders.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true (by dropping the tables)

  ## Structure Details:
  - Table `orders`:
    - `id`: UUID, Primary Key
    - `user_id`: UUID, Foreign Key to `auth.users`
    - `total_amount`: numeric
    - `status`: text (e.g., 'pending', 'shipped', 'delivered')
    - `shipping_address`: jsonb
    - `created_at`: timestamptz
  - Table `order_items`:
    - `id`: UUID, Primary Key
    - `order_id`: UUID, Foreign Key to `orders`
    - `product_id`: UUID, Foreign Key to `products`
    - `quantity`: integer
    - `price`: numeric (price at the time of purchase)
    - `created_at`: timestamptz

  ## Security Implications:
  - RLS Status: Enabled on both tables.
  - Policy Changes: Yes, new policies are created.
    - Users can `SELECT` their own orders and order items.
    - Users can `INSERT` new orders and order items.
    - `UPDATE` and `DELETE` are disabled for users to maintain order integrity.
  - Auth Requirements: A valid user session is required to interact with these tables.

  ## Performance Impact:
  - Indexes: Primary keys and foreign keys are indexed by default. An index is added on `orders(user_id)`.
  - Triggers: None.
  - Estimated Impact: Low, standard table creation.
*/

-- Create an enum for order status for better data integrity
CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

-- Create the orders table
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount numeric(10, 2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    shipping_address jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the orders table
COMMENT ON TABLE public.orders IS 'Stores customer orders.';
COMMENT ON COLUMN public.orders.status IS 'The current status of the order.';

-- Create an index on user_id for faster lookups
CREATE INDEX ON public.orders (user_id);

-- Create the order_items table
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric(10, 2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the order_items table
COMMENT ON TABLE public.order_items IS 'Stores individual items within an order.';
COMMENT ON COLUMN public.order_items.price IS 'Price of the product at the time of purchase.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the orders table
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create new orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for the order_items table
CREATE POLICY "Users can view items in their own orders"
ON public.order_items FOR SELECT
USING (
  (
    SELECT auth.uid()
    FROM public.orders
    WHERE id = order_items.order_id
  ) = auth.uid()
);

CREATE POLICY "Users can insert items into their own new orders"
ON public.order_items FOR INSERT
WITH CHECK (
  (
    SELECT auth.uid()
    FROM public.orders
    WHERE id = order_items.order_id
  ) = auth.uid()
);
