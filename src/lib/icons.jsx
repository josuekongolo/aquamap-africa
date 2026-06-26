// Central icon mapping (lucide-react) for data-driven icons — replaces emoji.
import {
  Fish, Wheat, Droplets, Recycle, Wind, Microscope, Scale,
  BookOpen, Library, HeartPulse, Tag, Egg, Boxes, Banknote, Package, Leaf, HandCoins,
} from 'lucide-react';

// Each species maps to a custom illustration (public/img/species/*.png). Visually
// similar species reuse a body type (hybrid catfish → catfish, grass carp → carp).
const SPECIES_IMG = {
  Tilapia: 'tilapia',
  Silure: 'catfish',
  'Silure hybride': 'catfish',
  Carpe: 'carp',
  'Carpe herbivore': 'carp',
  Crevette: 'prawn',
  'Crevette blanche': 'shrimp',
  'Dorade royale': 'seabream',
  Bar: 'seabass',
  Mulet: 'mullet',
};
export function SpeciesIcon({ name, className = '', style }) {
  const slug = SPECIES_IMG[name];
  if (slug) {
    // eslint-disable-next-line @next/next/no-img-element -- small static species illustration
    return <img src={`/img/species/${slug}.png`} alt="" aria-hidden className={`object-contain ${className}`} style={style} />;
  }
  return <Fish className={className} style={style} />;
}

const KNOW = {
  all: Library, species: Fish, hatchery: Egg, disease: HeartPulse, feed: Wheat,
  water: Droplets, systems: Boxes, ras: Recycle, business: Banknote,
  postharvest: Package, environment: Leaf, funding: HandCoins, regulation: Scale,
};
export function KnowledgeIcon({ id, ...props }) {
  const I = KNOW[id] || BookOpen;
  return <I {...props} />;
}

const SUP = {
  all: Tag, feed: Wheat, fingerling: Fish, ras: Recycle, aeration: Wind, water: Microscope,
};
export function SupplierIcon({ id, ...props }) {
  const I = SUP[id] || Tag;
  return <I {...props} />;
}
