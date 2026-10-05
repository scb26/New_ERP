// Curated Pre-Seeded Indian FMCG, Grocery, Personal Care & Packaged Goods Barcode Master Catalog
// Standard EAN-13 barcodes, statutory HSN codes, realistic MRP, and CGST/SGST tax slabs.

export interface MasterBarcodeItem {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  defaultMrp: number;
  defaultCost: number;
  defaultHsn: string;
  defaultGst: number;
  imageUrl?: string;
}

export const SEED_BARCODE_MASTER: MasterBarcodeItem[] = [
  // --- BISCUITS & COOKIES ---
  {
    barcode: "8901719101037",
    name: "Parle-G Glucose Biscuits 250g",
    brand: "Parle",
    category: "Biscuits & Snacks",
    defaultMrp: 25,
    defaultCost: 20,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901719101181",
    name: "Parle-G Gold Biscuits 800g",
    brand: "Parle",
    category: "Biscuits & Snacks",
    defaultMrp: 80,
    defaultCost: 65,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901063012232",
    name: "Britannia Good Day Butter Cookies 200g",
    brand: "Britannia",
    category: "Biscuits & Snacks",
    defaultMrp: 40,
    defaultCost: 32,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901063012249",
    name: "Britannia Good Day Cashew Cookies 200g",
    brand: "Britannia",
    category: "Biscuits & Snacks",
    defaultMrp: 45,
    defaultCost: 36,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901063011310",
    name: "Britannia Marie Gold 250g",
    brand: "Britannia",
    category: "Biscuits & Snacks",
    defaultMrp: 35,
    defaultCost: 28,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901725131013",
    name: "Sunfeast Dark Fantasy Choco Fills 300g",
    brand: "Sunfeast",
    category: "Biscuits & Snacks",
    defaultMrp: 120,
    defaultCost: 96,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901233024518",
    name: "Cadbury Oreo Original Vanilla 120g",
    brand: "Cadbury",
    category: "Biscuits & Snacks",
    defaultMrp: 35,
    defaultCost: 28,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901719101501",
    name: "Parle Monaco Salted Crackers 200g",
    brand: "Parle",
    category: "Biscuits & Snacks",
    defaultMrp: 30,
    defaultCost: 24,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901719101518",
    name: "Parle Krackjack Sweet & Salty 200g",
    brand: "Parle",
    category: "Biscuits & Snacks",
    defaultMrp: 30,
    defaultCost: 24,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901063012508",
    name: "Britannia Bourbon Chocolate Cream 150g",
    brand: "Britannia",
    category: "Biscuits & Snacks",
    defaultMrp: 35,
    defaultCost: 28,
    defaultHsn: "1905",
    defaultGst: 18
  },
  {
    barcode: "8901063012706",
    name: "Britannia 50-50 Maska Chaska 120g",
    brand: "Britannia",
    category: "Biscuits & Snacks",
    defaultMrp: 25,
    defaultCost: 20,
    defaultHsn: "1905",
    defaultGst: 18
  },

  // --- DAIRY & BEVERAGES ---
  {
    barcode: "8901262010125",
    name: "Amul Butter Pasteurised 500g",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 285,
    defaultCost: 250,
    defaultHsn: "0405",
    defaultGst: 12
  },
  {
    barcode: "8901262010118",
    name: "Amul Butter Pasteurised 100g",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 58,
    defaultCost: 50,
    defaultHsn: "0405",
    defaultGst: 12
  },
  {
    barcode: "8901262010019",
    name: "Amul Taaza Homogenised Toned Milk 1L",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 56,
    defaultCost: 50,
    defaultHsn: "0401",
    defaultGst: 5
  },
  {
    barcode: "8901262010026",
    name: "Amul Gold Homogenised Standardised Milk 1L",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 68,
    defaultCost: 61,
    defaultHsn: "0401",
    defaultGst: 5
  },
  {
    barcode: "8901262010200",
    name: "Amul Pure Ghee 1L Tin",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 620,
    defaultCost: 550,
    defaultHsn: "0405",
    defaultGst: 12
  },
  {
    barcode: "8901262010309",
    name: "Amul Processed Cheese Block 200g",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 135,
    defaultCost: 118,
    defaultHsn: "0406",
    defaultGst: 12
  },
  {
    barcode: "8901262010316",
    name: "Amul Cheese Slices 200g (10 Slices)",
    brand: "Amul",
    category: "Dairy & Eggs",
    defaultMrp: 145,
    defaultCost: 126,
    defaultHsn: "0406",
    defaultGst: 12
  },
  {
    barcode: "8901648001012",
    name: "Mother Dairy Cow Milk 1L",
    brand: "Mother Dairy",
    category: "Dairy & Eggs",
    defaultMrp: 58,
    defaultCost: 52,
    defaultHsn: "0401",
    defaultGst: 5
  },
  {
    barcode: "8901030006019",
    name: "Tata Tea Gold 500g",
    brand: "Tata",
    category: "Beverages",
    defaultMrp: 310,
    defaultCost: 260,
    defaultHsn: "0902",
    defaultGst: 5
  },
  {
    barcode: "8901030006026",
    name: "Brooke Bond Red Label Tea 500g",
    brand: "Red Label",
    category: "Beverages",
    defaultMrp: 290,
    defaultCost: 245,
    defaultHsn: "0902",
    defaultGst: 5
  },
  {
    barcode: "8901030006033",
    name: "Brooke Bond Taj Mahal Tea 500g",
    brand: "Taj Mahal",
    category: "Beverages",
    defaultMrp: 380,
    defaultCost: 320,
    defaultHsn: "0902",
    defaultGst: 5
  },
  {
    barcode: "8901058853109",
    name: "Nescafe Classic 100% Pure Coffee 100g Jar",
    brand: "Nescafe",
    category: "Beverages",
    defaultMrp: 360,
    defaultCost: 300,
    defaultHsn: "2101",
    defaultGst: 18
  },
  {
    barcode: "8901030006101",
    name: "Bru Instant Coffee 100g",
    brand: "Bru",
    category: "Beverages",
    defaultMrp: 210,
    defaultCost: 175,
    defaultHsn: "2101",
    defaultGst: 18
  },
  {
    barcode: "8901030006200",
    name: "Horlicks Classic Malt Health Drink 500g",
    brand: "Horlicks",
    category: "Beverages",
    defaultMrp: 285,
    defaultCost: 240,
    defaultHsn: "1901",
    defaultGst: 18
  },
  {
    barcode: "8901233024600",
    name: "Cadbury Bournvita Chocolate Drink 500g",
    brand: "Bournvita",
    category: "Beverages",
    defaultMrp: 245,
    defaultCost: 205,
    defaultHsn: "1901",
    defaultGst: 18
  },
  {
    barcode: "8901764012012",
    name: "Coca-Cola 750ml PET Bottle",
    brand: "Coca-Cola",
    category: "Beverages",
    defaultMrp: 40,
    defaultCost: 32,
    defaultHsn: "2202",
    defaultGst: 28
  },
  {
    barcode: "8901764012029",
    name: "Thums Up 750ml PET Bottle",
    brand: "Thums Up",
    category: "Beverages",
    defaultMrp: 40,
    defaultCost: 32,
    defaultHsn: "2202",
    defaultGst: 28
  },
  {
    barcode: "8901764012036",
    name: "Sprite 750ml PET Bottle",
    brand: "Sprite",
    category: "Beverages",
    defaultMrp: 40,
    defaultCost: 32,
    defaultHsn: "2202",
    defaultGst: 28
  },
  {
    barcode: "8901719102010",
    name: "Parle Frooti Mango Drink 600ml",
    brand: "Frooti",
    category: "Beverages",
    defaultMrp: 40,
    defaultCost: 33,
    defaultHsn: "2202",
    defaultGst: 12
  },
  {
    barcode: "8901764012043",
    name: "Maaza Mango Drink 600ml",
    brand: "Maaza",
    category: "Beverages",
    defaultMrp: 42,
    defaultCost: 34,
    defaultHsn: "2202",
    defaultGst: 12
  },

  // --- INSTANT NOODLES, SOUPS & SAUCES ---
  {
    barcode: "8901058852331",
    name: "Maggi 2-Minute Noodles Masala 70g",
    brand: "Maggi",
    category: "Instant Food",
    defaultMrp: 14,
    defaultCost: 11.5,
    defaultHsn: "1902",
    defaultGst: 18
  },
  {
    barcode: "8901058852348",
    name: "Maggi 2-Minute Noodles Masala 4-Pack (280g)",
    brand: "Maggi",
    category: "Instant Food",
    defaultMrp: 56,
    defaultCost: 46,
    defaultHsn: "1902",
    defaultGst: 18
  },
  {
    barcode: "8901725132010",
    name: "Sunfeast Yippee Magic Masala Noodles 260g",
    brand: "Yippee",
    category: "Instant Food",
    defaultMrp: 50,
    defaultCost: 41,
    defaultHsn: "1902",
    defaultGst: 18
  },
  {
    barcode: "8901030007016",
    name: "Knorr Classic Mixed Vegetable Soup 43g",
    brand: "Knorr",
    category: "Instant Food",
    defaultMrp: 55,
    defaultCost: 45,
    defaultHsn: "2104",
    defaultGst: 18
  },
  {
    barcode: "8901030007108",
    name: "Kissan Fresh Tomato Ketchup 950g",
    brand: "Kissan",
    category: "Sauces & Condiments",
    defaultMrp: 140,
    defaultCost: 115,
    defaultHsn: "2103",
    defaultGst: 12
  },
  {
    barcode: "8901058852409",
    name: "Maggi Hot & Sweet Tomato Chilli Sauce 1kg",
    brand: "Maggi",
    category: "Sauces & Condiments",
    defaultMrp: 165,
    defaultCost: 135,
    defaultHsn: "2103",
    defaultGst: 12
  },
  {
    barcode: "8901595851012",
    name: "Ching's Secret Schezwan Chutney 250g",
    brand: "Ching's",
    category: "Sauces & Condiments",
    defaultMrp: 85,
    defaultCost: 70,
    defaultHsn: "2103",
    defaultGst: 12
  },

  // --- STAPLES, SPICES & COOKING OILS ---
  {
    barcode: "8901030005012",
    name: "Tata Salt Vacuum Evaporated Iodised 1kg",
    brand: "Tata",
    category: "Staples & Grocery",
    defaultMrp: 28,
    defaultCost: 24,
    defaultHsn: "2501",
    defaultGst: 0
  },
  {
    barcode: "8901725181223",
    name: "Aashirvaad Shudh Chakki Atta 5kg",
    brand: "Aashirvaad",
    category: "Staples & Grocery",
    defaultMrp: 260,
    defaultCost: 225,
    defaultHsn: "1101",
    defaultGst: 5
  },
  {
    barcode: "8901725181230",
    name: "Aashirvaad Shudh Chakki Atta 10kg",
    brand: "Aashirvaad",
    category: "Staples & Grocery",
    defaultMrp: 495,
    defaultCost: 430,
    defaultHsn: "1101",
    defaultGst: 5
  },
  {
    barcode: "8906007281014",
    name: "Fortune Sunlite Refined Sunflower Oil 1L Pouch",
    brand: "Fortune",
    category: "Cooking Oils",
    defaultMrp: 145,
    defaultCost: 128,
    defaultHsn: "1512",
    defaultGst: 5
  },
  {
    barcode: "8906007281021",
    name: "Fortune Kachi Ghani Mustard Oil 1L Pouch",
    brand: "Fortune",
    category: "Cooking Oils",
    defaultMrp: 160,
    defaultCost: 140,
    defaultHsn: "1514",
    defaultGst: 5
  },
  {
    barcode: "8901138831012",
    name: "Saffola Gold Pro Healthy Lifestyle Oil 1L",
    brand: "Saffola",
    category: "Cooking Oils",
    defaultMrp: 185,
    defaultCost: 160,
    defaultHsn: "1517",
    defaultGst: 5
  },
  {
    barcode: "8901537001015",
    name: "Daawat Rozana Super Basmati Rice 5kg",
    brand: "Daawat",
    category: "Staples & Grocery",
    defaultMrp: 425,
    defaultCost: 360,
    defaultHsn: "1006",
    defaultGst: 5
  },
  {
    barcode: "8901725001019",
    name: "India Gate Basmati Rice Feast Rozzana 5kg",
    brand: "India Gate",
    category: "Staples & Grocery",
    defaultMrp: 450,
    defaultCost: 380,
    defaultHsn: "1006",
    defaultGst: 5
  },
  {
    barcode: "8901504001018",
    name: "MDH Deggi Mirch 100g",
    brand: "MDH",
    category: "Spices & Masala",
    defaultMrp: 88,
    defaultCost: 72,
    defaultHsn: "0910",
    defaultGst: 5
  },
  {
    barcode: "8901786001011",
    name: "Everest Turmeric Powder (Haldi) 200g",
    brand: "Everest",
    category: "Spices & Masala",
    defaultMrp: 62,
    defaultCost: 50,
    defaultHsn: "0910",
    defaultGst: 5
  },
  {
    barcode: "8901786001028",
    name: "Everest Red Chilli Powder 200g",
    brand: "Everest",
    category: "Spices & Masala",
    defaultMrp: 95,
    defaultCost: 78,
    defaultHsn: "0910",
    defaultGst: 5
  },
  {
    barcode: "8901058001012",
    name: "Catch Black Pepper Table Sprinkler 100g",
    brand: "Catch",
    category: "Spices & Masala",
    defaultMrp: 99,
    defaultCost: 82,
    defaultHsn: "0904",
    defaultGst: 5
  },

  // --- PERSONAL CARE & SOAPS ---
  {
    barcode: "8901396321012",
    name: "Dettol Antiseptic Disinfectant Liquid 550ml",
    brand: "Dettol",
    category: "Personal Care",
    defaultMrp: 255,
    defaultCost: 215,
    defaultHsn: "3808",
    defaultGst: 18
  },
  {
    barcode: "8901396321029",
    name: "Dettol Original Bathing Soap 75g (Buy 3 Get 1)",
    brand: "Dettol",
    category: "Personal Care",
    defaultMrp: 135,
    defaultCost: 110,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901030008013",
    name: "Lifebuoy Total 10 Germ Protection Soap 125g",
    brand: "Lifebuoy",
    category: "Personal Care",
    defaultMrp: 42,
    defaultCost: 34,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901030008020",
    name: "Lux Rose & Vitamin E Glowing Skin Soap 100g",
    brand: "Lux",
    category: "Personal Care",
    defaultMrp: 38,
    defaultCost: 31,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901030008037",
    name: "Dove Cream Beauty Bathing Bar 100g",
    brand: "Dove",
    category: "Personal Care",
    defaultMrp: 65,
    defaultCost: 53,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901030008044",
    name: "Pears Pure & Gentle Glycerin Soap 125g",
    brand: "Pears",
    category: "Personal Care",
    defaultMrp: 70,
    defaultCost: 58,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901399001010",
    name: "Santoor Sandal & Turmeric Soap 100g",
    brand: "Santoor",
    category: "Personal Care",
    defaultMrp: 36,
    defaultCost: 29,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901314010620",
    name: "Colgate Strong Teeth Dental Paste 200g",
    brand: "Colgate",
    category: "Oral Care",
    defaultMrp: 115,
    defaultCost: 95,
    defaultHsn: "3306",
    defaultGst: 18
  },
  {
    barcode: "8901314010637",
    name: "Colgate MaxFresh Peppermint Ice Gel 150g",
    brand: "Colgate",
    category: "Oral Care",
    defaultMrp: 110,
    defaultCost: 90,
    defaultHsn: "3306",
    defaultGst: 18
  },
  {
    barcode: "8901030008105",
    name: "Close Up Everfresh Red Hot Gel 150g",
    brand: "Close Up",
    category: "Oral Care",
    defaultMrp: 105,
    defaultCost: 86,
    defaultHsn: "3306",
    defaultGst: 18
  },
  {
    barcode: "8901571001014",
    name: "Sensodyne Fresh Mint Sensitive Toothpaste 100g",
    brand: "Sensodyne",
    category: "Oral Care",
    defaultMrp: 160,
    defaultCost: 135,
    defaultHsn: "3306",
    defaultGst: 18
  },
  {
    barcode: "8901314011016",
    name: "Head & Shoulders Cool Menthol Shampoo 180ml",
    brand: "Head & Shoulders",
    category: "Hair Care",
    defaultMrp: 175,
    defaultCost: 145,
    defaultHsn: "3305",
    defaultGst: 18
  },
  {
    barcode: "8901030008204",
    name: "Clinic Plus Strong & Long Health Shampoo 175ml",
    brand: "Clinic Plus",
    category: "Hair Care",
    defaultMrp: 110,
    defaultCost: 90,
    defaultHsn: "3305",
    defaultGst: 18
  },
  {
    barcode: "8901030008211",
    name: "Sunsilk Black Shine Shampoo 180ml",
    brand: "Sunsilk",
    category: "Hair Care",
    defaultMrp: 130,
    defaultCost: 108,
    defaultHsn: "3305",
    defaultGst: 18
  },
  {
    barcode: "8901088011012",
    name: "Parachute 100% Pure Coconut Hair Oil 250ml",
    brand: "Parachute",
    category: "Hair Care",
    defaultMrp: 115,
    defaultCost: 98,
    defaultHsn: "1513",
    defaultGst: 5
  },
  {
    barcode: "8904256001013",
    name: "Nivea Soft Light Moisturizing Cream 100ml",
    brand: "Nivea",
    category: "Personal Care",
    defaultMrp: 199,
    defaultCost: 165,
    defaultHsn: "3304",
    defaultGst: 18
  },

  // --- HOME CARE & CLEANING ---
  {
    barcode: "8901030009010",
    name: "Surf Excel Easy Wash Detergent Powder 1kg",
    brand: "Surf Excel",
    category: "Home Care",
    defaultMrp: 145,
    defaultCost: 122,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901030009027",
    name: "Surf Excel Matic Front Load Liquid 1L",
    brand: "Surf Excel",
    category: "Home Care",
    defaultMrp: 230,
    defaultCost: 195,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901314012013",
    name: "Ariel Matic Top Load Washing Powder 1kg",
    brand: "Ariel",
    category: "Home Care",
    defaultMrp: 220,
    defaultCost: 185,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901314012020",
    name: "Tide Plus Extra Power Jasmine & Rose 1kg",
    brand: "Tide",
    category: "Home Care",
    defaultMrp: 115,
    defaultCost: 96,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901030009034",
    name: "Rin Detergent Bar 250g",
    brand: "Rin",
    category: "Home Care",
    defaultMrp: 20,
    defaultCost: 16.5,
    defaultHsn: "3401",
    defaultGst: 18
  },
  {
    barcode: "8901030009102",
    name: "Vim Dishwash Bar with Lemon 300g",
    brand: "Vim",
    category: "Home Care",
    defaultMrp: 25,
    defaultCost: 20.5,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901030009119",
    name: "Vim Dishwash Gel Lemon 500ml Bottle",
    brand: "Vim",
    category: "Home Care",
    defaultMrp: 120,
    defaultCost: 100,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901396322019",
    name: "Harpic Power Plus Disinfectant Toilet Cleaner 500ml",
    brand: "Harpic",
    category: "Home Care",
    defaultMrp: 99,
    defaultCost: 82,
    defaultHsn: "3808",
    defaultGst: 18
  },
  {
    barcode: "8901396322026",
    name: "Lizol Disinfectant Surface Floor Cleaner Citrus 500ml",
    brand: "Lizol",
    category: "Home Care",
    defaultMrp: 110,
    defaultCost: 91,
    defaultHsn: "3808",
    defaultGst: 18
  },
  {
    barcode: "8901396322033",
    name: "Colin Glass and Household Cleaner Spray 500ml",
    brand: "Colin",
    category: "Home Care",
    defaultMrp: 98,
    defaultCost: 81,
    defaultHsn: "3402",
    defaultGst: 18
  },
  {
    barcode: "8901023001014",
    name: "Good Knight Gold Flash Liquid Vaporizer Refill 45ml",
    brand: "Good Knight",
    category: "Home Care",
    defaultMrp: 85,
    defaultCost: 70,
    defaultHsn: "3808",
    defaultGst: 18
  },
  {
    barcode: "8901170001015",
    name: "All Out Ultra Power+ Mosquito Repellent Refill 45ml",
    brand: "All Out",
    category: "Home Care",
    defaultMrp: 82,
    defaultCost: 68,
    defaultHsn: "3808",
    defaultGst: 18
  },

  // --- CHOCOLATES & CONFECTIONERY ---
  {
    barcode: "8901233024501",
    name: "Cadbury Dairy Milk Silk Chocolate Bar 150g",
    brand: "Cadbury",
    category: "Chocolates",
    defaultMrp: 180,
    defaultCost: 150,
    defaultHsn: "1806",
    defaultGst: 18
  },
  {
    barcode: "8901233024525",
    name: "Cadbury 5 Star Chocolate Bar 40g",
    brand: "Cadbury",
    category: "Chocolates",
    defaultMrp: 20,
    defaultCost: 16.5,
    defaultHsn: "1806",
    defaultGst: 18
  },
  {
    barcode: "8901058854014",
    name: "Nestle KitKat 4-Finger Crisp Wafer Bar 38.5g",
    brand: "Nestle",
    category: "Chocolates",
    defaultMrp: 25,
    defaultCost: 20.5,
    defaultHsn: "1806",
    defaultGst: 18
  },
  {
    barcode: "8901058854021",
    name: "Nestle Munch Crunch-O-Nuts 32g",
    brand: "Nestle",
    category: "Chocolates",
    defaultMrp: 15,
    defaultCost: 12,
    defaultHsn: "1806",
    defaultGst: 18
  },
  {
    barcode: "8901233024532",
    name: "Cadbury Perk Chocolate Wafer Bar 28g",
    brand: "Cadbury",
    category: "Chocolates",
    defaultMrp: 10,
    defaultCost: 8,
    defaultHsn: "1806",
    defaultGst: 18
  },

  // --- SNACKS & NAMKEEN ---
  {
    barcode: "8901491101018",
    name: "Lay's India's Magic Masala Potato Chips 50g",
    brand: "Lay's",
    category: "Snacks",
    defaultMrp: 20,
    defaultCost: 16,
    defaultHsn: "2005",
    defaultGst: 12
  },
  {
    barcode: "8901491101025",
    name: "Lay's Spanish Tomato Tango Potato Chips 50g",
    brand: "Lay's",
    category: "Snacks",
    defaultMrp: 20,
    defaultCost: 16,
    defaultHsn: "2005",
    defaultGst: 12
  },
  {
    barcode: "8901491102015",
    name: "Kurkure Masala Munch Crispy Snack 85g",
    brand: "Kurkure",
    category: "Snacks",
    defaultMrp: 20,
    defaultCost: 16,
    defaultHsn: "2005",
    defaultGst: 12
  },
  {
    barcode: "8904063201017",
    name: "Haldiram's Nagpur Aloo Bhujia 200g",
    brand: "Haldiram's",
    category: "Snacks",
    defaultMrp: 55,
    defaultCost: 45,
    defaultHsn: "2106",
    defaultGst: 12
  },
  {
    barcode: "8904063201024",
    name: "Haldiram's Nagpur Salted Moong Dal 200g",
    brand: "Haldiram's",
    category: "Snacks",
    defaultMrp: 60,
    defaultCost: 49,
    defaultHsn: "2106",
    defaultGst: 12
  },
  {
    barcode: "8901725133017",
    name: "Bingo! Mad Angles Achaari Masti 66g",
    brand: "Bingo",
    category: "Snacks",
    defaultMrp: 20,
    defaultCost: 16,
    defaultHsn: "2005",
    defaultGst: 12
  },

  // --- COMMON ELECTRONICS & ACCESSORIES ---
  {
    barcode: "6901234567890",
    name: "Apple iPhone 15 Pro (128GB - Natural Titanium)",
    brand: "Apple",
    category: "Electronics",
    defaultMrp: 134900,
    defaultCost: 120000,
    defaultHsn: "8517",
    defaultGst: 18
  },
  {
    barcode: "8901234567890",
    name: "Logitech K380 Multi-Device Wireless Keyboard",
    brand: "Logitech",
    category: "Electronics",
    defaultMrp: 2499,
    defaultCost: 1999,
    defaultHsn: "8471",
    defaultGst: 18
  },
  {
    barcode: "8901234567800",
    name: "Samsung 25W Type-C Fast Charger Power Adapter",
    brand: "Samsung",
    category: "Electronics",
    defaultMrp: 1299,
    defaultCost: 850,
    defaultHsn: "8504",
    defaultGst: 18
  },
  {
    barcode: "8901234567801",
    name: "boAt Rockerz 450 Bluetooth On-Ear Headphones",
    brand: "boAt",
    category: "Electronics",
    defaultMrp: 1499,
    defaultCost: 999,
    defaultHsn: "8518",
    defaultGst: 18
  }
];
