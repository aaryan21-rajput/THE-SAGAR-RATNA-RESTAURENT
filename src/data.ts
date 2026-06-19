import { Category, MenuItem, Review } from "./types";

export const categories: Category[] = [
  {
    id: "soups",
    name: "Soups",
    icon: "🥣",
    description: "Warm, nourishing, and appetizing soup selections"
  },
  {
    id: "papad-snacks",
    name: "Papad & Snacks",
    icon: "🥠",
    description: "Crispy papads, salted extras, and quick munchies"
  },
  {
    id: "salads",
    name: "Salads",
    icon: "🥗",
    description: "Freshly sliced garden greens and tangy Kachumber salad"
  },
  {
    id: "milkshakes",
    name: "Milkshakes",
    icon: "🥤",
    description: "Rich, creamy, and decadent milkshakes blended to perfection"
  },
  {
    id: "mocktails",
    name: "Mocktails & Beverages",
    icon: "🍹",
    description: "Chilled refreshers, cold coffees, and premium non-alcoholic cocktails"
  },
  {
    id: "momos",
    name: "Momos",
    icon: "🥟",
    description: "Delectable dumplings, steamed, fried, or crispy crunch"
  },
  {
    id: "soya-chaap",
    name: "Soya Chaap",
    icon: "🌯",
    description: "Marinated soy skewers charred over standard tandoor style"
  },
  {
    id: "burgers",
    name: "Burgers",
    icon: "🍔",
    description: "Juicy patties nestled inside soft, toasted brioche buns"
  },
  {
    id: "kathi-rolls",
    name: "Kathi Rolls",
    icon: "🌯",
    description: "Flaky parathas rolled tightly with spiced fillings"
  },
  {
    id: "pao-bhaji-snacks",
    name: "Pao Bhaji & Snacks",
    icon: "🧈",
    description: "Hot griddled Pao Bhaji and legendary North Indian street snacks"
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    icon: "🥪",
    description: "Crisp grilled toasties and multilayered club sandwiches"
  },
  {
    id: "sizzlers",
    name: "Sizzlers",
    icon: "🔥",
    description: "Serving hot, smoking skillets piled high with savory combinations"
  },
  {
    id: "pizza",
    name: "Pizza",
    icon: "🍕",
    description: "Stone-baked thincrust pizzas topped with premium stringy cheese"
  },
  {
    id: "italian",
    name: "Italian Pasta",
    icon: "🍝",
    description: "Al dente pastas tossed in rich, creamy, or classic red sauces"
  },
  {
    id: "idli",
    name: "Idli Showcase",
    icon: "🥥",
    description: "Pillowy-soft steamed rice cakes paired with coconut chutney and sambar"
  },
  {
    id: "uttapam",
    name: "Uttapam",
    icon: "🥞",
    description: "Thick, savory pancakes griddled with hand-chopped toppings"
  },
  {
    id: "dosa",
    name: "Dosa Heritage",
    icon: "🥘",
    description: "Golden, paper-thin crispy crepes containing spiced potato mash"
  },
  {
    id: "chinese",
    name: "Chinese Wok",
    icon: "🥢",
    description: "Fiery wok-tossed noodles, manchurian dumplings, and paneer gems"
  },
  {
    id: "main-course",
    name: "Indian Main Course",
    icon: "🍛",
    description: "Slow-simmered, aromatic North Indian curries and gourmet combinations"
  },
  {
    id: "biryani-rice",
    name: "Biryani & Rice",
    icon: "🍚",
    description: "Fragrant basmati rice gently layered with whole spices and saffron"
  },
  {
    id: "kulcha",
    name: "Kulcha",
    icon: "🫓",
    description: "Soft, leavened flatbreads stuffed with artisanal spices"
  },
  {
    id: "paratha",
    name: "Tandoori Paratha",
    icon: "🥞",
    description: "Hearty, layered griddle-baked flatbreads stuffed to the brim"
  },
  {
    id: "tea-coffee",
    name: "Tea & Coffee",
    icon: "☕",
    description: "Freshly brewed classic chai, aromatic black teas, and standard hot coffee"
  },
  {
    id: "raita",
    name: "Raita",
    icon: "🥣",
    description: "Cool, whipped savory yogurt sides to balance spiced rich food"
  },
  {
    id: "refreshers",
    name: "Refreshers",
    icon: "🥤",
    description: "Cooling lassis, premium spiced buttermilk, and fresh lime juice"
  }
];

export const menuItems: MenuItem[] = [
  // SOUPS
  {
    id: "s1",
    name: "Veg Hot & Sour Soup",
    price: 140,
    category: "soups",
    description: "A fiery-tangy oriental soup packed with minced farm-fresh vegetables, standard wild mushrooms, and coriander.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.8,
    ratingCount: 124
  },
  {
    id: "s2",
    name: "Veg Manchow Soup",
    price: 150,
    category: "soups",
    description: "Vibrant garlic-infused broth packed with finely diced green veggies, finished with a topping of super crispy noodles.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 89
  },

  // PAPAD & SNACKS
  {
    id: "p1",
    name: "Roasted Papad",
    price: 40,
    category: "papad-snacks",
    description: "Thin, crispy lentil flatbread dry-roasted on open fire, serving as the perfect traditional meal starter.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 230
  },
  {
    id: "p2",
    name: "Fried Papad",
    price: 50,
    category: "papad-snacks",
    description: "Gold-fried lentil papad crackers. Extremely crunchy, delicious, and perfect as a side munch.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.3,
    ratingCount: 150
  },
  {
    id: "p3",
    name: "Masala Papad",
    price: 80,
    category: "papad-snacks",
    description: "Crunchy papad crowned with a flavorful heap of diced red tomatoes, purple onions, green chilis, coriander, and chat masala.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 310
  },
  {
    id: "p4",
    name: "French Fries",
    price: 120,
    category: "papad-snacks",
    description: "Crispy, potato finger wedges salted uniformly and fried to beautiful golden perfection. Served with ketchup.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 420
  },

  // SALADS
  {
    id: "sal1",
    name: "Family Green Salad",
    price: 140,
    category: "salads",
    description: "A mega crowd-pleaser assortment of freshly sliced cucumbers, ripe tomatoes, crisp carrots, red onions, and lemon wedges.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 95
  },
  {
    id: "sal2",
    name: "Green Salad",
    price: 90,
    category: "salads",
    description: "Standard clean plate of crunchy green cucumbers, standard red tomatoes, juicy onions, sliced fresh carrots, and lime.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 160
  },
  {
    id: "sal3",
    name: "Kachumber Salad",
    price: 110,
    category: "salads",
    description: "Zesty chopped salad featuring tiny cubes of cucumber, onions, juicy tomatoes, tossed with fresh lemon and chat masala spices.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 115
  },

  // MILKSHAKES
  {
    id: "m1",
    name: "Mango Shake",
    price: 150,
    category: "milkshakes",
    description: "Luscious blend of sweet Alphanso mango pulp, premium chilled creamy milk, topped with rich vanilla ice cream.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.8,
    ratingCount: 380
  },
  {
    id: "m2",
    name: "Vanilla Shake",
    price: 130,
    category: "milkshakes",
    description: "Thick, silky classic vanilla bean shake, decorated beautifully with whipped cream and wild dark cherry toppings.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 140
  },
  {
    id: "m3",
    name: "Strawberry Shake",
    price: 140,
    category: "milkshakes",
    description: "Vibrant milkshake blended from real mountain strawberries, smooth cold cream, and rich strawberry syrup swirls.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 190
  },
  {
    id: "m4",
    name: "Pineapple Shake",
    price: 140,
    category: "milkshakes",
    description: "Sweet, tangy tropical pineapple chunks blended gracefully with standard fresh milk cream and optional honey drizzle.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.3,
    ratingCount: 98
  },
  {
    id: "m5",
    name: "Oreo Shake",
    price: 160,
    category: "milkshakes",
    description: "An absolute favorite of crowd-goers: standard Oreo cookies crushed with sweet vanilla fudge and triple cream milk.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.9,
    ratingCount: 540
  },
  {
    id: "m6",
    name: "Kit-Kat Shake",
    price: 170,
    category: "milkshakes",
    description: "Crispy chocolatey Kit-Kat bars blended together with deep chocolate fudge, rich high-grade cream, and chocolate flakes.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.8,
    ratingCount: 290
  },
  {
    id: "m7",
    name: "Kiwi Shake",
    price: 160,
    category: "milkshakes",
    description: "Exotic kiwi extracts blended inside milk cream, providing a beautiful jade balance of sweet and tangy flavors.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.2,
    ratingCount: 75
  },

  // MOCKTAILS & COLD BEVERAGES
  {
    id: "b1",
    name: "Cold Coffee",
    price: 120,
    category: "mocktails",
    description: "Classic creamy cold whip of premium roasted coffee, shaken down with triple-filtered full cream milk and sweet sugarcane syrup.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 460
  },
  {
    id: "b2",
    name: "Chocolate Shake",
    price: 140,
    category: "mocktails",
    description: "Double rich premium cocoa blended with deep chocolate syrup, sweet milk cream, and dark cocoa dusting.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 220
  },
  {
    id: "b3",
    name: "Hazelnut Cold Coffee",
    price: 150,
    category: "mocktails",
    description: "Artisanal espresso shot blended with hazelnut extract, rich full fat sweet milk, and a delicate wafer stick garnish.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.9,
    ratingCount: 390
  },

  // MOMOS
  {
    id: "mo1",
    name: "Veg Momos (Steamed/Fried)",
    price: 120,
    category: "momos",
    description: "Tender, hand-folded Himalayan dough pouches stuffed with chopped cabbage, carrots, spring onions, ginger, and optional gold frying.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 480
  },
  {
    id: "mo2",
    name: "Veg Cheese Momos",
    price: 150,
    category: "momos",
    description: "Mouthful momo wraps carrying standard seasoned veggies mixed with liquid melting mozzarella cheese core. Steamed hot.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 320
  },
  {
    id: "mo3",
    name: "Paneer Momos",
    price: 140,
    category: "momos",
    description: "Luxury soft cottage cheese shreds, seasoned with pepper and coriander, enveloped in thin wheat sheets. Served with spicy momo dip.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.6,
    ratingCount: 280
  },
  {
    id: "mo4",
    name: "Veg Kurkure Momos",
    price: 160,
    category: "momos",
    description: "Succulent momo pockets coated in premium spiced cornflakes batter and deep-fried to create an unbelievably crunchy outer skin.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.9,
    ratingCount: 650
  },

  // SOYA CHAAP
  {
    id: "ch1",
    name: "Malai Soya Chaap",
    price: 220,
    category: "soya-chaap",
    description: "Soy bean skewers marinated inside a rich blend of premium cashew paste, heavy fresh cream, yogurt, and warm cardamoms.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.8,
    ratingCount: 410
  },
  {
    id: "ch2",
    name: "Afghani Soya Chaap",
    price: 230,
    category: "soya-chaap",
    description: "Tender soy ribs marinated overnight with black peppers, light yogurt, and garlic paste, grilled inside a clay tandoor oven.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 230
  },
  {
    id: "ch3",
    name: "Tikka Soya Chaap",
    price: 210,
    category: "soya-chaap",
    description: "Classic red tandoori spiced soya chunks skewed with thick bell peppers, charcoal roasted to smoky tenderness.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.6,
    ratingCount: 195
  },
  {
    id: "ch4",
    name: "Chilly Soya Chaap",
    price: 220,
    category: "soya-chaap",
    description: "Indo-Chinese twist featuring fried soy chaap bites tossed in rich soy sauce, fiery chili oil, capsicum, and diced blue onions.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
    spiciness: 3,
    rating: 4.5,
    ratingCount: 154
  },

  // BURGERS
  {
    id: "bu1",
    name: "Sagar Ratna Special Burger",
    price: 150,
    category: "burgers",
    description: "Our signature high-stacked burger! Double crispy vegetable cutlet, cheddar cheese, pickles, lettuce, and secret house sauce.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.9,
    ratingCount: 510
  },
  {
    id: "bu2",
    name: "Veg Burger",
    price: 90,
    category: "burgers",
    description: "Crispy seasoned golden potato and green peas patty, matched with crisp lettuce leaves, juicy tomato slices, and mayonnaise.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 380
  },
  {
    id: "bu3",
    name: "Veg Cheese Burger",
    price: 120,
    category: "burgers",
    description: "Classic veggie burger containing an aromatic potato-peas cutlet, blanketed in a melted American cheddar sheet.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 290
  },
  {
    id: "bu4",
    name: "Paneer Burger",
    price: 140,
    category: "burgers",
    description: "Crunchy crisp breaded cottage cheese slab deep-fried, loaded with fresh tandoori mayo, onions, and shredded lettuce.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 420
  },

  // KATHI ROLLS
  {
    id: "r1",
    name: "Veg Kathi Roll",
    price: 120,
    category: "kathi-rolls",
    description: "Skillet-cooked flaky wrap loaded with marinated mixed vegetables, crisp purple onions, and tangy mint spread.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.3,
    ratingCount: 170
  },
  {
    id: "r2",
    name: "Paneer Kathi Roll",
    price: 160,
    category: "kathi-rolls",
    description: "Fragrant paratha roll housing pan-seared spiced paneer squares, golden bell peppers, finished with a splash of fresh lemon.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.7,
    ratingCount: 390
  },
  {
    id: "r3",
    name: "Veg Cheese Kathi Roll",
    price: 150,
    category: "kathi-rolls",
    description: "Freshly rolled paratha enveloping sauteed garden veggies and a heavy load of shredded cheddar, lightly hot griddled.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.5,
    ratingCount: 220
  },

  // PAO BHAJI & SNACKS
  {
    id: "pb1",
    name: "Pao Bhaji",
    price: 140,
    category: "pao-bhaji-snacks",
    description: "Vibrant mashed mixed vegetable buttery curry topped with a dollop of table butter, served alongside hot toasted soft buns.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.8,
    ratingCount: 890
  },
  {
    id: "pb2",
    name: "Cheese Pao Bhaji",
    price: 170,
    category: "pao-bhaji-snacks",
    description: "The classic Mumbai mash showered with a gorgeous layer of grated processed cheese. Serves beautifully with two butter-fried buns.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 460
  },
  {
    id: "pb3",
    name: "Puri Bhaji",
    price: 130,
    category: "pao-bhaji-snacks",
    description: "Four direct puff-fried golden flatbreads accompanied by traditional potato stew prepared with mustard, curry leaves, and green chili.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 280
  },
  {
    id: "pb4",
    name: "Chole Bhature",
    price: 160,
    category: "pao-bhaji-snacks",
    description: "Rich, dark, slow-brewed spicy chickpeas paired with two mega-sized freshly balloon-fried fluffy yogurt flatbreads.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.9,
    ratingCount: 1200
  },

  // SANDWICHES
  {
    id: "sa1",
    name: "Veg Sandwich",
    price: 90,
    category: "sandwiches",
    description: "Cool cucumber and sweet tomato chunks with thin mint butter spread between fresh slices of premium white bread.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.3,
    ratingCount: 110
  },
  {
    id: "sa2",
    name: "Cheese Sandwich",
    price: 110,
    category: "sandwiches",
    description: "Rich layered cheddar cheese sliced inside white milk bread, grilled till it achieves golden exterior lines.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 180
  },
  {
    id: "sa3",
    name: "Paneer Tikka Sandwich",
    price: 150,
    category: "sandwiches",
    description: "Spiced paneer roasted in clay tandoor tossed in tandoori mayonnaise and grilled to absolute warm crispness.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.8,
    ratingCount: 460
  },
  {
    id: "sa4",
    name: "Veg Club Sandwich",
    price: 140,
    category: "sandwiches",
    description: "Double decker toasted delight holding layers of crisp cucumber, tomato slabs, cheese, grated cabbage coleslaw, and herb butter.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 230
  },
  {
    id: "sa5",
    name: "Cheese Corn Sandwich",
    price: 130,
    category: "sandwiches",
    description: "Sweet American golden corn kernels folded into standard creamy cheese spread and grilled gracefully.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 195
  },
  {
    id: "sa6",
    name: "Sagar Ratna Special Sandwich",
    price: 160,
    category: "sandwiches",
    description: "Artisanal sandwich loaded with tandoori paneer crumble, golden bell peppers, cheddar melt, and green mint relish.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.9,
    ratingCount: 350
  },

  // SIZZLERS
  {
    id: "sz1",
    name: "Veg Sizzler",
    price: 320,
    category: "sizzlers",
    description: "Steaming hot cast-iron plate piled with french fries, sauteed butter veggies, dynamic rice, and rich brown garlic sauce.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 210
  },
  {
    id: "sz2",
    name: "Chinese Sizzler",
    price: 340,
    category: "sizzlers",
    description: "Premium sizzling skillet carrying wok-tossed noodles, vegetable fried rice, golden chili paneer cubes, and paneer gems.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.8,
    ratingCount: 340
  },
  {
    id: "sz3",
    name: "Cottage Cheese Stick Sizzler",
    price: 380,
    category: "sizzlers",
    description: "Pan-roasted block paneer sticks basted in smoky barbecue sauce, served with sauteed broccoli, beans, carrots, and herb rice.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.9,
    ratingCount: 190
  },

  // PIZZA
  {
    id: "piz1",
    name: "Oriental Margherita Pizza",
    price: 240,
    category: "pizza",
    description: "Crafted stone-baked thin crust featuring premium marinara base, melting fresh mozzarella cheese, and fresh sweet basil leaves.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 420
  },
  {
    id: "piz2",
    name: "Paneer Tikka Pizza",
    price: 290,
    category: "pizza",
    description: "Beautiful combination of clay-oven cooked paneer tikka, red onion petals, capsicum rings, and gooey stringy cheese.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 680
  },
  {
    id: "piz3",
    name: "Farm Fresh Pizza",
    price: 270,
    category: "pizza",
    description: "Symphony of colors! Fresh broccoli, golden sweet corn, button mushrooms, black olives, bell peppers, on a crisp crust.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 410
  },

  // ITALIAN
  {
    id: "it1",
    name: "White Sauce Pasta",
    price: 190,
    category: "italian",
    description: "Macaroni or penne drenched in premium rich white bechamel sauce made of fresh butter, rich cheese, and wild mushrooms.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 310
  },
  {
    id: "it2",
    name: "Red Sauce Pasta",
    price: 180,
    category: "italian",
    description: "Fiery penne pasta simmered in crushed Italian plum tomatoes, garlic, extra virgin olive oil, and hot red chili flakes.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.4,
    ratingCount: 190
  },
  {
    id: "it3",
    name: "Pink Sauce Pasta",
    price: 210,
    category: "italian",
    description: "The absolute best of both worlds: creamy bechamel matches acidic marinara to build a luxurious rose sauce with standard black olives.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 450
  },

  // IDLI
  {
    id: "id1",
    name: "Steamed Idli",
    price: 90,
    category: "idli",
    description: "Two light, fluffy cloud-like steamed fermented rice and black-lentil cakes, served with piping hot sambar.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 520
  },
  {
    id: "id2",
    name: "Butter Idli",
    price: 110,
    category: "idli",
    description: "Steamed fluffy idlis bathed with golden melted Amul tub butter, bringing a rich traditional breakfast feel.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 310
  },
  {
    id: "id3",
    name: "Tawa Idli",
    price: 130,
    category: "idli",
    description: "Idli cubes pan-roasted on giant tawa grills with diced tomatoes, onions, capsicum, and a dynamic South Indian gun-powder spice mix.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 410
  },

  // UTTAPAM
  {
    id: "ut1",
    name: "Mix Veg Uttapam",
    price: 140,
    category: "uttapam",
    description: "Hearty, thick South Indian pancake loaded with hand-shredded carrots, purple onions, fresh green capsicum, and coriander.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 160
  },
  {
    id: "ut2",
    name: "Tomato Uttapam",
    price: 130,
    category: "uttapam",
    description: "Thick savory modern lentil crepe cooked with a heavy layer of sweet, caramelised ripe red tomatoes.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 95
  },
  {
    id: "ut3",
    name: "Onion Uttapam",
    price: 130,
    category: "uttapam",
    description: "Traditional recipe highlighting golden sweet griddled red onion shreds, chopped green chilies, and coriander.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 220
  },
  {
    id: "ut4",
    name: "Paneer Uttapam",
    price: 160,
    category: "uttapam",
    description: "Luxury version scattered beautifully with crushed spiced cottage cheese, green chilies, and authentic ghee.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 340
  },
  {
    id: "ut5",
    name: "Cheese Uttapam",
    price: 170,
    category: "uttapam",
    description: "Savoury rice pancake covered in melting mozzarella threads, fusing classic Italian cheese stretch with heritage South Indian flavors.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 180
  },

  // DOSA
  {
    id: "d1",
    name: "Plain Dosa",
    price: 110,
    category: "dosa",
    description: "Sagar Ratna classic golden wafer-thin dry rice and lentil crepe. Served with piping hot sambar and three premium chutneys.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 790
  },
  {
    id: "d2",
    name: "Masala Dosa",
    price: 140,
    category: "dosa",
    description: "Vibrant golden crispy crepe stuffed with our iconic tempered yellow potato-and-onion dry yellow curry mash.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.9,
    ratingCount: 1980
  },
  {
    id: "d3",
    name: "Spring Masala Dosa",
    price: 170,
    category: "dosa",
    description: "Double thin crisp dosa rolled up with a savory stir-fry of fresh cabbage, bell peppers, carrots, and sweet potato mash.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 420
  },
  {
    id: "d4",
    name: "Mysore Dosa",
    price: 160,
    category: "dosa",
    description: "Crispy crepe coated on the inside with a spicy, fiery red garlic-lentil chutney, stuffed with potato masala.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.9,
    ratingCount: 930
  },
  {
    id: "d5",
    name: "Rava Dosa",
    price: 150,
    category: "dosa",
    description: "Intricately laced, crispy semolina-rice crepe seasoned with peppercorns, cumin, and sliced green ginger.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.5,
    ratingCount: 310
  },
  {
    id: "d6",
    name: "Paneer Masala Dosa",
    price: 180,
    category: "dosa",
    description: "Premium large crepe loaded inside with spiced crumbled cottage cheese mash, onions, coriander, and golden ghee.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 740
  },
  {
    id: "d7",
    name: "Paper Plain Dosa",
    price: 130,
    category: "dosa",
    description: "Extra long, razor-thin paper-crisp golden dry crepe that stretches beautifully across the visual platter.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 460
  },
  {
    id: "d8",
    name: "Ghee Roast Masala Dosa",
    price: 180,
    category: "dosa",
    description: "Dosa roasted till deep bronze with pure cow ghee, packed with seasoned potato mash, bringing an unforgettable heritage aroma.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.8,
    ratingCount: 880
  },

  // CHINESE
  {
    id: "c1",
    name: "Veg Noodles",
    price: 140,
    category: "chinese",
    description: "Stir-fried ribbon noodles cooked in high flames inside wok, with soy, vinegar, crunchy cabbage shreds, capsicum and spring onions.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.5,
    ratingCount: 620
  },
  {
    id: "c2",
    name: "Veg Manchurian",
    price: 160,
    category: "chinese",
    description: "Deep-fried veggie dumpling spheres resting inside a rich, thick, glossy garlic and scallion-spiked dark soy sauce gravy.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.7,
    ratingCount: 780
  },
  {
    id: "c3",
    name: "Chilly Paneer",
    price: 210,
    category: "chinese",
    description: "Soft cottage cheese blocks stir-fried with thick sliced bell peppers, wild purple onions, hot green chilis, and dark soy-chili sauce.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600",
    spiciness: 3,
    rating: 4.9,
    ratingCount: 810
  },
  {
    id: "c4",
    name: "Veg Fried Rice",
    price: 150,
    category: "chinese",
    description: "Premium fragrant basmati rice grains scrambled on a fiery wok with minced beans, carrots, scallions, and soy-garlic mix.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 390
  },

  // INDIAN MAIN COURSE
  {
    id: "mc1",
    name: "Dal Rajma Chole with Rice",
    price: 180,
    category: "main-course",
    description: "A premium North Indian combination platter featuring rich buttery dal, spiced kidney beans and chole over fluffy steamed rice.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 430
  },
  {
    id: "mc2",
    name: "Paneer Butter Masala with Naan",
    price: 240,
    category: "main-course",
    description: "Indulgent sweet paneer chunks in tomato-butter cashew sauce, served hot with a butter-kissed garlic naan.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.9,
    ratingCount: 1120
  },
  {
    id: "mc3",
    name: "Kadhi Paneer with Laccha Paratha",
    price: 230,
    category: "main-course",
    description: "Velvety spiced curd-gramflour kadhi with paneer cubes, served with a layered, crispy oven-baked wheat flatbread.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.6,
    ratingCount: 340
  },
  {
    id: "mc4",
    name: "Paneer Butter Masala (Full portion)",
    price: 280,
    category: "main-course",
    description: "Rich, velvety golden gravy infused with cream and butter, carrying soft luxurious cottage cheese blocks.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 890
  },
  {
    id: "mc5",
    name: "Mix Veg",
    price: 220,
    category: "main-course",
    description: "Fresh hand-cut carrots, peas, beans, cauliflower and potatoes stir-fried with standard ginger and indian garam masala layers.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.4,
    ratingCount: 220
  },
  {
    id: "mc6",
    name: "Chana Masala",
    price: 200,
    category: "main-course",
    description: "Robust, spicy chickpeas slow-cooked in a caramelized onion and tangy tomato sauce with aromatic dry mango powder flavor.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.5,
    ratingCount: 370
  },

  // BIRYANI & RICE
  {
    id: "br1",
    name: "Veg Dum Biryani with Raita",
    price: 240,
    category: "biryani-rice",
    description: "Basmati rice layered with garden fresh vegetables, saffron, mint leaves, slow cooked on 'dum' steam, matched with delicious Boondi Raita.",
    isVeg: true,
    isChefSpecial: true,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600",
    spiciness: 2,
    rating: 4.9,
    ratingCount: 670
  },
  {
    id: "br2",
    name: "Steamed Rice",
    price: 100,
    category: "biryani-rice",
    description: "Fluffy, premium long-grain boiled Basmati rice, perfectly prepared and steaming hot.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1596560548464-f01068e60227?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.3,
    ratingCount: 150
  },
  {
    id: "br3",
    name: "Jeera Rice",
    price: 120,
    category: "biryani-rice",
    description: "Aromatic basmati rice tossed with cracked cumin seeds and standard ghee for a delightful scent.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1596560548464-f01068e60227?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 290
  },

  // KULCHA
  {
    id: "k1",
    name: "Aloo Kulcha",
    price: 90,
    category: "kulcha",
    description: "Soft leavened tandoor-baked flatbread stuffed with spiced potato mash, finished with heavy butter brushes.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 240
  },
  {
    id: "k2",
    name: "Paneer Kulcha",
    price: 120,
    category: "kulcha",
    description: "Golden stuffed flatbread with spiced grated paneer, coriander flakes, cooked in clay oven.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 460
  },
  {
    id: "k3",
    name: "Mix Veg Kulcha",
    price: 110,
    category: "kulcha",
    description: "Flatbread stuffed with fine-shredded carrots, cabbage, and spiced boiled potato crumbs.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.4,
    ratingCount: 190
  },
  {
    id: "k4",
    name: "Cheese Kulcha",
    price: 130,
    category: "kulcha",
    description: "Warm flatbread loaded with stringy white cheese inside, providing a beautiful bite consistency.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 280
  },
  {
    id: "k5",
    name: "Dal Makhani / Chole / Raita combo",
    price: 160,
    category: "kulcha",
    description: "Thick, slow-brewed black lentils matched with chole gravy, cool Boondi raita - perfect addition to standard bread.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.8,
    ratingCount: 510
  },

  // PARATHA
  {
    id: "pa1",
    name: "Aloo Paratha",
    price: 90,
    category: "paratha",
    description: "Griddled wholewheat paratha stuffed heavily with spicy boiled potato mixture, served with butter.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.7,
    ratingCount: 580
  },
  {
    id: "pa2",
    name: "Onion Paratha",
    price: 90,
    category: "paratha",
    description: "Flaky crisp flatbread holding seasoned purple onion shreds, salt, chilis, cooked on standard pan.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.5,
    ratingCount: 220
  },
  {
    id: "pa3",
    name: "Gobhi Paratha",
    price: 90,
    category: "paratha",
    description: "Spiced grated cauliflower filling flatbread cooked with pure oil till crisp brown flakes form on skin.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 310
  },
  {
    id: "pa4",
    name: "Paneer Paratha",
    price: 120,
    category: "paratha",
    description: "Sagar Ratna top tier item: flatbread stuffed with sweet house-grated cottage cheese and dry mango spices.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.9,
    ratingCount: 940
  },
  {
    id: "pa5",
    name: "Mix Paratha",
    price: 110,
    category: "paratha",
    description: "Cabbage, carrots, potatoes, and spices stuffed together inside a crispy butter-baked flatbread.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    spiciness: 1,
    rating: 4.6,
    ratingCount: 190
  },

  // TEA & COFFEE
  {
    id: "tc1",
    name: "Premium Chai / Tea",
    price: 40,
    category: "tea-coffee",
    description: "Authentic Indian milk tea brewed with crushed cardamoms, grated ginger stalks, and premium tea leaves.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.8,
    ratingCount: 540
  },
  {
    id: "tc2",
    name: "Black Tea",
    price: 35,
    category: "tea-coffee",
    description: "Pure hot tea decoction crafted from high quality Darjeeling leaves, standard sugar options.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 120
  },
  {
    id: "tc3",
    name: "Hot Coffee",
    price: 60,
    category: "tea-coffee",
    description: "Creamy, frothed hot coffee brewed using dark roasted coffee beans and caramelized hot milk.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 390
  },

  // RAITA
  {
    id: "rai1",
    name: "Boondi Raita",
    price: 70,
    category: "raita",
    description: "Whisked cold yogurt containing salted crispy chickpea flour spheres (boondi) and roasted cumin.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.6,
    ratingCount: 220
  },
  {
    id: "rai2",
    name: "Veg Raita",
    price: 80,
    category: "raita",
    description: "Cooling spiced yogurt match with finely diced cucumbers, red onions, ripe tomatoes and mint greenery.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.5,
    ratingCount: 180
  },

  // REFRESHERS
  {
    id: "ref1",
    name: "Buttermilk (Chaas)",
    price: 50,
    category: "refreshers",
    description: "Cooling salted churned yogurt drink enhanced with hints of black salt, ginger extracts, and roasted cumin.",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.7,
    ratingCount: 310
  },
  {
    id: "ref2",
    name: "Punjabi Lassi",
    price: 90,
    category: "refreshers",
    description: "Thick sweet lassi prepared with curd, crushed cardamoms, decorated with thick clotted malai layer on top.",
    isVeg: true,
    isBestseller: true,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.9,
    ratingCount: 720
  },
  {
    id: "ref3",
    name: "Fresh Lime Water",
    price: 40,
    category: "refreshers",
    description: "Squeezed fresh green lemon drop mixed beautifully inside purified water (served sweet, salted or mixed).",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    spiciness: 0,
    rating: 4.4,
    ratingCount: 190
  }
];

export const reviews: Review[] = [
  {
    id: "rev1",
    name: "Aarav Sharma",
    rating: 5,
    date: "June 12, 2026",
    comment: "The Masala Dosa has been my favorite for years. The sambar has that authentic taste that builds nostalgic memories. Outstanding digital ordering process too!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "rev2",
    name: "Sneha Patel",
    rating: 5,
    date: "May 28, 2026",
    comment: "Excellent food! Paneer Tikka pizza crust is perfect, and Chole Bhature are amazingly fluffy. Ordering via WhatsApp was super easy and fast. Highly recommended!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "rev3",
    name: "Vikas Rajput",
    rating: 4,
    date: "June 05, 2026",
    comment: "Sagar Ratna maintains its high quality standard always. Their Malai Soya Chaap is outstandingly soft and delicious. Visually stunning online menu!",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  }
];
