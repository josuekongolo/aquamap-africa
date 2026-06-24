// Central icon mapping (lucide-react) for data-driven icons — replaces emoji.
import {
  Fish, Shrimp, Wheat, Droplets, Recycle, Wind, Microscope, Scale,
  BookOpen, Library, HeartPulse, Tag,
} from 'lucide-react';

const SPECIES = { Tilapia: Fish, Silure: Fish, Carpe: Fish, Crevette: Shrimp };
export function SpeciesIcon({ name, ...props }) {
  const I = SPECIES[name] || Fish;
  return <I {...props} />;
}

const KNOW = {
  all: Library, species: Fish, disease: HeartPulse, feed: Wheat,
  water: Droplets, ras: Recycle, regulation: Scale,
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
