export const PRODUCT_CATEGORIES = {
  // Textile
  'raw_cotton': 'Raw Cotton',
  'yarn': 'Yarn / Thread',
  'grey_fabric': 'Grey Fabric (Unprocessed)',
  'finished_fabric': 'Finished Fabric',
  'denim': 'Denim',
  'silk': 'Silk',
  'synthetic_fabric': 'Synthetic Fabric',
  'khaddar': 'Khaddar / Cotton Lawn',
  
  // Garment
  'readymade_shirts': 'Ready-made Shirts',
  'readymade_pants': 'Ready-made Trousers',
  'workwear': 'Workwear / Uniforms',
  'export_garments': 'Export Quality Garments',
  
  // Agri / Food
  'basmati_rice': 'Basmati Rice',
  'irri_rice': 'IRRI Rice',
  'wheat_flour': 'Wheat Flour',
  'sugar': 'Sugar',
  'edible_oil': 'Edible Oil',
  
  // Industrial
  'machine_parts': 'Machine Parts',
  'packaging_material': 'Packaging Material',
  'chemicals': 'Industrial Chemicals',
  'dyes': 'Fabric Dyes',
  
  // Leather
  'raw_hides': 'Raw Hides / Leather',
  'finished_leather': 'Finished Leather',
  'shoe_uppers': 'Shoe Uppers',
  
  // Construction
  'steel_rods': 'Steel Rods / Rebar',
  'cement': 'Cement',
  'bricks': 'Bricks / Blocks',
  'tiles': 'Floor/Wall Tiles',
}

// Units by product type
export const PRODUCT_UNITS: Record<string, string[]> = {
  'fabric': ['meter', 'yard', 'kg', 'thaan'],
  'grain': ['kg', 'ton', 'maund', 'bag'],
  'garment': ['piece', 'dozen', 'carton'],
  'chemical': ['liter', 'kg', 'drum'],
  'construction': ['ton', 'piece', 'bag', 'sq.meter'],
}
