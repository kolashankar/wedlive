// Layout Components Export
import Layout1 from './Layout1';
import Layout2 from './Layout2';
import Layout3 from './Layout3';
import Layout4 from './Layout4';
import Layout5 from './Layout5';
import Layout6 from './Layout6';
import Layout7 from './Layout7';
import Layout8 from './Layout8';

// Layout Registry - Maps layout IDs to components
export const LAYOUT_COMPONENTS = {
  'layout_1': Layout1,
  'layout_2': Layout2,
  'layout_3': Layout3,
  'layout_4': Layout4,
  'layout_5': Layout5,
  'layout_6': Layout6,
  'layout_7': Layout7,
  'layout_8': Layout8,
};

// Layout Schemas
import layout1Schema from './schemas/layout1Schema.json';
import layout2Schema from './schemas/layout2Schema.json';
import layout3Schema from './schemas/layout3Schema.json';
import layout4Schema from './schemas/layout4Schema.json';
import layout5Schema from './schemas/layout5Schema.json';
import layout6Schema from './schemas/layout6Schema.json';
import layout7Schema from './schemas/layout7Schema.json';
import layout8Schema from './schemas/layout8Schema.json';

export const LAYOUT_SCHEMAS = {
  'layout_1': layout1Schema,
  'layout_2': layout2Schema,
  'layout_3': layout3Schema,
  'layout_4': layout4Schema,
  'layout_5': layout5Schema,
  'layout_6': layout6Schema,
  'layout_7': layout7Schema,
  'layout_8': layout8Schema,
};

// Helper function to get layout component
export function getLayoutComponent(layoutId) {
  return LAYOUT_COMPONENTS[layoutId] || Layout1; // Default to Layout1
}

// Helper function to get layout schema
export function getLayoutSchema(layoutId) {
  return LAYOUT_SCHEMAS[layoutId] || layout1Schema;
}

// Helper function to get all available layouts
export function getAllLayouts() {
  return Object.keys(LAYOUT_SCHEMAS).map(id => ({
    id,
    ...LAYOUT_SCHEMAS[id]
  }));
}

// Export individual components
export {
  Layout1,
  Layout2,
  Layout3,
  Layout4,
  Layout5,
  Layout6,
  Layout7,
  Layout8,
};