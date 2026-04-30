-- ============================================================
-- PD Seasoning — Product Data Migration
-- Run AFTER products-setup.sql
--
-- Inserts all existing products from the JS catalog into Supabase.
-- Uses ON CONFLICT (slug) DO UPDATE — safe to re-run at any time.
-- ============================================================

INSERT INTO public.products
  (slug, sku, name, blurb, story, ingredients, price, category, image, sort_order, active, in_stock, featured, ecwid_product_id)
VALUES

-- ── Pouches ───────────────────────────────────────────────────
('deep-blue-seafood','deep-blue-seafood','Deep Blue Seafood',
 'Ocean-forward seasoning designed for seafood, butter sauces, and clean finishes.',
 'We want to create a perfect base for frying, baking or even grilling and we nailed it!',
 'Sea Salt, White Pepper, Paprika, Garlic, Onion, Celery Seed, Mustard, Ginger, Dried Lemon Peel, Soy Sauce Powder and Herbs',
 13.00,'Pouches','assets/images/pouches/seafood.png',10,true,true,false,808797918),

('jerk','jerk','Jerk',
 'Aromatic island spice. Great for chicken, pork, and grilled vegetables.',
 'This spice blend was inspired from my travels to the island of Jamaica. The unique flavor of the pimento smoked wood back home.',
 'Sea Salt, Black Pepper, Garlic, Onion, All Spice, Mustard, Celery Seed, Brown Sugar, Ginger, Dehydrated Soy Sauce, Chili, and Herbs',
 13.00,'Pouches','assets/images/pouches/jerk.png',20,true,true,false,808797912),

('garlic-pepper','garlic-pepper','Garlic Pepper',
 'Classic garlic warmth with bright pepper finish for daily use.',
 'The Base Of All Rubs. Garlic pepper seasoning is a robust spice blend that''s surprisingly versatile. It matches two of the most popular spice.',
 'Minced Garlic, Garlic Powder, Black Garlic Powder, Black Pepper, Course Sea Salt',
 13.00,'Pouches','assets/images/pouches/Garlicpepper.png',30,true,true,false,808797435),

('fajita-mexican','fajita-mexican','Fajita',
 'Vibrant spice built for true fajitas, grilled meats, and tacos.',
 'This spice blend was inspired by my journeys through Mexico.',
 'Sea Salt, Black Pepper, Garlic, Ginger, Smoked Paprika, Cumin, Soy sauce, Worcestershire, Lime, Chili Powder, Cumin and Herbs',
 13.00,'Pouches','assets/images/pouches/fajita.png',40,true,true,false,808804349),

('chophouse-steak-rub','chophouse-steak-rub','Chop House Steak',
 'Steakhouse profile for ribeye, strip, burgers, and roast beef.',
 'We made this blend to the liking of how we like our steak seasoned. We keep it simple so that the protein Shine!',
 'Sea Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Red Pepper Flakes, Thyme',
 13.00,'Pouches','assets/images/pouches/chophouse.png',50,true,true,false,808797916),

('asian-stir-fry','asian-stir-fry','Asian Stir Fry',
 'Umami-driven blend for seafood, stir-fry, noodles, and sauces.',
 'This selected blend of spices was made to create the same flavors as your favorite Asian restaurant. Easy and simple at home with just a few shakes.',
 'Sea Salt, Black Pepper, Garlic, Onion, White Pepper, Brown Sugar, Ginger, Vinegar, Soy Sauce',
 13.00,'Pouches','assets/images/pouches/asian.png',60,true,true,false,808797914),

('all-purpose','all-purpose','Universal All Purpose',
 'Universal coverage for proteins, vegetables, eggs, and sides.',
 'Our All Purpose blend of herbs and spices was created to enhance the flavor profiles of your favorite foods.',
 'Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Celery Seed, Brown Sugar, Rice Hull for Anti Caking Agent, Chili Powder, Cumin and Herbs',
 13.00,'Pouches','assets/images/pouches/AP-.png',70,true,true,false,808804341),

('sugar-free-all-purpose','sugar-free-all-purpose','Sugar Free All Purpose',
 'Clean flavor architecture with no sugar added. Everyday staple.',
 'Our Pixy Dust All Purpose was reformulated to cater to our Keto and Vegan friends so that they can enjoy the same flavor enhancements without the carbs.',
 'Sea Salt, Black Pepper, Garlic, Turmeric, Onion, Paprika, Mustard, Celery Seed, Monk fruit, Rice Hull for Anti Caking Agent, Chili Powder, Cumin and Herbs',
 13.00,'Pouches','assets/images/pouches/sugarfree.png',80,true,true,false,808797434),

('smoke-bbq','smoke-bbq','Smoke BBQ',
 'Competition-style smoke depth for brisket, ribs, and chicken.',
 'Born from championship BBQ competitions, this blend captures the rich aroma of hickory smoke and bold spices crafted for true pit masters.',
 'Smoked Sea Salt, Black Pepper, Smoked Garlic, Brown Sugar, Onion, Smoked Paprika, Mustard, Spices, and Herbs',
 13.00,'Pouches','assets/images/pouches/smoke.png',90,true,true,false,808797919),

-- ── Bottles ───────────────────────────────────────────────────
('bottle-all-purpose','bottle-all-purpose','Universal All Purpose (Bottle)',
 'Heritage bottle format.',
 'Our All Purpose blend of herbs and spices was created to enhance the flavor profiles of your favorite foods.',
 'Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Celery Seed, Brown Sugar, Rice Hull for Anti Caking Agent, Chili Powder, Cumin and Herbs',
 7.95,'Bottles','assets/images/bottles/universal-all-purpose.png',110,true,true,false,367971975),

('bottle-jerk','bottle-jerk','Jerk (Bottle)',
 'Heritage bottle format.',
 'This spice blend was inspired from my travels to the island of Jamaica. The unique flavor of the pimento smoked wood back home.',
 'Sea Salt, Black Pepper, Garlic, Onion, All Spice, Mustard, Celery Seed, Brown Sugar, Ginger, Dehydrated Soy Sauce, Chili, and Herbs',
 7.95,'Bottles','assets/images/bottles/jerk.png',120,true,true,false,367971976),

('bottle-sugar-free-all-purpose','bottle-sugar-free-all-purpose','Sugar Free All Purpose (Bottle)',
 'Heritage bottle format.',
 'Our Pixy Dust All Purpose was reformulated to cater to our Keto and Vegan friends so that they can enjoy the same flavor enhancements without the carbs.',
 'Sea Salt, Black Pepper, Garlic, Turmeric, Onion, Paprika, Mustard, Celery Seed, Monk fruit, Rice Hull for Anti Caking Agent, Chili Powder, Cumin and Herbs',
 7.95,'Bottles','assets/images/bottles/sugar-free-universal-all-purpose.png',130,true,true,false,367971972),

('bottle-deep-blue-seafood','bottle-deep-blue-seafood','Deep Blue Seafood (Bottle)',
 'Heritage bottle format.',
 'We want to create a perfect base for frying, baking or even grilling and we nailed it!',
 'Sea Salt, White Pepper, Paprika, Garlic, Onion, Celery Seed, Mustard, Ginger, Dried Lemon Peel, Soy Sauce Powder and Herbs',
 7.95,'Bottles','assets/images/bottles/deep-blue-seafood.png',140,true,true,false,367971970),

('bottle-garlic-pepper','bottle-garlic-pepper','Garlic Pepper (Bottle)',
 'Heritage bottle format.',
 'The Base Of All Rubs. Garlic pepper seasoning is a robust spice blend that''s surprisingly versatile.',
 'Minced Garlic, Garlic Powder, Black Garlic Powder, Black Pepper, Course Sea Salt',
 8.95,'Bottles','assets/images/bottles/garlic-pepper.png',150,true,true,false,367971973),

('bottle-asian-stir-fry','bottle-asian-stir-fry','Kitchen Samurai Asian Seasoning (Bottle)',
 'Heritage bottle format.',
 'This selected blend of spices was made to create the same flavors as your favorite Asian restaurant.',
 'Sea Salt, Black Pepper, Garlic, Onion, White Pepper, Brown Sugar, Ginger, Vinegar, Soy Sauce',
 7.95,'Bottles','assets/images/bottles/asian.png',160,true,true,false,367971974),

('bottle-chophouse-steak','bottle-chophouse-steak','Chop House Steak (Bottle)',
 'Heritage bottle format.',
 'We made this blend to the liking of how we like our steak seasoned.',
 'Sea Salt, Black Pepper, Garlic, Onion, Paprika, Mustard, Red Pepper Flakes, Thyme',
 7.95,'Bottles','assets/images/bottles/chophouse-steak.png',170,true,true,false,367971978),

('bottle-smoke-bbq','bottle-smoke-bbq','Smoke BBQ (Bottle)',
 'Heritage bottle format.',
 'Born from championship BBQ competitions, this blend captures the rich aroma of hickory smoke.',
 'Smoked Sea Salt, Black Pepper, Smoked Garlic, Brown Sugar, Onion, Smoked Paprika, Mustard, Spices, and Herbs',
 7.95,'Bottles','assets/images/bottles/smoke-bbq.png',180,true,true,false,367978765),

('bottle-fajita','bottle-fajita','Fajita Taco (Bottle)',
 'Heritage bottle format.',
 'This spice blend was inspired by my journeys through Mexico.',
 'Sea Salt, Black Pepper, Garlic, Ginger, Smoked Paprika, Cumin, Soy sauce, Worcestershire, Lime, Chili Powder, Cumin and Herbs',
 7.95,'Bottles','assets/images/bottles/fajita.png',190,true,true,false,479646759),

-- ── Individual Spices ──────────────────────────────────────────
('worcestershire-powder','worcestershire-powder','Worcestershire Powder',
 'Savory depth with tangy complexity for sauces and rubs.',
 'Worcestershire Powder delivers the bold, savory character of the classic sauce in a dry, versatile form.',
 'Vinegar Powder, Molasses Powder, Tamarind, Garlic, Onion, Spices',
 12.00,'Individual Spices','assets/images/individual-spices/worcestershire-powder.png',210,true,true,false,540163144),

('white-pepper','white-pepper','White Pepper Ground',
 'Smooth heat with a clean pepper finish.',
 'White pepper offers subtle heat and refined flavor, ideal for lighter sauces and delicate dishes.',
 'White Pepper',
 21.00,'Individual Spices','assets/images/individual-spices/white-pepper.png',220,true,true,false,540400723),

('turmeric','turmeric','Turmeric Ground',
 'Earthy warmth with vibrant golden color.',
 'Turmeric adds depth, warmth, and color to dishes ranging from rice to marinades.',
 'Turmeric',
 9.95,'Individual Spices','assets/images/individual-spices/turmeric.png',230,true,true,false,540343805),

('smoked-salt','smoked-salt','Smoked Salt',
 'Naturally smoked salt for instant fire-kissed flavor.',
 'Smoked Salt brings subtle wood smoke character to finished dishes and grilled foods.',
 'Smoked Sea Salt',
 9.00,'Individual Spices','assets/images/individual-spices/smoked-salt.png',240,true,true,false,540504929),

('smoked-paprika','smoked-paprika','Smoked Paprika',
 'Warm, smoky sweetness for meats and vegetables.',
 'Smoked Paprika delivers deep color and balanced smoke without overpowering heat.',
 'Smoked Paprika',
 15.00,'Individual Spices','assets/images/individual-spices/smoked-paprika.png',250,true,true,false,540169807),

('sea-salt','sea-salt','Sea Salt Coarse',
 'Pure, clean salt for everyday cooking.',
 'Sea Salt provides clean salinity and texture essential for balanced seasoning.',
 'Sea Salt',
 13.00,'Individual Spices','assets/images/individual-spices/sea-salt.png',260,true,true,false,540343708),

('soy-sauce-powder','soy-sauce-powder','Pixy Premium Soy Sauce Powder',
 'Umami-rich seasoning in dry form.',
 'Soy Sauce Powder adds savory depth without liquid, perfect for rubs and dry blends.',
 'Soy Sauce Powder',
 7.95,'Individual Spices','assets/images/individual-spices/soy-sauce-powder.png',270,true,true,false,540159417),

('vinegar-powder','vinegar-powder','Distilled White Vinegar Powder',
 'Bright acidity without moisture.',
 'Vinegar Powder delivers tangy balance ideal for seasoning blends and snacks.',
 'Vinegar Powder',
 19.00,'Individual Spices','assets/images/individual-spices/vinegar-powder.png',280,true,true,false,540167194),

('monk-fruit','monk-fruit','Monk Fruit',
 'Natural sweetness with no added sugar.',
 'Monk Fruit provides clean sweetness without calories, ideal for sugar-free cooking.',
 'Monk Fruit Extract',
 13.00,'Individual Spices','assets/images/individual-spices/monk-fruit.png',290,true,true,false,540138739),

('black-pepper-chef-ground','black-pepper-chef-ground','Black Pepper Butcher Cut',
 'Bold, aromatic pepper with chef-grade grind.',
 'Chef Ground Black Pepper delivers balanced heat and aroma for professional kitchens.',
 'Black Pepper',
 12.90,'Individual Spices','assets/images/individual-spices/black-pepper-chef-ground.png',300,true,true,false,540370365),

('mustard-powder','mustard-powder','Mustard Powder',
 'Sharp, tangy heat for sauces and rubs.',
 'Mustard Powder adds bite and depth to dry rubs and dressings.',
 'Mustard Seed',
 11.95,'Individual Spices',null,310,true,true,false,540345086),

('ground-ginger','ground-ginger','Ginger Ground',
 'Warm spice with gentle sweetness.',
 'Ground Ginger adds aromatic warmth to both savory and sweet dishes.',
 'Ginger',
 9.00,'Individual Spices','assets/images/individual-spices/ground-ginger.png',320,true,true,false,540177996),

('allspice-ground','allspice-ground','Allspice Ground',
 'Warm spice notes of clove, nutmeg, and pepper.',
 'Allspice Ground provides layered warmth commonly used in Caribbean and baking applications.',
 'Allspice',
 9.95,'Individual Spices','assets/images/individual-spices/allspice-ground.png',330,true,true,false,540356513),

('red-chili-powder','red-chili-powder','Red Chili Powder',
 'Balanced heat with rich chili flavor.',
 'Red Chili Powder brings controlled heat and depth to spice blends and sauces.',
 'Red Chili Pepper',
 11.00,'Individual Spices','assets/images/individual-spices/red-chili-powder.png',340,true,true,false,540449809),

('paprika','paprika','Paprika',
 'Mild sweetness and rich red color.',
 'Paprika adds color, warmth, and subtle sweetness to a wide range of dishes.',
 'Paprika',
 16.00,'Individual Spices','assets/images/individual-spices/paprika.png',350,true,true,false,540172123),

('onion-ground','onion-ground','Onion Granulated',
 'Savory onion flavor for dry applications.',
 'Ground Onion delivers concentrated onion flavor without moisture.',
 'Onion',
 10.00,'Individual Spices','assets/images/individual-spices/onion-ground.png',360,true,true,false,540435902),

('garlic-granulate','garlic-granulate','Garlic Powder Granulated',
 'Bold garlic texture for rubs and blends.',
 'Garlic Granulate provides robust garlic flavor with visible texture.',
 'Garlic',
 9.95,'Individual Spices','assets/images/individual-spices/garlic-granulate.png',370,true,true,false,540330126),

('cayenne-pepper','cayenne-pepper','Cayenne Pepper',
 'Clean, sharp heat.',
 'Cayenne Pepper delivers focused heat for spice control.',
 'Cayenne Pepper',
 11.00,'Individual Spices','assets/images/individual-spices/cayenne-pepper.png',380,true,true,false,540449796),

('celery-seed','celery-seed','Celery Seeds',
 'Earthy, aromatic seasoning.',
 'Celery Seed adds savory depth commonly used in rubs and pickling blends.',
 'Celery Seed',
 8.00,'Individual Spices','assets/images/individual-spices/celery-seed.png',390,true,true,false,540400707),

('curry-powder','curry-powder','Curry Powder',
 'Warm, layered spice blend.',
 'Curry Powder delivers complex warmth suitable for sauces, rice, and marinades.',
 'Turmeric, Coriander, Cumin, Spices',
 9.00,'Individual Spices','assets/images/individual-spices/curry-powder.png',400,true,true,false,540519815),

-- ── Subscriptions ──────────────────────────────────────────────
('sub-monthly','sub-monthly','Monthly Subscription',
 'One fresh pouch delivered monthly — your choice of blend.',
 null,null,
 null,'Subscriptions','assets/images/pouches/AP-.png',410,true,true,false,575076602),

('sub-3','sub-3','3 Month Subscription',
 'Three months of signature flavors, delivered on your schedule.',
 null,null,
 45.00,'Subscriptions','assets/images/pouches/smoke.png',420,true,true,false,575088085),

('sub-6','sub-6','6 Month Subscription',
 'Six months of luxury — the full Pixy Dust experience.',
 null,null,
 200.00,'Subscriptions','assets/images/pouches/smoke.png',430,true,true,false,575094563),

-- ── Gift Sets ──────────────────────────────────────────────────
('gift-9','gift-9','Signature Collection — 9 Blends',
 'Every signature blend. The complete Pixy Dust experience.',
 null,null,
 75.00,'Gift Sets','assets/images/gifts/giftset-9.png',510,true,true,true,813068869),

('gift-6','gift-6','Signature Collection — 6 Blends',
 'Six bold blends curated for the serious home cook.',
 null,null,
 55.00,'Gift Sets','assets/images/gifts/giftset-6.png',520,true,true,true,813104036),

('gift-3','gift-3','Signature Collection — 3 Blends',
 'The perfect introduction. Three standout blends, beautifully packaged.',
 null,null,
 37.00,'Gift Sets','assets/images/gifts/giftset-3.png',530,true,true,true,367971971),

-- ── Bundles ────────────────────────────────────────────────────
('bundle-book-classic','bundle-book-classic','Junior Chef Collection',
 'Three signature blends — Universal All Purpose, Fajita, and Asian Stir Fry — paired with the Pixy Dust Juniors book.',
 null,null,
 50.00,'Bundles','assets/images/Books/book-classic-cover.png',610,true,true,false,813104043),

('bundle-book-two','bundle-book-two','Junior Chef Kit',
 'Sugar-Free Universal All Purpose seasoning and the Pixy Dust Juniors book — the perfect starter kit for young cooks.',
 null,null,
 20.00,'Bundles','assets/images/Books/zen-pearl-market-cover.png',620,true,true,false,813104045),

('bundle-family','bundle-family','Family Bundle',
 'Book + multiple bottles for group cooking. Bold flavor for the whole family.',
 null,null,
 35.00,'Bundles','assets/images/pouches/file_000000004b3471f59f1ba7668ac538ff.png',630,true,true,false,813068875),

-- ── Grills ────────────────────────────────────────────────────
('lion-l60000','lion-l60000','Lion L60000 Built-In BBQ',
 'L60000 LP Built-In BBQ with grill cover. Lion Premium Grills.',
 null,null,
 1799.00,'Grills','assets/images/lion-grills/lion-l6000.png',710,true,true,false,690086219),

('lion-l75000','lion-l75000','Lion L75000 Built-In BBQ',
 'L75000 Built-In BBQ LP. Lion Premium Grills.',
 null,null,
 2149.00,'Grills','assets/images/lion-grills/lion-l75000.png',720,true,true,false,690086189),

('lion-l90000','lion-l90000','Lion L90000 Built-In BBQ',
 'L90000 Built-In BBQ LP. Lion Premium Grills.',
 null,null,
 2599.00,'Grills','assets/images/lion-grills/lion-l90000.png',730,true,true,false,808797939),

('lion-l90000-alt','lion-l90000-alt','Lion L90000 Cart Only',
 'L90000 Cart Only. Lion Premium Grills.',
 null,null,
 3299.00,'Grills','assets/images/lion-grills/Lion-cart.png',740,true,true,false,690085682),

('lion-l75000-cart','lion-l75000-cart','Lion L75000 Cart Only',
 'L75000 BBQ Grill Cart Only. Lion Premium Grills.',
 null,null,
 1299.00,'Grills','assets/images/lion-grills/lion-l75000-cart.png',750,true,true,false,808797437),

-- ── Books ─────────────────────────────────────────────────────
('book-zen-pearl-market','book-zen-pearl-market','Zen in the Pearl Market',
 'Juniors storybook.',
 null,null,
 null,'Books','assets/images/Books/zen-pearl-market-cover.png',810,true,true,false,null),

('book-coming-soon','book-coming-soon','More Books Coming',
 'Next Juniors storybook — coming soon.',
 null,null,
 null,'Books','assets/images/Books/book-coming-soon-cover.png',820,true,true,false,null)

ON CONFLICT (slug) DO UPDATE SET
  sku               = EXCLUDED.sku,
  name              = EXCLUDED.name,
  blurb             = EXCLUDED.blurb,
  story             = EXCLUDED.story,
  ingredients       = EXCLUDED.ingredients,
  price             = EXCLUDED.price,
  category          = EXCLUDED.category,
  image             = EXCLUDED.image,
  sort_order        = EXCLUDED.sort_order,
  active            = EXCLUDED.active,
  in_stock          = EXCLUDED.in_stock,
  featured          = EXCLUDED.featured,
  ecwid_product_id  = EXCLUDED.ecwid_product_id;
