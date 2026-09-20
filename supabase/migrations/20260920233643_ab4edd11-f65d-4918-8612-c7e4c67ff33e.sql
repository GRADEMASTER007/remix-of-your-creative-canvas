CREATE TYPE public.product_category AS ENUM ('foods','baking','medicinals','art');
CREATE TYPE public.store_plan AS ENUM ('starter','heritage');
CREATE TYPE public.order_status AS ENUM ('awaiting_payment','paid','cancelled');
CREATE TYPE public.payment_method AS ENUM ('paypal','payfast','bank_transfer');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  story text,
  region text,
  logo_url text,
  plan public.store_plan NOT NULL DEFAULT 'starter',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stores are publicly viewable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owners can create their store" ON public.stores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their store" ON public.stores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category public.product_category NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  image_url text,
  stock integer NOT NULL DEFAULT 10 CHECK (stock >= 0),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products (category);
CREATE INDEX products_store_idx ON public.products (store_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published products are publicly viewable" ON public.products FOR SELECT USING (is_published = true);
CREATE POLICY "Owners can view their own products" ON public.products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners can insert their own products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners can update their own products" ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners can delete their own products" ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.user_id = auth.uid()));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL UNIQUE DEFAULT ('LCH-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  buyer_note text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  payment_method public.payment_method NOT NULL,
  payment_reference text,
  status public.order_status NOT NULL DEFAULT 'awaiting_payment',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_store_idx ON public.orders (store_id);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Store owners can view their orders" ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid()));
CREATE POLICY "Store owners can update their orders" ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid()));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.stores (id, name, slug, tagline, story, region, plan) VALUES
 ('11111111-1111-4111-8111-111111111111','Mama Ndlovu Pantry','mama-ndlovu-pantry','Small-batch spice blends and staples','Three generations of cooks blending suya, berbere and peri-peri by hand in Soweto.','Johannesburg, South Africa','heritage'),
 ('22222222-2222-4222-8222-222222222222','Accra Bake House','accra-bake-house','Heritage breads and sweet traditions','Wood-fired sugar bread, chin chin and cassava cakes baked fresh each morning.','Accra, Ghana','starter'),
 ('33333333-3333-4333-8333-333333333333','Rooted Remedies','rooted-remedies','Traditional medicinals, ethically harvested','Herbalists working with rural harvesters across Limpopo and Zimbabwe.','Polokwane, South Africa','heritage'),
 ('44444444-4444-4444-8444-444444444444','Kilimanjaro Studio','kilimanjaro-studio','Carvings, beadwork and canvas','A collective of twelve artists selling directly, no middlemen.','Arusha, Tanzania','starter');

INSERT INTO public.products (store_id, title, slug, category, description, price_cents, image_url, stock) VALUES
 ('11111111-1111-4111-8111-111111111111','Suya Spice Blend 200g','suya-spice-blend-200g','foods','Roasted groundnut, ginger and chilli rub for grilled meat and vegetables.',12500,null,40),
 ('11111111-1111-4111-8111-111111111111','Berbere Blend 200g','berbere-blend-200g','foods','Ethiopian fourteen-spice blend, sun-dried and stone-ground.',13900,null,32),
 ('11111111-1111-4111-8111-111111111111','Palm Nut Soup Base 400g','palm-nut-soup-base-400g','foods','Rich West African palm nut concentrate, ready for banga or abenkwan.',9900,null,25),
 ('11111111-1111-4111-8111-111111111111','Dried Hibiscus Petals 150g','dried-hibiscus-petals-150g','foods','For zobo, sobolo and bissap. Tart, deep crimson, no additives.',7500,null,60),
 ('22222222-2222-4222-8222-222222222222','Ghanaian Sugar Bread Loaf','ghanaian-sugar-bread-loaf','baking','Soft, pull-apart sweet loaf baked the traditional way.',6500,null,18),
 ('22222222-2222-4222-8222-222222222222','Chin Chin Crunch Box 500g','chin-chin-crunch-box-500g','baking','Crisp fried dough bites dusted with nutmeg sugar.',8900,null,30),
 ('22222222-2222-4222-8222-222222222222','Cassava Coconut Cake','cassava-coconut-cake','baking','Dense, chewy and fragrant. Baked to order, ships within two days.',14500,null,12),
 ('22222222-2222-4222-8222-222222222222','Injera Sourdough Starter','injera-sourdough-starter','baking','Live teff starter with a printed feeding guide.',11000,null,22),
 ('33333333-3333-4333-8333-333333333333','African Potato Root 100g','african-potato-root-100g','medicinals','Hypoxis hemerocallidea, traditionally used as a daily tonic.',18500,null,20),
 ('33333333-3333-4333-8333-333333333333','Moringa Leaf Powder 250g','moringa-leaf-powder-250g','medicinals','Shade-dried leaves, cold-milled to keep the green.',13500,null,45),
 ('33333333-3333-4333-8333-333333333333','Devil''s Claw Tuber Slices','devils-claw-tuber-slices','medicinals','Harpagophytum from the Kalahari, sustainably harvested.',21000,null,15),
 ('33333333-3333-4333-8333-333333333333','Baobab Fruit Powder 200g','baobab-fruit-powder-200g','medicinals','Naturally tangy, high in vitamin C and fibre.',12000,null,38),
 ('44444444-4444-4444-8444-444444444444','Makonde Ebony Figure','makonde-ebony-figure','art','Hand-carved ebony, 32cm, signed by the carver.',245000,null,3),
 ('44444444-4444-4444-8444-444444444444','Maasai Beaded Collar','maasai-beaded-collar','art','Glass beadwork in ochre, indigo and bone white.',89000,null,8),
 ('44444444-4444-4444-8444-444444444444','Kente Wall Panel','kente-wall-panel','art','Handwoven strip cloth panel, 120 x 60cm.',165000,null,5),
 ('44444444-4444-4444-8444-444444444444','Ndebele Acrylic Canvas','ndebele-acrylic-canvas','art','Bold geometric canvas, 70 x 100cm, stretched and ready to hang.',320000,null,2);