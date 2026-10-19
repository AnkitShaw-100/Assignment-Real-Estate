// Seed listings. Images are Unsplash photos (free to use); `img()` builds a sized URL.
const img = (id, alt) => ({ url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`, alt });

const INTERIORS = [
  img('1600566753190-17f0baa2a6c3', 'Open living room with large windows'),
  img('1600210492486-724fe5c67fb0', 'Bright living area with sofa'),
  img('1600607687939-ce8a6c25118c', 'Modern kitchen and dining space'),
  img('1600607687644-c7171b42498f', 'Kitchen island with pendant lights'),
  img('1616594039964-ae9021a400a0', 'Calm bedroom with soft light'),
  img('1618221195710-dd6b41faaea6', 'Minimal living room'),
  img('1600566752355-35792bedcfea', 'Dining room with garden view'),
  img('1556912173-3bb406ef7e77', 'Kitchen with natural wood'),
];
// Rotate a few interiors after each cover so every gallery has 4 photos
const gallery = (cover, i) => [cover, INTERIORS[i % 8], INTERIORS[(i + 3) % 8], INTERIORS[(i + 5) % 8]];

const RESIDENTIAL_AMENITIES = ['Swimming pool', 'Garden', 'Air conditioning', 'Fireplace', 'Home office', 'Smart home', 'Gym', 'Security', 'Balcony', 'Sea view', 'Walk-in closet', 'EV charging'];
const COMMERCIAL_AMENITIES = ['24/7 access', 'Reception', 'Elevator', 'Air conditioning', 'Loading bay', 'Fibre internet', 'Security', 'Parking'];

const pick = (list, n, offset) => Array.from({ length: n }, (_, k) => list[(offset + k * 3) % list.length]).filter((v, i, a) => a.indexOf(v) === i);

const raw = [
  ['Villa in Algarve', 'villa', 'sale', 1_295_000, 'Lagos', 'Algarve', 'Portugal', 4, 3, 3400, '1600596542815-ffad4c1539a9', true,
    "Nestled along Portugal's southern coast, this contemporary villa blends clean modern lines with coastal calm. Floor-to-ceiling glass opens the living space onto a terrace and pool, and the beach is a ten minute walk away."],
  ['Penthouse in Dubai Marina', 'penthouse', 'sale', 2_875_000, 'Dubai', 'Dubai Marina', 'UAE', 3, 4, 3100, '1512917774080-9991f1c4c750', true,
    'A full-floor penthouse with wraparound views of the marina and the Gulf. Private lift access, a rooftop plunge pool and a kitchen built for entertaining.'],
  ['Modern house in Beverly Hills', 'house', 'sale', 3_120_000, 'Los Angeles', 'Beverly Hills', 'USA', 5, 5, 4800, '1600585154340-be6161a56a0c', true,
    'Set on a quiet, tree-lined street, this light-filled home pairs warm oak with polished concrete. The back garden steps down to a heated pool and an outdoor kitchen.'],
  ['Seaside mansion in Nice', 'villa', 'sale', 4_200_000, 'Nice', 'Mont Boron', 'France', 6, 6, 6200, '1613490493576-7fde63acd811', true,
    'A restored Belle Époque mansion above the Baie des Anges. Terraced gardens, a guest house and uninterrupted views of the Mediterranean from every principal room.'],
  ['Contemporary home in Austin', 'house', 'sale', 950_000, 'Austin', 'Travis Heights', 'USA', 4, 3, 2900, '1568605114967-8130f3a36994', true,
    'Walkable to South Congress, this two-storey home has an open plan ground floor, a screened porch and a studio above the garage that works as an office or guest suite.'],
  ['Luxury apartment in Geneva', 'apartment', 'sale', 2_150_000, 'Geneva', 'Eaux-Vives', 'Switzerland', 3, 2, 1900, '1545324418-cc1a3fa10c00', true,
    'A third-floor apartment a block from the lake promenade. High ceilings, original parquet and a south-facing balcony that catches the afternoon sun.'],
  ['Coastal villa in Santorini', 'villa', 'sale', 3_490_000, 'Santorini', 'Oia', 'Greece', 4, 4, 2600, '1564013799919-ab600027ffc6', true,
    'Carved into the caldera cliffs, this whitewashed villa has an infinity pool facing the sunset, cave bedrooms that stay cool all summer and a private path to the village.'],
  ['Skyline penthouse in New York', 'penthouse', 'sale', 7_300_000, 'New York', 'Tribeca', 'USA', 4, 5, 4200, '1600047509807-ba8f99d2cdde', true,
    'A duplex penthouse with a 1,200 sq ft terrace overlooking the Hudson. Chef’s kitchen, library with a fireplace and a primary suite with its own sitting room.'],
  ['Family house in Lake Como', 'house', 'sale', 1_780_000, 'Lake Como', 'Bellagio', 'Italy', 5, 4, 3600, '1580587771525-78b9dba3b914', false,
    'A stone house with a lakeside garden and boat mooring. Restored in 2021 with underfloor heating and new windows, keeping the original terracotta floors.'],
  ['Garden villa in Bali', 'villa', 'rent', 6_500, 'Bali', 'Canggu', 'Indonesia', 3, 3, 2400, '1613977257363-707ba9348227', false,
    'An open-air villa set in a tropical garden, five minutes from the beach. Fully furnished with staff quarters, a pool and a shaded yoga pavilion. Monthly rental.'],
  ['City apartment in Amsterdam', 'apartment', 'rent', 3_200, 'Amsterdam', 'Jordaan', 'Netherlands', 2, 1, 950, '1522708323590-d24dbb6b0267', false,
    'A canal-side apartment in a 17th century house, renovated with a modern kitchen and bathroom. Furnished, with a shared roof terrace.'],
  ['Townhouse in London', 'house', 'sale', 2_650_000, 'London', 'Notting Hill', 'United Kingdom', 4, 3, 2700, '1570129477492-45c003edd2be', false,
    'A white stucco townhouse on a garden square. Five floors, a kitchen opening onto a walled garden and key access to the communal gardens.'],
  ['Desert villa in Scottsdale', 'villa', 'sale', 1_640_000, 'Scottsdale', 'Paradise Valley', 'USA', 4, 4, 3800, '1600585154526-990dced4db0d', false,
    'Single-level living framed by mountain views. A courtyard pool, a casita for guests and a garage with room for three cars.'],
  ['Loft apartment in Lisbon', 'apartment', 'rent', 2_400, 'Lisbon', 'Príncipe Real', 'Portugal', 1, 1, 780, '1502672260266-1c1ef2d93688', false,
    'A top-floor loft with exposed beams and river views, in one of Lisbon’s leafiest neighbourhoods. Furnished, available from next month.'],
  ['Hillside home in Malibu', 'house', 'sale', 5_850_000, 'Los Angeles', 'Malibu', 'USA', 5, 6, 5100, '1605276374104-dee2a0ed3cd6', false,
    'Panoramic ocean views from a quiet hillside. Walls of glass, a 60 ft lap pool and a private path down to the beach.'],
  ['Marina apartment in Dubai', 'apartment', 'rent', 9_800, 'Dubai', 'JBR', 'UAE', 2, 2, 1450, '1560448204-e02f11c3d0e2', false,
    'A furnished two bedroom apartment with marina views, steps from the beach walk. Building pool, gym and concierge.'],
  ['Country house in Provence', 'house', 'sale', 1_390_000, 'Gordes', 'Luberon', 'France', 5, 4, 3300, '1449844908441-8829872d2607', false,
    'A stone farmhouse among lavender fields with olive trees, a pool and a separate guest cottage. Ten minutes from the village.'],
  ['Lakefront home in Geneva', 'house', 'sale', 6_900_000, 'Geneva', 'Cologny', 'Switzerland', 6, 5, 5600, '1523217582562-09d0def993a6', false,
    'A private lakefront estate with its own jetty, mature gardens and a view of Mont Blanc on clear days.'],
  ['Grade A office in Dubai', 'office', 'rent', 24_000, 'Dubai', 'DIFC', 'UAE', 0, 4, 6500, '1486406146926-c627a92ad1ab', false,
    'A fitted office floor in the financial centre with 60 workstations, three meeting rooms and a reception. Ready to move in.'],
  ['Studio offices in London', 'office', 'rent', 18_500, 'London', 'Shoreditch', 'United Kingdom', 0, 2, 4200, '1497366216548-37526070297c', false,
    'A converted warehouse floor with high ceilings and big windows. Open plan, with a kitchen and bike storage.'],
  ['Flagship shop in New York', 'shop', 'rent', 32_000, 'New York', 'SoHo', 'USA', 0, 1, 2800, '1441986300917-64674bd600d8', false,
    'A corner retail unit with 40 ft of frontage on a busy shopping street and basement storage.'],
  ['Logistics warehouse in Rotterdam', 'warehouse', 'sale', 4_750_000, 'Rotterdam', 'Port of Rotterdam', 'Netherlands', 0, 2, 54000, '1586528116311-ad8dd3c8310d', false,
    'A modern logistics building with 12 loading docks, 12 m clear height and direct motorway access, five minutes from the port.'],
  ['Corporate office in Amsterdam', 'office', 'sale', 8_200_000, 'Amsterdam', 'Zuidas', 'Netherlands', 0, 6, 12000, '1497366811353-6870744d04b2', false,
    'A sustainable office building in the business district, BREEAM Excellent, next to Amsterdam Zuid station.'],
  ['Vineyard land in Tuscany', 'land', 'sale', 890_000, 'Montalcino', 'Tuscany', 'Italy', 0, 0, 435000, '1500382017468-9049fed747ef', false,
    'Ten acres of south-facing land with planning permission for a farmhouse and an established vineyard.'],
];

export const PROPERTIES = raw.map(
  ([title, type, purpose, price, city, area, country, bedrooms, bathrooms, areaSqft, imageId, featured, description], i) => {
    const commercial = ['office', 'shop', 'warehouse'].includes(type);
    return {
      title,
      description,
      category: commercial ? 'commercial' : 'residential',
      type,
      purpose,
      price,
      location: { city, area, country, address: `${10 + i * 7} ${area} Road` },
      bedrooms,
      bathrooms,
      areaSqft,
      parking: commercial ? 10 + (i % 4) * 5 : 1 + (i % 3),
      yearBuilt: 1990 + ((i * 7) % 34),
      amenities: commercial ? pick(COMMERCIAL_AMENITIES, 5, i) : type === 'land' ? [] : pick(RESIDENTIAL_AMENITIES, 6, i),
      images: type === 'land' || commercial ? [img(imageId, title)] : gallery(img(imageId, title), i),
      featured,
      status: 'available',
    };
  },
);
