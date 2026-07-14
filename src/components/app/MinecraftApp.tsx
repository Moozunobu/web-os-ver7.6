import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import { 
  Play, Pause, Volume2, VolumeX, Settings, RotateCcw, 
  HelpCircle, Compass, Shield, Heart, ShoppingBag, 
  ChevronRight, Wrench, RefreshCw, Layers, Check, X
} from 'lucide-react';

// ==========================================
// 1. GAME DATA DEFINITIONS & STATIC RECIPES
// ==========================================

export interface BlockType {
  id: number;
  name: string;
  displayName: string;
  isSolid: boolean;
  isTransparent?: boolean;
  color: string;
}

export const BLOCK_TYPES: Record<number, BlockType> = {
  1: { id: 1, name: 'grass', displayName: 'Grass Block', isSolid: true, color: '#5c9a24' },
  2: { id: 2, name: 'dirt', displayName: 'Dirt', isSolid: true, color: '#8b5a2b' },
  3: { id: 3, name: 'stone', displayName: 'Stone', isSolid: true, color: '#7b7b7b' },
  4: { id: 4, name: 'sand', displayName: 'Sand', isSolid: true, color: '#dee0af' },
  5: { id: 5, name: 'water', displayName: 'Water', isSolid: false, isTransparent: true, color: '#3f76e4' },
  6: { id: 6, name: 'wood_log', displayName: 'Oak Log', isSolid: true, color: '#503824' },
  7: { id: 7, name: 'leaves', displayName: 'Oak Leaves', isSolid: true, isTransparent: true, color: '#46751c' },
  8: { id: 8, name: 'diamond_ore', displayName: 'Diamond Ore', isSolid: true, color: '#4dedf2' },
  9: { id: 9, name: 'obsidian', displayName: 'Obsidian', isSolid: true, color: '#140e22' },
  10: { id: 10, name: 'netherrack', displayName: 'Netherrack', isSolid: true, color: '#501818' },
  11: { id: 11, name: 'glowstone', displayName: 'Glowstone', isSolid: true, color: '#cca352' },
  12: { id: 12, name: 'lava', displayName: 'Lava', isSolid: false, color: '#e64a19' },
  13: { id: 13, name: 'end_stone', displayName: 'End Stone', isSolid: true, color: '#dee0af' },
  14: { id: 14, name: 'portal', displayName: 'Portal Block', isSolid: false, isTransparent: true, color: '#5d21d0' },
  15: { id: 15, name: 'wood_plank', displayName: 'Wood Planks', isSolid: true, color: '#b88d55' },
  16: { id: 16, name: 'stick', displayName: 'Stick', isSolid: false, color: '#8b7355' },
  17: { id: 17, name: 'wood_pickaxe', displayName: 'Wooden Pickaxe', isSolid: false, color: '#b88d55' },
  18: { id: 18, name: 'stone_pickaxe', displayName: 'Stone Pickaxe', isSolid: false, color: '#90a4ae' },
  19: { id: 19, name: 'deepslate', displayName: 'Deepslate', isSolid: true, color: '#323336' },
  20: { id: 20, name: 'deepslate_diamond_ore', displayName: 'Deepslate Diamond Ore', isSolid: true, color: '#17505c' },
  21: { id: 21, name: 'copper_ore', displayName: 'Copper Ore', isSolid: true, color: '#e07a5f' },
  22: { id: 22, name: 'deepslate_copper_ore', displayName: 'Deepslate Copper Ore', isSolid: true, color: '#b05e49' },
  23: { id: 23, name: 'amethyst_block', displayName: 'Amethyst Block', isSolid: true, color: '#905df5' },
  24: { id: 24, name: 'budding_amethyst', displayName: 'Budding Amethyst', isSolid: true, color: '#b38ef7' },
  25: { id: 25, name: 'amethyst_cluster', displayName: 'Amethyst Cluster', isSolid: true, isTransparent: true, color: '#c7b0f7' },
  26: { id: 26, name: 'calcite', displayName: 'Calcite', isSolid: true, color: '#e3e4e6' },
  27: { id: 27, name: 'tuff', displayName: 'Tuff', isSolid: true, color: '#5e605c' },
  28: { id: 28, name: 'smooth_basalt', displayName: 'Smooth Basalt', isSolid: true, color: '#393a3c' },
  29: { id: 29, name: 'moss_block', displayName: 'Moss Block', isSolid: true, color: '#4c6e28' },
  30: { id: 30, name: 'moss_carpet', displayName: 'Moss Carpet', isSolid: true, isTransparent: true, color: '#567d2e' },
  31: { id: 31, name: 'dripstone_block', displayName: 'Dripstone Block', isSolid: true, color: '#8c7769' },
  32: { id: 32, name: 'pointed_dripstone', displayName: 'Pointed Dripstone', isSolid: false, isTransparent: true, color: '#9c8678' },
  33: { id: 33, name: 'glow_lichen', displayName: 'Glow Lichen', isSolid: false, isTransparent: true, color: '#779c88' },
  34: { id: 34, name: 'raw_copper_block', displayName: 'Raw Copper Block', isSolid: true, color: '#d16e41' },
  35: { id: 35, name: 'birch_log', displayName: 'Birch Log', isSolid: true, color: '#dcd8cf' },
  36: { id: 36, name: 'birch_leaves', displayName: 'Birch Leaves', isSolid: true, isTransparent: true, color: '#527c37' },
  37: { id: 37, name: 'birch_planks', displayName: 'Birch Planks', isSolid: true, color: '#dfcca2' },
  38: { id: 38, name: 'coal_ore', displayName: 'Coal Ore', isSolid: true, color: '#2b2b2b' },
  39: { id: 39, name: 'iron_ore', displayName: 'Iron Ore', isSolid: true, color: '#d8b29c' },
  40: { id: 40, name: 'deepslate_iron_ore', displayName: 'Deepslate Iron Ore', isSolid: true, color: '#bc907c' },
  41: { id: 41, name: 'gold_ore', displayName: 'Gold Ore', isSolid: true, color: '#ecc143' },
  42: { id: 42, name: 'deepslate_gold_ore', displayName: 'Deepslate Gold Ore', isSolid: true, color: '#cb9e2a' },
  43: { id: 43, name: 'redstone_ore', displayName: 'Redstone Ore', isSolid: true, color: '#ff2222' },
  44: { id: 44, name: 'deepslate_redstone_ore', displayName: 'Deepslate Redstone Ore', isSolid: true, color: '#cc1111' },
  45: { id: 45, name: 'lapis_ore', displayName: 'Lapis Ore', isSolid: true, color: '#163ea5' },
  46: { id: 46, name: 'deepslate_lapis_ore', displayName: 'Deepslate Lapis Ore', isSolid: true, color: '#0d2d85' },
  47: { id: 47, name: 'emerald_ore', displayName: 'Emerald Ore', isSolid: true, color: '#17dd62' },
  48: { id: 48, name: 'deepslate_emerald_ore', displayName: 'Deepslate Emerald Ore', isSolid: true, color: '#0fb24a' },
  49: { id: 49, name: 'cobblestone', displayName: 'Cobblestone', isSolid: true, color: '#686868' },
  50: { id: 50, name: 'glass', displayName: 'Glass', isSolid: true, isTransparent: true, color: '#ffffff' },
  51: { id: 51, name: 'raw_iron_block', displayName: 'Raw Iron Block', isSolid: true, color: '#bc9c85' },
  52: { id: 52, name: 'raw_gold_block', displayName: 'Raw Gold Block', isSolid: true, color: '#eca534' },
  53: { id: 53, name: 'crafting_table', displayName: 'Crafting Table', isSolid: true, color: '#976a43' },
  54: { id: 54, name: 'chest', displayName: 'Chest', isSolid: true, color: '#8b5a2b' },
  55: { id: 55, name: 'furnace', displayName: 'Furnace', isSolid: true, color: '#616161' },
  56: { id: 56, name: 'clay', displayName: 'Clay', isSolid: true, color: '#a3a7b2' },
  57: { id: 57, name: 'gravel', displayName: 'Gravel', isSolid: true, color: '#787373' },
  58: { id: 58, name: 'snowy_grass', displayName: 'Snowy Grass', isSolid: true, color: '#ffffff' },
  59: { id: 59, name: 'snow_block', displayName: 'Snow Block', isSolid: true, color: '#fbfcfd' },
  60: { id: 60, name: 'powder_snow', displayName: 'Powder Snow', isSolid: false, isTransparent: true, color: '#edf2f5' },
  61: { id: 61, name: 'azalea_leaves', displayName: 'Azalea Leaves', isSolid: true, isTransparent: true, color: '#4c732c' },
  62: { id: 62, name: 'flowering_azalea_leaves', displayName: 'Flowering Azalea Leaves', isSolid: true, isTransparent: true, color: '#a65691' },
  63: { id: 63, name: 'torch', displayName: 'Torch', isSolid: false, isTransparent: true, color: '#ffaa00' }
};

export interface CraftingRecipe {
  input: (number | null)[];
  output: number;
  outputCount: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    input: [
      6, null, null,
      null, null, null,
      null, null, null
    ],
    output: 15,
    outputCount: 4
  },
  {
    input: [
      15, null, null,
      15, null, null,
      null, null, null
    ],
    output: 16,
    outputCount: 4
  },
  {
    input: [
      15, 15, 15,
      null, 16, null,
      null, 16, null
    ],
    output: 17,
    outputCount: 1
  },
  {
    input: [
      3, 3, 3,
      null, 16, null,
      null, 16, null
    ],
    output: 18,
    outputCount: 1
  },
  {
    input: [
      38, null, null,
      16, null, null,
      null, null, null
    ],
    output: 63,
    outputCount: 4
  }
];

export const SMELTING_RECIPES: Record<number, { output: number }> = {
  49: { output: 3 },  // Cobblestone -> Stone
  4: { output: 50 },  // Sand -> Glass
  39: { output: 51 }, // Iron Ore -> Raw Iron Block
  40: { output: 51 }, // Deepslate Iron Ore -> Raw Iron Block
  21: { output: 34 }, // Copper Ore -> Raw Copper Block
  22: { output: 34 }, // Deepslate Copper Ore -> Raw Copper Block
  41: { output: 52 }, // Gold Ore -> Raw Gold Block
  42: { output: 52 }, // Deepslate Gold Ore -> Raw Gold Block
};

export const FUEL_ITEMS = new Set([
  38, // Coal Ore
  6,  // Oak Log
  35, // Birch Log
  15, // Oak Planks
  37, // Birch Planks
  16  // Stick
]);

export type Dimension = 'overworld';
export type GameMode = 'creative' | 'survival';

// Procedural texture generator using HTML Canvas
const drawTextureOnCanvas = (name: string, ctx: CanvasRenderingContext2D) => {
  if (name === 'grass_top') {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 123 + y * 456) % 100;
        let color = '#4fa127';
        if (r < 15) color = '#3c7a1e';
        else if (r < 30) color = '#5cb730';
        else if (r < 45) color = '#489424';
        else if (r < 60) color = '#346b1a';
        else if (r < 75) color = '#54aa2b';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  } else if (name === 'dirt') {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 37 + y * 59) % 100;
        let color = '#573d26';
        if (r < 12) color = '#3e2a1a';
        else if (r < 24) color = '#664c35';
        else if (r < 36) color = '#4a331f';
        else if (r < 48) color = '#5c432d';
        else if (r < 55) color = '#82624a';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  } else if (name === 'grass_side') {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 37 + y * 59) % 100;
        let color = '#573d26';
        if (r < 12) color = '#3e2a1a';
        else if (r < 24) color = '#664c35';
        else if (r < 36) color = '#4a331f';
        else if (r < 48) color = '#5c432d';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#4fa127';
    for (let x = 0; x < 16; x++) {
      const h = 3 + ((x * 17) % 3);
      ctx.fillRect(x, 0, 1, h);
      ctx.fillStyle = '#3c7a1e';
      ctx.fillRect(x, h, 1, 1);
      ctx.fillStyle = '#4fa127';
    }
  } else if (name === 'stone') {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 97 + y * 13) % 100;
        let color = '#616161';
        if (r < 15) color = '#4d4d4d';
        else if (r < 30) color = '#737373';
        else if (r < 40) color = '#555555';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#2d2d2d';
    const cracks = [[2, 3], [3, 3], [4, 4], [4, 5], [5, 6], [9, 10], [10, 10], [11, 11], [12, 11], [13, 12]];
    cracks.forEach(([cx, cy]) => ctx.fillRect(cx, cy, 1, 1));
  } else if (name === 'leaves' || name === 'birch_leaves' || name === 'azalea_leaves') {
    const baseColor = name === 'birch_leaves' ? '#4a822b' : (name === 'azalea_leaves' ? '#3b6e1a' : '#2d5c16');
    const darkColor = name === 'birch_leaves' ? '#32591c' : (name === 'azalea_leaves' ? '#254a10' : '#1e3d0e');
    const lightColor = name === 'birch_leaves' ? '#6da641' : (name === 'azalea_leaves' ? '#5a9632' : '#468f23');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.25) {
          ctx.fillStyle = darkColor;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.75) {
          ctx.fillStyle = lightColor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'flowering_azalea_leaves') {
    ctx.fillStyle = '#3a6c18';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.2) {
          ctx.fillStyle = '#22470d';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.8) {
          ctx.fillStyle = '#59942f';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.fillStyle = '#df669e';
    const flowers = [[3, 3], [4, 4], [11, 2], [10, 3], [5, 11], [12, 10], [13, 11]];
    flowers.forEach(([fx, fy]) => {
      ctx.fillRect(fx, fy, 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx + 1, fy, 1, 1);
      ctx.fillStyle = '#df669e';
    });
  } else if (name === 'wood_log_side' || name === 'birch_log_side') {
    const isBirch = name === 'birch_log_side';
    if (isBirch) {
      ctx.fillStyle = '#e5dec9';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#2c2720';
      const stripes = [[2, 1], [3, 1], [11, 3], [12, 3], [1, 7], [2, 7], [3, 7], [13, 8], [14, 8], [8, 11], [9, 11], [4, 14], [5, 14]];
      stripes.forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 2, 1);
      });
    } else {
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const stripe = (x + Math.floor(Math.sin(y * 1.2) * 1.5)) % 4;
          const r = (x * 53 + y * 83) % 100;
          let color = '#4d331e';
          if (stripe === 0) color = '#2d1d10';
          else if (stripe === 1) color = '#5c3e25';
          else if (r < 20) color = '#3b2515';
          else if (r > 80) color = '#6b492d';
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'wood_log_top' || name === 'birch_log_top') {
    const isBirch = name === 'birch_log_top';
    ctx.fillStyle = isBirch ? '#dbcaa5' : '#c79f6b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = isBirch ? '#af9e7a' : '#8f6e43';
    const rings = [[3, 1], [4, 1], [11, 1], [1, 3], [1, 12], [14, 3], [14, 12], [3, 14], [12, 14], [6, 4], [9, 4], [4, 6], [11, 6], [7, 7], [8, 8]];
    rings.forEach(([rx, ry]) => ctx.fillRect(rx, ry, 1, 1));
    ctx.fillStyle = isBirch ? '#dbdcd7' : '#2d1d10';
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(i, 0, 1, 1);
      ctx.fillRect(i, 15, 1, 1);
      ctx.fillRect(0, i, 1, 1);
      ctx.fillRect(15, i, 1, 1);
    }
  } else if (name === 'wood_plank' || name === 'birch_planks') {
    const isBirch = name === 'birch_planks';
    ctx.fillStyle = isBirch ? '#ebdca5' : '#ad804f';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 31 + y * 73) % 100;
        if (r < 15) {
          ctx.fillStyle = isBirch ? '#cfc08c' : '#946a3d';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 85) {
          ctx.fillStyle = isBirch ? '#f5e8bd' : '#c79761';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.fillStyle = isBirch ? '#998d63' : '#5c4024';
    ctx.fillRect(0, 3, 16, 1); ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 11, 16, 1); ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(4, 0, 1, 3); ctx.fillRect(12, 4, 1, 3); ctx.fillRect(2, 8, 1, 3); ctx.fillRect(10, 12, 1, 3);
  } else if (name === 'deepslate') {
    ctx.fillStyle = '#2f3033';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 47 + y * 61) % 100;
        if (r < 25) {
          ctx.fillStyle = '#1e1f21';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 80) {
          ctx.fillStyle = '#3f4044';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.fillStyle = '#17181a';
    ctx.fillRect(2, 4, 12, 1);
    ctx.fillRect(1, 11, 14, 1);
    ctx.fillRect(4, 15, 8, 1);
  } else if (name === 'diamond_ore' || name === 'deepslate_diamond_ore' || name === 'copper_ore' || name === 'deepslate_copper_ore' || name === 'coal_ore' || name === 'iron_ore' || name === 'deepslate_iron_ore' || name === 'gold_ore' || name === 'deepslate_gold_ore' || name === 'redstone_ore' || name === 'deepslate_redstone_ore' || name === 'lapis_ore' || name === 'deepslate_lapis_ore' || name === 'emerald_ore' || name === 'deepslate_emerald_ore') {
    const isDeepslate = name.startsWith('deepslate');
    if (isDeepslate) {
      ctx.fillStyle = '#2f3033';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = (x * 47 + y * 61) % 100;
          if (r < 20) {
            ctx.fillStyle = '#1e1f21';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#17181a';
      ctx.fillRect(2, 4, 12, 1); ctx.fillRect(1, 11, 14, 1);
    } else {
      ctx.fillStyle = '#616161';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = (x * 97 + y * 13) % 100;
          if (r < 15) {
            ctx.fillStyle = '#4d4d4d';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
    let specColor = '#4dedf2';
    let darkSpecColor = '#1ebdc2';
    if (name.includes('copper')) {
      specColor = '#e07a5f';
      darkSpecColor = '#2a9d8f';
    } else if (name.includes('coal')) {
      specColor = '#1c1c1c';
      darkSpecColor = '#0a0a0a';
    } else if (name.includes('iron')) {
      specColor = '#d8b29c';
      darkSpecColor = '#b8896c';
    } else if (name.includes('gold')) {
      specColor = '#ecc143';
      darkSpecColor = '#bfa12a';
    } else if (name.includes('redstone')) {
      specColor = '#ff3333';
      darkSpecColor = '#991111';
    } else if (name.includes('lapis')) {
      specColor = '#1e48ba';
      darkSpecColor = '#112d80';
    } else if (name.includes('emerald')) {
      specColor = '#17dd62';
      darkSpecColor = '#0f8a3c';
    }
    ctx.fillStyle = specColor;
    ctx.fillRect(3, 4, 2, 2); ctx.fillRect(10, 3, 2, 1); ctx.fillRect(11, 11, 2, 2); ctx.fillRect(4, 12, 2, 1);
    ctx.fillStyle = darkSpecColor;
    ctx.fillRect(4, 5, 1, 1); ctx.fillRect(12, 12, 1, 1); ctx.fillRect(10, 4, 1, 1);
  } else if (name === 'amethyst_block' || name === 'budding_amethyst' || name === 'amethyst_cluster') {
    ctx.fillStyle = '#7a3ebd';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = (x * 43 + y * 71) % 100;
        if (r < 25) {
          ctx.fillStyle = '#562590';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 75) {
          ctx.fillStyle = '#a666e6';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    if (name === 'budding_amethyst') {
      ctx.fillStyle = '#ffdf7a';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#7a3ebd';
      ctx.fillRect(7, 7, 2, 2);
    } else if (name === 'amethyst_cluster') {
      ctx.fillStyle = '#c09dfa';
      ctx.fillRect(4, 6, 8, 4);
      ctx.fillRect(6, 3, 4, 10);
    }
  } else if (name === 'calcite') {
    ctx.fillStyle = '#eef0f2';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.15) {
          ctx.fillStyle = '#d5d7da';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'tuff') {
    ctx.fillStyle = '#5c5e5b';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.2) {
          ctx.fillStyle = '#424541';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.8) {
          ctx.fillStyle = '#787a77';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'smooth_basalt') {
    ctx.fillStyle = '#404144';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.15) {
          ctx.fillStyle = '#2a2b2d';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.fillStyle = '#4e4f52';
    ctx.fillRect(0, 4, 16, 2); ctx.fillRect(0, 10, 16, 2);
  } else if (name === 'moss_block' || name === 'moss_carpet') {
    ctx.fillStyle = '#4c6e28';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.2) {
          ctx.fillStyle = '#3a541e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.8) {
          ctx.fillStyle = '#5f8a32';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'dripstone_block' || name === 'pointed_dripstone') {
    ctx.fillStyle = '#806859';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.18) {
          ctx.fillStyle = '#614f44';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.82) {
          ctx.fillStyle = '#9c8170';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    if (name === 'pointed_dripstone') {
      ctx.fillStyle = '#4f3f35';
      ctx.fillRect(6, 2, 4, 12);
      ctx.fillRect(7, 0, 2, 16);
    }
  } else if (name === 'glow_lichen') {
    ctx.fillStyle = '#616161';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#779c88';
    ctx.fillRect(2, 3, 4, 1); ctx.fillRect(3, 4, 1, 3);
    ctx.fillRect(10, 11, 4, 1); ctx.fillRect(11, 9, 2, 2);
  } else if (name === 'raw_copper_block' || name === 'raw_iron_block' || name === 'raw_gold_block') {
    const isCopper = name.includes('copper');
    const isIron = name.includes('iron');
    const baseColor = isCopper ? '#a65d3f' : (isIron ? '#af927d' : '#cca43a');
    const accentColor = isCopper ? '#4e8a71' : (isIron ? '#8d705c' : '#8e6b18');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = accentColor;
    ctx.fillRect(2, 2, 5, 4); ctx.fillRect(9, 2, 5, 5); ctx.fillRect(3, 9, 4, 5); ctx.fillRect(9, 9, 5, 4);
  } else if (name === 'powder_snow' || name === 'snow_block') {
    ctx.fillStyle = '#fbfcfd';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.15) {
          ctx.fillStyle = '#edf2f5';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'cobblestone') {
    ctx.fillStyle = '#6c6c6c';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#424242';
    for (let i = 0; i < 16; i += 4) {
      ctx.fillRect(0, i, 16, 1);
    }
    ctx.fillRect(4, 0, 1, 4); ctx.fillRect(12, 4, 1, 4); ctx.fillRect(2, 8, 1, 4); ctx.fillRect(10, 12, 1, 4);
    ctx.fillStyle = '#8f8f8f';
    const highlightPebbles = [[1, 1], [6, 2], [9, 1], [13, 5], [5, 9], [1, 13], [11, 14]];
    highlightPebbles.forEach(([px, py]) => ctx.fillRect(px, py, 2, 1));
  } else if (name === 'glass') {
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.strokeRect(0, 0, 16, 16);
    ctx.fillRect(3, 3, 2, 1); ctx.fillRect(4, 4, 1, 1);
    ctx.fillRect(10, 10, 3, 1); ctx.fillRect(11, 11, 2, 1);
  } else if (name === 'crafting_table_top') {
    ctx.fillStyle = '#b88d55';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#5c4024';
    ctx.strokeRect(1, 1, 14, 14);
    ctx.fillRect(5, 1, 1, 14); ctx.fillRect(10, 1, 1, 14);
    ctx.fillRect(1, 5, 14, 1); ctx.fillRect(1, 10, 14, 1);
  } else if (name === 'crafting_table_side') {
    ctx.fillStyle = '#ad804f';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#5c4024';
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(3, 4, 4, 2);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(4, 6, 1, 5);
  } else if (name === 'chest_top' || name === 'chest_side') {
    ctx.fillStyle = '#6b431e';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2d1d10';
    ctx.strokeRect(1, 1, 14, 14);
  } else if (name === 'chest_front') {
    ctx.fillStyle = '#6b431e';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2d1d10';
    ctx.strokeRect(1, 1, 14, 14);
    ctx.fillStyle = '#cca33c';
    ctx.fillRect(7, 6, 2, 3);
    ctx.fillStyle = '#111';
    ctx.fillRect(7, 7, 1, 1);
  } else if (name === 'furnace_front') {
    ctx.fillStyle = '#616161';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2d2d2d';
    ctx.strokeRect(1, 1, 14, 14);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(3, 8, 10, 5);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(5, 10, 6, 3);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 11, 2, 2);
  } else if (name === 'furnace_side') {
    ctx.fillStyle = '#616161';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#404040';
    ctx.strokeRect(1, 1, 14, 14);
  } else if (name === 'clay') {
    ctx.fillStyle = '#a3a7b2';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (Math.random() < 0.12) {
          ctx.fillStyle = '#8b8f9a';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'gravel') {
    ctx.fillStyle = '#787373';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = Math.random();
        if (r < 0.25) {
          ctx.fillStyle = '#595555';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.75) {
          ctx.fillStyle = '#9a9494';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'snowy_grass_top') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (Math.random() < 0.12) {
          ctx.fillStyle = '#e5ecf0';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (name === 'snowy_grass_side') {
    ctx.fillStyle = '#573d26';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 16, 4);
    const fringes = [0, 4, 1, 5, 2, 4, 3, 6, 7, 5, 8, 4, 11, 5, 12, 6, 14, 5];
    for (let i = 0; i < fringes.length; i += 2) {
      ctx.fillRect(fringes[i], 0, 1, fringes[i+1]);
    }
  } else if (name === 'torch') {
    ctx.clearRect(0, 0, 16, 16);
    // Wood stick handle
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(7, 6, 2, 10);
    ctx.fillStyle = '#5c4024';
    ctx.fillRect(7, 10, 2, 2);
    // Glowing flame on top
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 1, 2, 4);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(7, 2, 2, 2);
  } else if (name === 'water' || name === 'fallback' || name === 'portal' || name === 'lava' || name === 'netherrack' || name === 'end_stone' || name === 'glowstone') {
    const defaultColor = name === 'water' ? '#3f76e4' : (name === 'lava' ? '#e64a19' : (name === 'netherrack' ? '#501818' : (name === 'end_stone' ? '#dee0af' : (name === 'glowstone' ? '#cca352' : '#aaaaaa'))));
    ctx.fillStyle = defaultColor;
    ctx.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (Math.random() < 0.15) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x, y, 1, 1);
        } else if (Math.random() > 0.85) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else {
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = '#555555';
    ctx.strokeRect(0, 0, 16, 16);
  }
};

const generateVoxelAndBumpTexture = (type: string): { diffuse: THREE.Texture, bump: THREE.Texture } => {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  drawTextureOnCanvas(type, ctx);

  // 1. Create Diffuse Texture
  const diffuse = new THREE.CanvasTexture(canvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.magFilter = THREE.NearestFilter;
  diffuse.minFilter = THREE.NearestFilter;

  // 2. Create Bump Texture
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 16;
  bumpCanvas.height = 16;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  
  const imgData = ctx.getImageData(0, 0, 16, 16);
  const bumpData = bumpCtx.createImageData(16, 16);
  
  for (let i = 0; i < imgData.data.length; i += 4) {
    const r = imgData.data[i];
    const g = imgData.data[i+1];
    const b = imgData.data[i+2];
    
    // Grayscale brightness
    const val = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Enhance contrast for a stronger, more premium bump effect
    const bumpVal = Math.min(255, Math.max(0, (val - 128) * 2.2 + 128));
    
    bumpData.data[i] = bumpVal;
    bumpData.data[i+1] = bumpVal;
    bumpData.data[i+2] = bumpVal;
    bumpData.data[i+3] = 255;
  }
  bumpCtx.putImageData(bumpData, 0, 0);
  
  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.magFilter = THREE.NearestFilter;
  bump.minFilter = THREE.NearestFilter;

  return { diffuse, bump };
};

const texturesCache: Record<string, THREE.Texture> = {};
const bumpCache: Record<string, THREE.Texture> = {};

const getCachedTexture = (name: string): THREE.Texture => {
  if (!texturesCache[name]) {
    const { diffuse, bump } = generateVoxelAndBumpTexture(name);
    texturesCache[name] = diffuse;
    bumpCache[name] = bump;
  }
  return texturesCache[name];
};

const getCachedBumpTexture = (name: string): THREE.Texture | undefined => {
  if (!bumpCache[name]) {
    getCachedTexture(name); // Triggers loading both diffuse and bump
  }
  return bumpCache[name];
};

// Generates geometry with a built-in vertical gradient to simulate Ambient Occlusion soft shading
const createAOBlockGeometry = (): THREE.BufferGeometry => {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const position = geo.attributes.position;
  const colors = [];

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const x = position.getX(i);
    const z = position.getZ(i);

    // Default bright
    const r = 1.0, g = 1.0, b = 1.0;

    // Soft shading vertical gradient (bottom is darker)
    const heightFactor = (y + 0.5); // 0.0 to 1.0
    const shade = 0.58 + heightFactor * 0.42; // range 0.58 to 1.0

    // Slightly darken sides and front/back faces to accentuate 3D voxel structure
    let faceShade = 1.0;
    const normalY = Math.abs(geo.attributes.normal ? geo.attributes.normal.getY(i) : 0);
    if (normalY < 0.1) {
      // It's a vertical side face, shade it down to 0.85
      faceShade = 0.85;
    }

    colors.push(r * shade * faceShade, g * shade * faceShade, b * shade * faceShade);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
};

// Returns a uniform array of 6 materials for each of the 6 block faces
const getBlockMaterialArray = (id: number, isTransparent: boolean, useVertexColors = true): THREE.Material[] => {
  const materials: THREE.Material[] = [];

  const getFaceTextureName = (faceIndex: number): string => {
    let textureName = '';
    if (id === 1) {
      if (faceIndex === 2) textureName = 'grass_top';
      else if (faceIndex === 3) textureName = 'dirt';
      else textureName = 'grass_side';
    } else if (id === 58) {
      if (faceIndex === 2) textureName = 'snowy_grass_top';
      else if (faceIndex === 3) textureName = 'dirt';
      else textureName = 'snowy_grass_side';
    } else if (id === 6) {
      if (faceIndex === 2 || faceIndex === 3) textureName = 'wood_log_top';
      else textureName = 'wood_log_side';
    } else if (id === 35) {
      if (faceIndex === 2 || faceIndex === 3) textureName = 'birch_log_top';
      else textureName = 'birch_log_side';
    } else if (id === 53) {
      if (faceIndex === 2) textureName = 'crafting_table_top';
      else textureName = 'crafting_table_side';
    } else if (id === 54) {
      if (faceIndex === 2) textureName = 'chest_top';
      else if (faceIndex === 4) textureName = 'chest_front';
      else textureName = 'chest_side';
    } else if (id === 55) {
      if (faceIndex === 2) textureName = 'stone';
      else if (faceIndex === 4) textureName = 'furnace_front';
      else textureName = 'furnace_side';
    } else {
      textureName = getTextureNameForFace(id, faceIndex === 2 ? 'top' : 'left');
    }

    return textureName || 'fallback';
  };

  for (let i = 0; i < 6; i++) {
    const texName = getFaceTextureName(i);
    const tex = getCachedTexture(texName);
    const bump = getCachedBumpTexture(texName);
    const hasTexture = tex !== texturesCache['fallback'];

    // Custom fine-tuned bump scaling for physical realistic material grain
    let bumpScale = 0.012;
    if (id === 49 || texName === 'cobblestone') {
      bumpScale = 0.07; // Cobblestone gets heavy 3D ridges
    } else if (id === 6 || id === 15 || texName === 'wood_plank' || texName === 'wood_log_side') {
      bumpScale = 0.035; // Timber grains get nice wood veins
    } else if (id === 1 || id === 58 || texName === 'grass_side' || texName === 'dirt') {
      bumpScale = 0.025; // Soil/grass get natural textures
    } else if (texName === 'stone' || id === 3) {
      bumpScale = 0.025; // Rock surface gets nice fine-grained bumps
    }

    materials.push(
      new THREE.MeshStandardMaterial({
        map: hasTexture ? tex : undefined,
        color: hasTexture ? new THREE.Color('#ffffff') : new THREE.Color(BLOCK_TYPES[id]?.color || '#888888'),
        vertexColors: useVertexColors,
        bumpMap: hasTexture && bump ? bump : undefined,
        bumpScale: hasTexture && bump ? bumpScale : 0.0,
        roughness: id === 5 ? 0.15 : (id === 8 || id === 9 ? 0.4 : 0.92),
        metalness: id === 8 ? 0.45 : (id === 9 ? 0.15 : 0.0),
        transparent: isTransparent || id === 7 || id === 5 || id === 63,
        alphaTest: (id === 7 || id === 63) ? 0.35 : 0.0,
        opacity: id === 5 ? 0.6 : 1.0,
        emissive: id === 63 ? new THREE.Color('#ffaa44') : new THREE.Color(0, 0, 0),
        emissiveIntensity: id === 63 ? 1.5 : 0.0,
      })
    );
  }

  return materials;
};

// Retro Synth Audio FX Engine
const playSynthSound = (type: 'break' | 'place' | 'jump' | 'damage' | 'click' | 'portal') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'break') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'place') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'damage') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'portal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.6);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    // blocked or not supported
  }
};

// Hash and noise utilities for procedurally generated smooth 2D FBM noise
const noiseHash2D = (x: number, z: number, seed: number): number => {
  // Classic pseudo-random 2D hash with balanced distribution
  const h = Math.sin(x * 12.9898 + z * 78.233 + seed * 21.431) * 43758.5453123;
  return h - Math.floor(h);
};

const interpolatedNoise2D = (x: number, z: number, seed: number): number => {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  // Smoothstep S-curve interpolation
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const a = noiseHash2D(ix, iz, seed);
  const b = noiseHash2D(ix + 1, iz, seed);
  const c = noiseHash2D(ix, iz + 1, seed);
  const d = noiseHash2D(ix + 1, iz + 1, seed);

  return a * (1 - ux) * (1 - uz) +
         b * ux * (1 - uz) +
         c * (1 - ux) * uz +
         d * ux * uz;
};

const fbm2D = (x: number, z: number, seed: number, octaves: number = 4): number => {
  let value = 0.0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxValue = 0.0;

  for (let i = 0; i < octaves; i++) {
    value += interpolatedNoise2D(x * frequency, z * frequency, seed) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value / maxValue;
};

// Procedural 3D noise for underground caverns and winding cave tunnels
const noiseHash3D = (x: number, y: number, z: number, seed: number): number => {
  const h = Math.sin(x * 12.9898 + y * 57.263 + z * 78.233 + seed * 21.431) * 43758.5453123;
  return h - Math.floor(h);
};

const interpolatedNoise3D = (x: number, y: number, z: number, seed: number): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const c000 = noiseHash3D(ix, iy, iz, seed);
  const c100 = noiseHash3D(ix + 1, iy, iz, seed);
  const c010 = noiseHash3D(ix, iy + 1, iz, seed);
  const c110 = noiseHash3D(ix + 1, iy + 1, iz, seed);
  const c001 = noiseHash3D(ix, iy, iz + 1, seed);
  const c101 = noiseHash3D(ix + 1, iy, iz + 1, seed);
  const c011 = noiseHash3D(ix, iy + 1, iz + 1, seed);
  const c111 = noiseHash3D(ix + 1, iy + 1, iz + 1, seed);

  const c00 = THREE.MathUtils.lerp(c000, c100, ux);
  const c10 = THREE.MathUtils.lerp(c010, c110, ux);
  const c01 = THREE.MathUtils.lerp(c001, c101, ux);
  const c11 = THREE.MathUtils.lerp(c011, c111, ux);

  const c0 = THREE.MathUtils.lerp(c00, c10, uy);
  const c1 = THREE.MathUtils.lerp(c01, c11, uy);

  return THREE.MathUtils.lerp(c0, c1, uz);
};

const getCaveNoise = (x: number, y: number, z: number, seed: number): boolean => {
  // Sinuous, winding worm caves using 3D noise intersection
  const n1 = interpolatedNoise3D(x * 0.08, y * 0.15, z * 0.08, seed + 200);
  const n2 = interpolatedNoise3D(x * 0.08, y * 0.15, z * 0.08, seed + 600);
  
  // A tighter threshold yields wider or narrower realistic tunnels
  const threshold = 0.065;
  const isTunnel = Math.abs(n1 - 0.5) < threshold && Math.abs(n2 - 0.5) < threshold;
  
  return isTunnel;
};

// Advanced Voxel Shader-styled Procedural Terrain Generator (Dynamic Biomes, Valleys, & Mountains)
const getMultiOctaveNoise = (x: number, z: number, seed: number = 1337): number => {
  // Use a slow-shifting large octave for biomes selection (e.g. scale of 80 blocks)
  const biomeSelector = interpolatedNoise2D(x * 0.012, z * 0.012, seed + 145);

  // Multi-frequency Fractal Brownian Motion base
  const terrainFbm = fbm2D(x * 0.022, z * 0.022, seed, 4);

  let height = 24;

  if (biomeSelector < 0.15) {
    // 1. Deep Oceans & Basins (low height, allowing water surface at y <= 11)
    const t = biomeSelector / 0.15;
    const deepOcean = 6 + terrainFbm * 4;
    const shoreSand = 12 + terrainFbm * 3;
    height = THREE.MathUtils.lerp(deepOcean, shoreSand, t);
  } else if (biomeSelector < 0.50) {
    // 2. Rolling Plains (moderate height, rich grasslands and forests)
    const t = (biomeSelector - 0.15) / 0.35;
    const lowPlains = 14 + terrainFbm * 6;
    const highPlains = 22 + terrainFbm * 8;
    height = THREE.MathUtils.lerp(lowPlains, highPlains, t);
  } else if (biomeSelector < 0.78) {
    // 3. Highlands / Rolling Hills (height 22 to 32)
    const t = (biomeSelector - 0.50) / 0.28;
    const lowHills = 22 + terrainFbm * 8;
    const highHills = 32 + Math.pow(terrainFbm, 1.3) * 12;
    height = THREE.MathUtils.lerp(lowHills, highHills, t);
  } else {
    // 4. Majestic Jagged Peaks / Mountains (Exponential ridges for realistic Alpine cliffs up to Y=54)
    const t = Math.min(1.0, (biomeSelector - 0.78) / 0.22);
    const highHills = 32 + Math.pow(terrainFbm, 1.3) * 12;

    // Distinct ridge noise: sharp crests
    const ridgeVal = 1.0 - Math.abs(terrainFbm - 0.5) * 2.0;
    const sharpPeaks = 32 + Math.pow(ridgeVal, 2.3) * 22 + terrainFbm * 4;

    height = THREE.MathUtils.lerp(highHills, sharpPeaks, t);
  }

  // Micro-roughness detail (simulates natural grass hummocks, soil erosion, gravel banks)
  const microRoughness = interpolatedNoise2D(x * 0.22, z * 0.22, seed + 987) * 1.2;

  return height + microRoughness;
};

const getHeight = (x: number, z: number, seed: number = 1337): number => {
  return Math.floor(getMultiOctaveNoise(x, z, seed));
};

// 3D Isometric SVG Block Icon Component for Minecraft HUD feel
const IsometricBlockIcon: React.FC<{ id: number; size?: number }> = ({ id, size = 20 }) => {
  let topColor = '#888888';
  let leftColor = '#666666';
  let rightColor = '#444444';
  let showGrassFringe = false;
  let showLogRings = false;
  let showCyanOre = false;

  if (id === 1) { // Grass
    topColor = '#5c9a24';
    leftColor = '#5c402d';
    rightColor = '#4a3324';
    showGrassFringe = true;
  } else if (id === 2) { // Dirt
    topColor = '#6e4a2c';
    leftColor = '#5c402d';
    rightColor = '#4a3324';
  } else if (id === 3) { // Stone
    topColor = '#9c9c9c';
    leftColor = '#808080';
    rightColor = '#666666';
  } else if (id === 4) { // Sand
    topColor = '#f3e9b9';
    leftColor = '#dbd1a2';
    rightColor = '#c0b68a';
  } else if (id === 5) { // Water
    topColor = '#3f76e4';
    leftColor = '#2d5cb8';
    rightColor = '#1e3d7a';
  } else if (id === 6) { // Wood Log
    topColor = '#cca983';
    leftColor = '#503824';
    rightColor = '#3d2b1c';
    showLogRings = true;
  } else if (id === 7) { // Leaves
    topColor = '#3d7a1e';
    leftColor = '#2c5915';
    rightColor = '#1b3b0c';
  } else if (id === 8) { // Diamond Ore
    topColor = '#9c9c9c';
    leftColor = '#808080';
    rightColor = '#666666';
    showCyanOre = true;
  } else if (id === 9) { // Obsidian
    topColor = '#1e142e';
    leftColor = '#140d1f';
    rightColor = '#0a0610';
  } else if (id === 15) { // Wood Planks
    topColor = '#dfb887';
    leftColor = '#c69c6d';
    rightColor = '#a87e53';
  } else if (id === 16) { // Stick
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="3" strokeLinecap="round">
        <line x1="5" y1="19" x2="19" y2="5" />
      </svg>
    );
  } else if (id === 17 || id === 18) { // Wood or Stone Pickaxe
    const strokeCol = id === 17 ? '#dfb887' : '#90a4ae';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeCol} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 9.5l-9 9" stroke="#8b7355" />
        <path d="M15 4l5 5M12 4c2 3 5 5 8 5" />
      </svg>
    );
  } else if (id === 63) { // Torch
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
        {/* Flame */}
        <path d="M12 4c1 1.5 1.5 2.5 1.5 4s-.5 2.5-1.5 3.5c-1-1-1.5-2-1.5-3.5s.5-2.5 1.5-4z" fill="#ff6600" stroke="#ffcc00" />
        {/* Wood stick */}
        <line x1="12" y1="11" x2="12" y2="20" stroke="#8b5a2b" strokeWidth="3.5" />
        <line x1="12" y1="13" x2="12" y2="15" stroke="#5c4024" strokeWidth="3.5" />
      </svg>
    );
  } else {
    topColor = BLOCK_TYPES[id]?.color || '#888888';
    leftColor = topColor;
    rightColor = topColor;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <polygon points="16,30 50,50 50,90 16,70" fill={leftColor} />
      <polygon points="50,50 84,30 84,70 50,90" fill={rightColor} />
      <polygon points="50,10 84,30 50,50 16,30" fill={topColor} />
      {showGrassFringe && (
        <>
          <polygon points="16,30 50,50 50,58 42,52 38,55 28,48 22,51 16,42" fill={topColor} />
          <polygon points="50,50 84,30 84,42 76,49 70,45 62,53 58,49 50,58" fill={topColor} />
        </>
      )}
      {showLogRings && (
        <>
          <ellipse cx="50" cy="30" rx="18" ry="10.5" fill="none" stroke="#997d5f" strokeWidth="2.5" />
          <ellipse cx="50" cy="30" rx="9" ry="5.2" fill="none" stroke="#997d5f" strokeWidth="2.5" />
        </>
      )}
      {showCyanOre && (
        <>
          <polygon points="32,28 38,30 35,33 29,31" fill="#4dedf2" />
          <polygon points="58,22 66,24 62,28 54,26" fill="#4dedf2" />
          <polygon points="24,42 34,48 30,52 20,46" fill="#4dedf2" />
          <polygon points="38,62 46,67 43,71 35,66" fill="#4dedf2" />
          <polygon points="58,62 66,58 63,64 55,68" fill="#4dedf2" />
          <polygon points="68,44 76,40 73,46 65,50" fill="#4dedf2" />
        </>
      )}
    </svg>
  );
};

// Helper to construct a beautiful simplified Steve-like player character model
const createSteveModel = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Materials
  const skinMat = new THREE.MeshLambertMaterial({ color: '#ffdbac' }); // Tan/skin
  const shirtMat = new THREE.MeshLambertMaterial({ color: '#0084ff' }); // Cyan/Blue shirt
  const pantsMat = new THREE.MeshLambertMaterial({ color: '#2b2b2b' }); // Dark gray/brown pants
  const hairMat = new THREE.MeshLambertMaterial({ color: '#4a2f13' }); // Brown hair

  // Head
  const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 0.8;
  group.add(headMesh);

  // Hair/Cap (simplified)
  const hairGeo = new THREE.BoxGeometry(0.37, 0.12, 0.37);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, 0.93, 0);
  group.add(hairMesh);

  // Body/Torso
  const bodyGeo = new THREE.BoxGeometry(0.45, 0.6, 0.25);
  const bodyMesh = new THREE.Mesh(bodyGeo, shirtMat);
  bodyMesh.position.y = 0.35;
  group.add(bodyMesh);

  // Left Arm
  const leftArmGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
  const leftArm = new THREE.Mesh(leftArmGeo, skinMat);
  leftArm.position.set(-0.3, 0.35, 0);
  group.add(leftArm);

  // Right Arm
  const rightArmGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
  const rightArm = new THREE.Mesh(rightArmGeo, skinMat);
  rightArm.position.set(0.3, 0.35, 0);
  group.add(rightArm);

  // Left Leg
  const leftLegGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
  const leftLeg = new THREE.Mesh(leftLegGeo, pantsMat);
  leftLeg.position.set(-0.12, -0.2, 0);
  group.add(leftLeg);

  // Right Leg
  const rightLegGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
  const rightLeg = new THREE.Mesh(rightLegGeo, pantsMat);
  rightLeg.position.set(0.12, -0.2, 0);
  group.add(rightLeg);

  return group;
};

const getTextureNameForFace = (id: number, face: 'top' | 'left' | 'right'): string => {
  if (id === 1) return face === 'top' ? 'grass_top' : 'grass_side';
  if (id === 2) return 'dirt';
  if (id === 3) return 'stone';
  if (id === 4) return 'sand';
  if (id === 5) return 'water';
  if (id === 6) return face === 'top' ? 'wood_log_top' : 'wood_log_side';
  if (id === 7) return 'leaves';
  if (id === 8) return 'diamond_ore';
  if (id === 9) return 'obsidian';
  if (id === 10) return 'netherrack';
  if (id === 11) return 'glowstone';
  if (id === 12) return 'lava';
  if (id === 13) return 'end_stone';
  if (id === 14) return 'portal';
  if (id === 15) return 'wood_plank';
  if (id === 19) return 'deepslate';
  if (id === 20) return 'deepslate_diamond_ore';
  if (id === 21) return 'copper_ore';
  if (id === 22) return 'deepslate_copper_ore';
  if (id === 23) return 'amethyst_block';
  if (id === 24) return 'budding_amethyst';
  if (id === 25) return 'amethyst_cluster';
  if (id === 26) return 'calcite';
  if (id === 27) return 'tuff';
  if (id === 28) return 'smooth_basalt';
  if (id === 29) return 'moss_block';
  if (id === 30) return 'moss_carpet';
  if (id === 31) return 'dripstone_block';
  if (id === 32) return 'pointed_dripstone';
  if (id === 33) return 'glow_lichen';
  if (id === 34) return 'raw_copper_block';
  if (id === 35) return face === 'top' ? 'birch_log_top' : 'birch_log_side';
  if (id === 36) return 'birch_leaves';
  if (id === 37) return 'birch_planks';
  if (id === 38) return 'coal_ore';
  if (id === 39) return 'iron_ore';
  if (id === 40) return 'deepslate_iron_ore';
  if (id === 41) return 'gold_ore';
  if (id === 42) return 'deepslate_gold_ore';
  if (id === 43) return 'redstone_ore';
  if (id === 44) return 'deepslate_redstone_ore';
  if (id === 45) return 'lapis_ore';
  if (id === 46) return 'deepslate_lapis_ore';
  if (id === 47) return 'emerald_ore';
  if (id === 48) return 'deepslate_emerald_ore';
  if (id === 49) return 'cobblestone';
  if (id === 50) return 'glass';
  if (id === 51) return 'raw_iron_block';
  if (id === 52) return 'raw_gold_block';
  if (id === 53) return face === 'top' ? 'crafting_table_top' : 'crafting_table_side';
  if (id === 54) return face === 'top' ? 'chest_top' : (face === 'left' ? 'chest_front' : 'chest_side');
  if (id === 55) return face === 'top' ? 'stone' : (face === 'left' ? 'furnace_front' : 'furnace_side');
  if (id === 56) return 'clay';
  if (id === 57) return 'gravel';
  if (id === 58) return face === 'top' ? 'snowy_grass_top' : (face === 'left' ? 'snowy_grass_side' : 'dirt');
  if (id === 59) return 'snow_block';
  if (id === 60) return 'powder_snow';
  if (id === 61) return 'azalea_leaves';
  if (id === 62) return 'flowering_azalea_leaves';
  if (id === 63) return 'torch';
  return '';
};

const cachedTextureUrls: Record<string, string> = {};

const getTextureUrl = (name: string): string => {
  if (cachedTextureUrls[name]) return cachedTextureUrls[name];
  
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  
  drawTextureOnCanvas(name, ctx);
  
  const url = canvas.toDataURL();
  cachedTextureUrls[name] = url;
  return url;
};

interface VoxelCubeProps {
  id: number;
  size?: number;
}

const VoxelCube: React.FC<VoxelCubeProps> = ({ id, size = 20 }) => {
  const b = BLOCK_TYPES[id];
  if (!b) return null;

  if (!b.isSolid) {
    if (id === 16) {
      return (
        <div className="w-6 h-6 relative rotate-45 flex items-center justify-center">
          <div className="w-1.5 h-6 bg-[#8b7355] border border-[#5c4024] rounded-sm shadow-sm" />
        </div>
      );
    }
    if (id === 17 || id === 18) {
      const headColor = id === 17 ? '#b88d55' : '#78909c';
      const headBorder = id === 17 ? '#8b5a2b' : '#37474f';
      return (
        <div className="w-7 h-7 relative flex items-center justify-center -rotate-45">
          <div className="absolute w-1 h-6 bg-[#8b7355] border-x border-[#5c4024]" style={{ bottom: '2px' }} />
          <div className="absolute top-1.5 w-5 h-1.5 rounded-sm flex justify-between" style={{ backgroundColor: headColor, border: `1px solid ${headBorder}` }}>
            <div className="w-1 h-full bg-white/20" />
            <div className="w-1 h-full bg-black/20" />
          </div>
          <div className="absolute top-1 w-1.5 h-1.5 bg-[#5c4024]" />
        </div>
      );
    }
    if (id === 63) { // Torch
      return (
        <div className="w-7 h-7 relative flex items-center justify-center rotate-12">
          {/* Wooden Stick */}
          <div className="absolute w-1.5 h-4.5 bg-[#8b5a2b] border border-[#5c4024] rounded-sm bottom-0.5 shadow-sm" />
          {/* Animated pulsing glowing flame */}
          <div className="absolute top-1 w-3 h-3 bg-[#ff6600] rounded-full border border-[#ffcc00] flex items-center justify-center animate-pulse shadow-md shadow-orange-500/50">
            <div className="w-1 h-1 bg-[#ffff00] rounded-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-md shadow-inner" style={{ backgroundColor: b.color }} />
    );
  }

  const topTextureName = getTextureNameForFace(id, 'top');
  const sideTextureName = getTextureNameForFace(id, 'left');

  let topStyle: React.CSSProperties = { backgroundColor: b.color };
  let leftStyle: React.CSSProperties = { backgroundColor: b.color };
  let rightStyle: React.CSSProperties = { backgroundColor: b.color };

  if (topTextureName) {
    const url = getTextureUrl(topTextureName);
    topStyle = { backgroundImage: `url(${url})`, backgroundSize: 'cover', imageRendering: 'pixelated' };
  }
  if (sideTextureName) {
    const url = getTextureUrl(sideTextureName);
    leftStyle = { backgroundImage: `url(${url})`, backgroundSize: 'cover', imageRendering: 'pixelated' };
    rightStyle = { backgroundImage: `url(${url})`, backgroundSize: 'cover', imageRendering: 'pixelated' };
  }

  const halfSize = size / 2;

  return (
    <div className="w-8 h-8 flex items-center justify-center select-none" style={{ perspective: '800px' }}>
      <div 
        className="relative transition-transform duration-500 hover:scale-110"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-30deg) rotateY(45deg) translateZ(0px)',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            transformStyle: 'preserve-3d',
            ...topStyle
          }}
        />
        <div 
          style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            transform: `rotateY(0deg) translateZ(${halfSize}px)`,
            transformStyle: 'preserve-3d',
            filter: 'brightness(0.8)',
            ...leftStyle
          }}
        />
        <div 
          style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
            transformStyle: 'preserve-3d',
            filter: 'brightness(0.6)',
            ...rightStyle
          }}
        />
      </div>
    </div>
  );
};

export const MinecraftApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Game State Engine
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [device, setDevice] = useState<'pc' | 'ipad'>('pc');
  const [gameMode] = useState<GameMode>('survival');

  // Prevent iPad Multi-Touch Safari browser pinch-to-zoom and gesture zooming
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (e.type === 'touchmove') {
        e.preventDefault(); // Prevents default page bounce/scrolling and gesture navigation
      } else if (e.touches.length > 1) {
        e.preventDefault(); // Prevents multi-touch browser pinch
      }
    };
    const handleGesture = (e: Event) => {
      e.preventDefault(); // Prevents iOS gesture zooming
    };
    
    const el = containerRef.current;
    if (el) {
      el.addEventListener('touchstart', handleTouch, { passive: false });
      el.addEventListener('touchmove', handleTouch, { passive: false });
      el.addEventListener('gesturestart', handleGesture, { passive: false });
      el.addEventListener('gesturechange', handleGesture, { passive: false });
    }
    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleTouch);
        el.removeEventListener('touchmove', handleTouch);
        el.removeEventListener('gesturestart', handleGesture);
        el.removeEventListener('gesturechange', handleGesture);
      }
    };
  }, []);
  const [renderDistance, setRenderDistance] = useState<number>(2);
  const [seed, setSeed] = useState<number>(1337);
  const [dimension] = useState<Dimension>('overworld');
  const [loadedChunkCount, setLoadedChunkCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [health, setHealth] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('noon-world');

  // References for multiplayer sync (avoids stale closures in the tick loop)
  const remotePlayersRef = useRef<Record<string, {
    id: string,
    username: string,
    mesh: THREE.Group,
    targetPos: THREE.Vector3,
    targetYaw: number,
    lastUpdate: number
  }>>({});
  const broadcastBlockEditRef = useRef<(x: number, y: number, z: number, blockType: number) => void>(() => {});

  const [ipadAction, setIpadAction] = useState<'break' | 'place'>('break');

  // UI Overlays
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Active slot and custom world edits map
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [worldEdits, setWorldEdits] = useState<Record<string, number>>({});
  const [inventory, setInventory] = useState<({ id: number, count: number } | null)[]>(() => [
    { id: 17, count: 1 }, // Wooden Pickaxe
    { id: 15, count: 10 }, // 10 Wood Planks
    { id: 16, count: 5 }, // 5 Sticks
    ...Array(33).fill(null)
  ]);

  // Crafting Grid state
  const [craftingGrid, setCraftingGrid] = useState<(number | null)[]>(Array(9).fill(null));
  const [craftResult, setCraftResult] = useState<{ id: number, count: number } | null>(null);

  // Chest & Furnace states
  const [chestInventories, setChestInventories] = useState<Record<string, ({ id: number, count: number } | null)[]>>({});
  const [furnaceStates, setFurnaceStates] = useState<Record<string, {
    input: { id: number, count: number } | null;
    fuel: { id: number, count: number } | null;
    output: { id: number, count: number } | null;
    progress: number;
  }>>({});
  const [activeChestKey, setActiveChestKey] = useState<string | null>(null);
  const [activeFurnaceKey, setActiveFurnaceKey] = useState<string | null>(null);

  // Background smelting ticks every second
  useEffect(() => {
    const interval = setInterval(() => {
      setFurnaceStates(prev => {
        let changed = false;
        const next = { ...prev };
        
        for (const key in next) {
          const f = { ...next[key] };
          if (!f) continue;
          
          if (f.input && f.input.count > 0) {
            const recipe = SMELTING_RECIPES[f.input.id];
            if (recipe) {
              const canOutput = !f.output || (f.output.id === recipe.output && f.output.count < 64);
              
              if (canOutput) {
                // If smelting is not active, but we have fuel, consume fuel to start smelting
                if (f.progress <= 0 && f.fuel && f.fuel.count > 0) {
                  f.fuel = { ...f.fuel };
                  f.fuel.count--;
                  if (f.fuel.count <= 0) f.fuel = null;
                  f.progress = 1;
                  changed = true;
                }
                
                // Smelting progress ticking
                if (f.progress > 0) {
                  f.progress += 25; // 4 seconds to smelt a single item (25% progress per second)
                  if (f.progress >= 100) {
                    f.progress = 0;
                    
                    // Consume 1 input
                    f.input = { ...f.input };
                    f.input.count--;
                    if (f.input.count <= 0) f.input = null;
                    
                    // Add 1 output
                    if (f.output) {
                      f.output = { ...f.output, count: f.output.count + 1 };
                    } else {
                      f.output = { id: recipe.output, count: 1 };
                    }
                  }
                  changed = true;
                }
              } else {
                if (f.progress > 0) {
                  f.progress = 0;
                  changed = true;
                }
              }
            }
          } else {
            if (f.progress > 0) {
              f.progress = 0;
              changed = true;
            }
          }
          next[key] = f;
        }
        
        return changed ? next : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Sound and HUD preferences
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<number>(1.0);

  // References for render loop (avoids stale state closures)
  const stateRef = useRef({
    device,
    gameMode,
    renderDistance,
    dimension,
    activeSlot,
    inventory,
    isSoundOn,
    health,
    sensitivity,
    seed
  });

  useEffect(() => {
    stateRef.current = {
      device,
      gameMode,
      renderDistance,
      dimension,
      activeSlot,
      inventory,
      isSoundOn,
      health,
      sensitivity,
      seed
    };
  }, [device, gameMode, renderDistance, dimension, activeSlot, inventory, isSoundOn, health, sensitivity, seed]);

  const worldEditsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    worldEditsRef.current = worldEdits;
  }, [worldEdits]);

  // 3x3 Recipe match calculator
  useEffect(() => {
    let matched = false;
    for (const r of CRAFTING_RECIPES) {
      let isSame = true;
      for (let i = 0; i < 9; i++) {
        if (r.input[i] !== craftingGrid[i]) {
          isSame = false;
          break;
        }
      }
      if (isSame) {
        setCraftResult({ id: r.output, count: r.outputCount });
        matched = true;
        break;
      }
    }
    if (!matched) setCraftResult(null);
  }, [craftingGrid]);

  // Procedural voxel block query (featuring High Mountains, Rolling Hills, Beaches, and Water Basins)
  const getBlockAt = (x: number, y: number, z: number, dim: Dimension, currentEdits: Record<string, number>): number => {
    const key = `${x},${y},${z}`;
    if (currentEdits[key] !== undefined) {
      return currentEdits[key];
    }
    if (y < 0 || y >= 64) return 0;
    if (y === 0) return 9; // Bedrock Obsidian

    const h = getHeight(x, z, stateRef.current.seed);

    // Structure Placement Pre-calculation to avoid tree overlapping
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    const lx = (x % 16 + 16) % 16;
    const lz = (z % 16 + 16) % 16;
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const groundY = getHeight(centerX, centerZ, stateRef.current.seed);

    let hasLocalStructure = false;
    let isStructureBlock = false;
    let structureBlockId = 0;

    if (groundY >= 26 && groundY <= 44) {
      const rx = Math.floor(cx / 12);
      const rz = Math.floor(cz / 12);
      const villageHash = noiseHash2D(rx, rz, stateRef.current.seed + 888);
      
      const isVillageRegion = villageHash < 0.12; // 12% chance of a regional village cluster (much more spaced out!)
      
      let isHouseChunk = false;
      let isTempleChunk = false;
      
      if (isVillageRegion) {
        // Houses cluster around the center of the 12x12 chunk region (e.g., local chunk offsets 4 to 8)
        const localCX = (cx % 12 + 12) % 12;
        const localCZ = (cz % 12 + 12) % 12;
        if (localCX >= 4 && localCX <= 8 && localCZ >= 4 && localCZ <= 8) {
          const houseHash = noiseHash2D(cx, cz, stateRef.current.seed + 777);
          if (houseHash < 0.45) {
            isHouseChunk = true;
          }
        }
      } else {
        // Rare chance of individual desert temples outside villages
        const structHash = noiseHash2D(cx, cz, stateRef.current.seed + 999);
        if (structHash < 0.015 && (centerX + centerZ) % 2 === 1) {
          isTempleChunk = true;
        }
      }

      if (isHouseChunk || isTempleChunk) {
        hasLocalStructure = true;

        if (isTempleChunk) {
          // --- DESERT TEMPLE (Pyramid) ---
          const dx = x - centerX;
          const dz = z - centerZ;
          const dy = y - groundY;

          if (dx >= -4 && dx <= 4 && dz >= -4 && dz <= 4 && dy >= 0 && dy <= 5) {
            isStructureBlock = true;
            const maxOffset = 4 - dy;
            if (dy <= 4) {
              if (Math.abs(dx) <= maxOffset && Math.abs(dz) <= maxOffset) {
                if (dy >= 1 && dy <= 3 && Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
                  if (dy === 1 && dx === 0 && dz === 0) {
                    structureBlockId = 54; // Chest
                  } else if (dy === 1) {
                    structureBlockId = 26; // Calcite border
                  } else {
                    structureBlockId = 0; // Chamber air
                  }
                } else if (dy === 4 && dx === 0 && dz === 0) {
                  structureBlockId = 52; // Raw Gold Block on top
                } else {
                  structureBlockId = 4; // Sand / Sandstone walls
                }
              } else {
                isStructureBlock = false;
              }
            } else {
              isStructureBlock = false;
            }
          }
        } else {
          // --- VILLAGE HOUSE ---
          const dx = x - centerX;
          const dz = z - centerZ;
          const dy = y - groundY;

          if (dx >= -2 && dx <= 2 && dz >= -2 && dz <= 2 && dy >= 0 && dy <= 4) {
            isStructureBlock = true;
            if (dy === 0) {
              structureBlockId = 49; // Cobblestone floor
            } else if (dy >= 1 && dy <= 3) {
              const isCorner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
              const isWall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
              if (isCorner) {
                structureBlockId = 6; // Oak log corners
              } else if (isWall) {
                if (dx === 2 && dz === 0 && dy < 3) {
                  structureBlockId = 0; // Door opening
                } else if (dy === 2 && (dx === 0 || dz === 0)) {
                  structureBlockId = 50; // Glass window
                } else {
                  structureBlockId = 15; // Oak Wood Plank walls
                }
              } else {
                // Interior furnishings
                if (dx === -1 && dz === -1 && dy === 1) {
                  structureBlockId = 53; // Crafting Table
                } else if (dx === 1 && dz === -1 && dy === 1) {
                  structureBlockId = 54; // Chest
                } else if (dx === -1 && dz === 1 && dy === 1) {
                  structureBlockId = 55; // Furnace
                } else {
                  structureBlockId = 0; // Room air
                }
              }
            } else if (dy === 4) {
              structureBlockId = 15; // Plank roof
            }
          }
        }
      }
    }

    if (isStructureBlock) {
      return structureBlockId;
    }

    // Dynamic Tree Spawning (Suppressed if chunk has a village/temple structure)
    // Seeded random positions inside the chunk to break the grid pattern completely
    const treeHash1 = noiseHash2D(cx, cz, stateRef.current.seed + 123);
    const treeHash2 = noiseHash2D(cx, cz, stateRef.current.seed + 456);
    
    // Tree position (must be offset slightly to fit perfectly inside chunk boundaries)
    const tx = cx * 16 + 2 + Math.floor(treeHash1 * 12);
    const tz = cz * 16 + 2 + Math.floor(treeHash2 * 12);
    const th = getHeight(tx, tz, stateRef.current.seed);

    const isTreeRegion = th >= 14 && th <= 28;
    const hasTree = isTreeRegion && (treeHash1 > 0.62) && !hasLocalStructure;

    if (hasTree) {
      const treeHeight = 4 + Math.floor(treeHash2 * 4);
      const trunkTop = th + treeHeight;
      const dx = Math.abs(x - tx);
      const dz = Math.abs(z - tz);
      const isBirch = treeHash1 > 0.85; // 40% of trees are beautiful white Birch!

      // Trunk
      if (x === tx && z === tz && y > th && y <= trunkTop) {
        return isBirch ? 35 : 6; // Birch Log or Oak Log
      }

      // Leaf Canopy
      if (dx <= 2 && dz <= 2 && y >= trunkTop - 2 && y <= trunkTop) {
        const isCorner = dx === 2 && dz === 2;
        const leafHash = noiseHash2D(x * 1.5, y * 2.1, z * 1.7 + stateRef.current.seed);
        if (!isCorner || leafHash > 0.4) {
          if (!(dx === 0 && dz === 0 && y < trunkTop)) {
            return isBirch ? 36 : 7; // Birch Leaves or Oak Leaves
          }
        }
      }
      if (dx <= 1 && dz <= 1 && y === trunkTop + 1) {
        const isCorner = dx === 1 && dz === 1;
        if (!isCorner || treeHash2 > 0.5) {
          if (!(dx === 0 && dz === 0)) {
            return isBirch ? 36 : 7; // Birch Leaves or Oak Leaves
          }
        }
      }
      if (dx === 0 && dz === 0 && y === trunkTop + 2) {
        return isBirch ? 36 : 7; // Birch Leaves or Oak Leaves
      }
    }

    // Helper for underground ore veins & mineral distribution (1.17 Overworld style)
    const getSubsurfaceOre = (sx: number, sy: number, sz: number): number => {
      const mineralHash = noiseHash2D(sx * 9.7, sz * 13.3, sy * 11.1 + stateRef.current.seed);
      // Stone transitions into Deepslate dynamically below Y=30 (shifted by 14 blocks)
      const isDeep = sy < 24 || (sy < 30 && noiseHash2D(sx * 4.3, sz * 4.7, stateRef.current.seed + 333) > (sy - 24) / 6);
      const baseBlock = isDeep ? 19 : 3; // Deepslate or Stone

      // Extremely rare amethyst geodes / pockets in deep caves
      if (isDeep) {
        const geodeHash = noiseHash2D(sx * 14.1, sz * 15.3, sy * 13.9 + stateRef.current.seed);
        if (geodeHash < 0.006) { // Reduced from 0.02
          if (geodeHash < 0.003) return 23; // Amethyst Block
          if (geodeHash < 0.0045) return 24; // Budding Amethyst
          return 25; // Amethyst Cluster
        }
        if (geodeHash > 0.996) return 26; // Calcite lining
        if (geodeHash > 0.992) return 27; // Tuff lining
        if (geodeHash > 0.988) return 28; // Smooth Basalt lining
      }

      // Diamond & Deepslate Diamond (Y < 22) (shifted from Y < 12, significantly reduced density)
      if (sy < 22) {
        if (mineralHash < 0.003) { // 5x rarer
          return isDeep ? 20 : 8;
        }
        if (mineralHash < 0.005) { // 5x rarer
          return isDeep ? 44 : 43; // Redstone
        }
        if (mineralHash < 0.008) { // 5x rarer
          return isDeep ? 42 : 41; // Gold
        }
        if (mineralHash < 0.012) { // 4x rarer
          return 9; // Obsidian
        }
      }

      // Lapis (Y < 30) (shifted from Y < 16, significantly reduced density)
      if (sy < 30) {
        if (mineralHash < 0.004) { // 4.5x rarer
          return isDeep ? 46 : 45; // Lapis
        }
      }

      // Copper (Y=24 to 44) (shifted from Y=10 to 30, significantly reduced density)
      if (sy >= 24 && sy <= 44) {
        if (mineralHash > 0.04 && mineralHash < 0.045) { // 5.6x rarer
          return isDeep ? 22 : 21; // Copper
        }
      }

      // Iron (any height, significantly reduced density)
      if (mineralHash > 0.08 && mineralHash < 0.084) { // 5x rarer
        return isDeep ? 40 : 39; // Iron
      }

      // Coal (Y >= 30, significantly reduced density)
      if (sy >= 30) {
        if (mineralHash > 0.10 && mineralHash < 0.11) { // 3x rarer
          return 38; // Coal
        }
      }

      // High Mountain Emeralds
      const hLocal = getHeight(sx, sz, stateRef.current.seed);
      if (hLocal >= 21 && mineralHash > 0.97) {
        return isDeep ? 48 : 47; // Emerald
      }

      // General subsurface rock types
      const rockTypeHash = noiseHash2D(sx * 5.5, sz * 5.9, sy * 6.3 + stateRef.current.seed);
      if (rockTypeHash < 0.04) return 27; // Tuff veins
      if (rockTypeHash > 0.96) return 31; // Dripstone block veins

      return baseBlock;
    };

    // Cave Tunnel Carving
    if (y < h && y > 1) {
      const isCave = getCaveNoise(x, y, z, stateRef.current.seed);
      if (isCave) {
        if (!(h < 12 && y >= h - 2)) {
          return 0; // Empty cave air
        }
      }
    }

    // Water Basins, Riverbeds & Clay/Gravel Shores
    if (h < 12) {
      if (y === h) {
        const shoreHash = noiseHash2D(x * 1.7, z * 1.9, stateRef.current.seed + 111);
        if (shoreHash < 0.15) return 56; // Clay pockets
        if (shoreHash > 0.85) return 57; // Gravel pockets
        return 4; // Sand beach/seabed
      }
      if (y < h) {
        if (y < h - 3) {
          return getSubsurfaceOre(x, y, z);
        }
        return 4; // Sand sub-layer
      }
      if (y <= 11) {
        return 5; // Water column
      }
      return 0;
    }

    // Snowy High Mountain Peaks (Y >= 34)
    if (h >= 34) {
      if (y <= h) {
        if (y < h - 4) {
          return getSubsurfaceOre(x, y, z);
        }
        if (y === h) {
          return h >= 35 ? 58 : 3; // Snowy Grass or Stone
        }
        if (y === h - 1 && h >= 35) {
          return 2; // Dirt under snowy grass
        }
        return 3; // Stone
      }
      // Place small snow blocks or powder snow drift on high mountain peaks
      if (y === h + 1 && h >= 35) {
        const snowHash = noiseHash2D(x * 3.1, z * 2.9, stateRef.current.seed);
        if (snowHash < 0.15) return 59; // Snow Block
        if (snowHash > 0.88) return 60; // Powder Snow (non-solid, walk through!)
      }
      return 0;
    }

    // Rolling Plains & Hills (12 <= h < 34)
    if (y === h) {
      if (h === 12) {
        return 4; // Beach sand transition
      }
      // Add rare moss blocks / azalea bushes on the surface of rolling plains
      const surfaceDetailHash = noiseHash2D(x * 2.3, z * 2.7, stateRef.current.seed + 77);
      if (surfaceDetailHash < 0.04) {
        return 29; // Moss Block
      }
      return 1; // Grass Block
    }
    if (y < h && y >= h - 3) {
      if (h === 12) {
        return 4; // Beach sand sub-layer
      }
      return 2; // Dirt
    }
    if (y < h - 3) {
      return getSubsurfaceOre(x, y, z);
    }

    return 0;
  };

  const getGroundHeightAt = (x: number, z: number): number => {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let y = 63; y >= 0; y--) {
      const b = getBlockAt(ix, y, iz, stateRef.current.dimension, worldEditsRef.current);
      if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
        return y;
      }
    }
    return 0;
  };

  const getGroundHeightBelow = (x: number, startY: number, z: number): number => {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const sY = Math.min(63, Math.floor(startY));
    for (let y = sY; y >= 0; y--) {
      const b = getBlockAt(ix, y, iz, stateRef.current.dimension, worldEditsRef.current);
      if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
        return y;
      }
    }
    return 0;
  };

  // Keyboard/Joystick Input States
  const inputsRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    descend: false,
    breakKey: false,
    joystickX: 0,
    joystickY: 0,
    ipadLookDx: 0,
    ipadLookDy: 0,
    ipadAction: 'break' as 'break' | 'place',
    ipadLookUp: false,
    ipadLookDown: false,
    ipadLookLeft: false,
    ipadLookRight: false
  });

  const lookKeys = useRef({ up: false, down: false, left: false, right: false });

  // Main game initialization and engine loop
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8cc3ff);
    scene.fog = new THREE.Fog(0x8cc3ff, 30, 95);

    // Dynamic Torch lighting engine
    const torchPointLights: THREE.PointLight[] = [];
    const updateTorchLights = () => {
      // Clear old torch lights from scene
      torchPointLights.forEach(light => scene.remove(light));
      torchPointLights.length = 0;

      // Scan world edits for torches (ID 63)
      Object.entries(worldEditsRef.current).forEach(([key, id]) => {
        if (id === 63) {
          const [xs, ys, zs] = key.split(',');
          const tx = parseFloat(xs);
          const ty = parseFloat(ys);
          const tz = parseFloat(zs);

          // Add a warm glowing light slightly above the torch bottom
          const light = new THREE.PointLight(0xff9922, 2.8, 14, 1.2);
          light.position.set(tx + 0.5, ty + 0.7, tz + 0.5);
          scene.add(light);
          torchPointLights.push(light);
        }
      });
    };

    // Initial torch light build
    updateTorchLights();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Beautiful soft shadows

    // --- Supabase Real-Time Broadcast Multiplayer Connection ---
    let mpChannel: any = null;
    const myPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
    
    if (isMultiplayer) {
      try {
        const url = localStorage.getItem('wetalks_supabase_url') || 'https://nsyvlftqcciyetsbhymg.supabase.co';
        const key = localStorage.getItem('wetalks_supabase_key') || 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';
        const client = createClient(url, key);
        
        mpChannel = client.channel(`minecraft-${roomCode}`, {
          config: { broadcast: { self: false } },
        });
        
        mpChannel
          .on('broadcast', { event: 'player_move' }, (payload: any) => {
            const { id, x, y, z, yaw: pYaw, username } = payload.payload;
            if (remotePlayersRef.current[id]) {
              remotePlayersRef.current[id].targetPos.set(x, y, z);
              remotePlayersRef.current[id].targetYaw = pYaw;
              remotePlayersRef.current[id].lastUpdate = performance.now();
            } else {
              const model = createSteveModel();
              scene.add(model);
              remotePlayersRef.current[id] = {
                id,
                username: username || 'Player',
                mesh: model,
                targetPos: new THREE.Vector3(x, y, z),
                targetYaw: pYaw,
                lastUpdate: performance.now()
              };
            }
          })
          .on('broadcast', { event: 'block_edit' }, (payload: any) => {
            const { x, y, z, blockType } = payload.payload;
            const key = `${x},${y},${z}`;
            worldEditsRef.current[key] = blockType;
            setWorldEdits(prev => ({ ...prev, [key]: blockType }));
            rebuildChunkMesh(Math.floor(x / 16), Math.floor(z / 16));
            updateTorchLights();
          });
          
        mpChannel.subscribe((status: string) => {
          console.log("Supabase Minecraft Multiplayer status:", status);
        });
      } catch (err) {
        console.error("Multiplayer setup failed:", err);
      }
    }

    broadcastBlockEditRef.current = (x: number, y: number, z: number, blockType: number) => {
      if (isMultiplayer && mpChannel) {
        try {
          mpChannel.send({
            type: 'broadcast',
            event: 'block_edit',
            payload: { x, y, z, blockType }
          });
        } catch(e) {}
      }
    };

    let mpIntervalId: any = null;
    if (isMultiplayer && mpChannel) {
      const username = sessionStorage.getItem('wetalks_session_user') || 'ゲスト';
      mpIntervalId = setInterval(() => {
        try {
          mpChannel.send({
            type: 'broadcast',
            event: 'player_move',
            payload: {
              id: myPlayerId,
              username,
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
              yaw: yaw
            }
          });
        } catch(e) {}
      }, 100);
    }

    // Beautiful high-fidelity lighting matching 影MOD (Voxel Shaders)
    const hemiLight = new THREE.HemisphereLight(0xa8d3ff, 0x594d3f, 0.7);
    scene.add(hemiLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffeed4, 1.25);
    dirLight.position.set(24, 48, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 15; // Tight shadow bounds
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0002; // Prevents shadow acne with standard materials
    scene.add(dirLight);
    scene.add(dirLight.target);

    // Geometries & Materials
    const blockGeometry = createAOBlockGeometry();
    const blockMaterials: Record<number, THREE.Material[]> = {};
    Object.entries(BLOCK_TYPES).forEach(([idStr, b]) => {
      const id = parseInt(idStr);
      blockMaterials[id] = getBlockMaterialArray(id, !!b.isTransparent);
    });

    // Chunk rendering map
    const loadedChunks = new THREE.Group();
    scene.add(loadedChunks);
    const chunksMap = new Map<string, THREE.Group>();

    const isBlockOccluded = (bx: number, by: number, bz: number) => {
      const neighbors = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1]
      ];
      for (const [dx, dy, dz] of neighbors) {
        const ny = by + dy;
        if (ny < 0 || ny >= 64) continue;
        const nb = getBlockAt(bx + dx, ny, bz + dz, stateRef.current.dimension, worldEditsRef.current);
        if (nb === 0 || !BLOCK_TYPES[nb]?.isSolid) {
          return false;
        }
      }
      return true;
    };

    const buildChunk = (cx: number, cz: number) => {
      const group = new THREE.Group();
      group.name = `${cx},${cz}`;

      // Local 3D grid cache (X: -2 to 17, Y: 0 to 63, Z: -2 to 17)
      // Size: 20 * 64 * 20 = 25,600 elements
      const cache = new Uint8Array(20 * 64 * 20);
      const getCacheIndex = (lx: number, ly: number, lz: number) => {
        return (lx + 2) * 1280 + ly * 20 + (lz + 2);
      };

      // Populate local block cache
      for (let lx = -2; lx <= 17; lx++) {
        const bx = cx * 16 + lx;
        for (let lz = -2; lz <= 17; lz++) {
          const bz = cz * 16 + lz;
          for (let ly = 0; ly < 64; ly++) {
            cache[getCacheIndex(lx, ly, lz)] = getBlockAt(bx, ly, bz, stateRef.current.dimension, worldEditsRef.current);
          }
        }
      }

      const getCachedBlockAt = (bx: number, y: number, bz: number) => {
        if (y < 0 || y >= 64) return 0;
        const lx = bx - cx * 16;
        const lz = bz - cz * 16;
        if (lx < -2 || lx > 17 || lz < -2 || lz > 17) {
          return getBlockAt(bx, y, bz, stateRef.current.dimension, worldEditsRef.current);
        }
        return cache[getCacheIndex(lx, y, lz)];
      };

      const isCachedBlockOccluded = (bx: number, by: number, bz: number) => {
        const neighbors = [
          [1, 0, 0], [-1, 0, 0],
          [0, 1, 0], [0, -1, 0],
          [0, 0, 1], [0, 0, -1]
        ];
        for (const [dx, dy, dz] of neighbors) {
          const ny = by + dy;
          const nb = getCachedBlockAt(bx + dx, ny, bz + dz);
          if (nb === 0 || !BLOCK_TYPES[nb]?.isSolid) {
            return false;
          }
        }
        return true;
      };

      const counts: Record<number, number> = {};
      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          for (let y = 0; y < 64; y++) {
            const bx = cx * 16 + x;
            const bz = cz * 16 + z;
            const b = getCachedBlockAt(bx, y, bz);
            if (b > 0) {
              if (BLOCK_TYPES[b]?.isSolid && isCachedBlockOccluded(bx, y, bz)) {
                continue;
              }
              counts[b] = (counts[b] || 0) + 1;
            }
          }
        }
      }

      const dummy = new THREE.Object3D();
      Object.entries(counts).forEach(([idStr, count]) => {
        const id = parseInt(idStr);
        const mats = blockMaterials[id] || getBlockMaterialArray(id, false);
        const geom = id === 63 ? new THREE.BoxGeometry(0.16, 0.65, 0.16) : blockGeometry;
        const instMesh = new THREE.InstancedMesh(geom, mats, count);
        instMesh.castShadow = true; // All blocks cast shadow for a beautiful full shaders experience
        instMesh.receiveShadow = true;

        let idx = 0;
        for (let x = 0; x < 16; x++) {
          for (let z = 0; z < 16; z++) {
            for (let y = 0; y < 64; y++) {
              const bx = cx * 16 + x;
              const bz = cz * 16 + z;
              if (getCachedBlockAt(bx, y, bz) === id) {
                if (BLOCK_TYPES[id]?.isSolid && isCachedBlockOccluded(bx, y, bz)) {
                  continue;
                }
                if (id === 63) {
                  dummy.position.set(bx + 0.5, y + 0.325, bz + 0.5);
                } else {
                  dummy.position.set(bx + 0.5, y + 0.5, bz + 0.5);
                }
                dummy.updateMatrix();
                instMesh.setMatrixAt(idx, dummy.matrix);

                // Compute real-time Ambient Occlusion points based on surrounding solid blocks
                let occlusionPoints = 0;
                const neighbors = [
                  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
                  [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1],
                  [0, 1, 0] // Block directly above casts strongest shadow
                ];
                neighbors.forEach(([dx, dy, dz]) => {
                  const nb = getCachedBlockAt(bx + dx, y + dy, bz + dz);
                  if (nb > 0 && BLOCK_TYPES[nb]?.isSolid) {
                    occlusionPoints += (dy === 1 && dx === 0 && dz === 0) ? 2.5 : 0.8;
                  }
                });

                // Convert points to brightness (1.0 = full light, 0.42 = deep corner shadow)
                const aoFactor = Math.max(0.42, 1.0 - occlusionPoints * 0.12);
                
                // Cool-tinted shadows & warm-glowing highlights (BSL/SEUS Shaders color grading style)
                const redTint = aoFactor < 0.85 ? aoFactor : aoFactor * 1.03;
                const greenTint = aoFactor < 0.85 ? aoFactor * 0.98 : aoFactor * 1.01;
                const blueTint = aoFactor < 0.85 ? aoFactor * 1.05 : aoFactor * 0.97;
                
                const finalColor = new THREE.Color(
                  Math.min(1.0, redTint),
                  Math.min(1.0, greenTint),
                  Math.min(1.0, blueTint)
                );
                
                instMesh.setColorAt(idx, finalColor);
                idx++;
              }
            }
          }
        }
        instMesh.instanceMatrix.needsUpdate = true;
        if (instMesh.instanceColor) {
          instMesh.instanceColor.needsUpdate = true;
        }
        group.add(instMesh);
      });

      return group;
    };

    // Load initial spawn chunk (0,0) immediately
    const firstChunk = buildChunk(0, 0);
    loadedChunks.add(firstChunk);
    chunksMap.set('0,0', firstChunk);    // Initial Safe Spawn height calculation
    const initialH = getHeight(8, 8, stateRef.current.seed);
    camera.position.set(8, initialH + 2.6, 8);

    let yaw = 0;
    let pitch = 0;
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let animId = 0;
    let isSpawnReady = false;
    let highestBlockYAtSpawn = 0;
    const clock = new THREE.Clock();

    // Player helper object for grounding state and jump physics compatibility
    const player = {
      isGrounded: true,
      velocity: {
        y: 0
      },
      get position() {
        return camera.position;
      }
    };

    // Selection box outline for targeted block
    const selGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const selEdges = new THREE.EdgesGeometry(selGeo);
    const selMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const selectionBox = new THREE.LineSegments(selEdges, selMat);
    selectionBox.visible = false;
    scene.add(selectionBox);

    // Procedural crack texture generator
    const createCrackingTexture = (): THREE.Texture => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 16, 16);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(2, 2); ctx.lineTo(5, 5); ctx.lineTo(8, 4); ctx.lineTo(12, 8);
      ctx.moveTo(14, 2); ctx.lineTo(10, 6); ctx.lineTo(11, 11); ctx.lineTo(7, 14);
      ctx.moveTo(1, 13); ctx.lineTo(6, 10); ctx.lineTo(4, 7);
      ctx.stroke();
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    };

    const crackMaterial = new THREE.MeshBasicMaterial({
      map: createCrackingTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const crackMesh = new THREE.Mesh(selGeo, crackMaterial);
    crackMesh.visible = false;
    scene.add(crackMesh);

    // Dropped Items Engine
    interface DroppedItem {
      mesh: THREE.Mesh;
      blockId: number;
      spawnTime: number;
      velocity: THREE.Vector3;
    }
    const droppedItems: DroppedItem[] = [];

    const spawnDroppedItem = (blockId: number, x: number, y: number, z: number) => {
      const miniGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const mats = getBlockMaterialArray(blockId, false, false);
      const mesh = new THREE.Mesh(miniGeo, mats);
      mesh.position.set(x, y + 0.25, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        4.0,
        (Math.random() - 0.5) * 1.5
      );
      
      droppedItems.push({
        mesh,
        blockId,
        spawnTime: performance.now(),
        velocity
      });
    };

    // Mining state tracker
    const miningState = {
      blockPos: null as THREE.Vector3 | null,
      blockId: 0,
      progress: 0,
      duration: 1.0,
    };

    // Custom check collision bounding box (2 blocks tall doorway checks)
    const checkCollision = (x: number, yEye: number, z: number): boolean => {
      const feetY = Math.floor(yEye - 1.62);
      const headY = Math.floor(yEye - 0.62); // 1 block above feet
      
      const radius = 0.22;
      const offsets = [
        [0, 0],
        [radius, radius], [radius, -radius], [-radius, radius], [-radius, -radius],
        [radius, 0], [-radius, 0], [0, radius], [0, -radius]
      ];
      
      for (const [ox, oz] of offsets) {
        const bx = Math.floor(x + ox);
        const bz = Math.floor(z + oz);
        
        // Check feet block
        const bFeet = getBlockAt(bx, feetY, bz, stateRef.current.dimension, worldEditsRef.current);
        if (bFeet > 0 && BLOCK_TYPES[bFeet]?.isSolid) {
          return true;
        }
        
        // Check head/torso block (2nd block of 2-block height)
        const bHead = getBlockAt(bx, headY, bz, stateRef.current.dimension, worldEditsRef.current);
        if (bHead > 0 && BLOCK_TYPES[bHead]?.isSolid) {
          return true;
        }
      }
      return false;
    };

    // Raycast look target helper
    const getLookTarget = () => {
      const maxDistance = 6;
      const step = 0.05;
      const origin = camera.position.clone();
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      
      let cur = origin.clone();
      let prevVoxel = new THREE.Vector3(Math.floor(origin.x), Math.floor(origin.y), Math.floor(origin.z));
      
      for (let d = 0; d < maxDistance; d += step) {
        cur.addScaledVector(dir, step);
        const vx = Math.floor(cur.x);
        const vy = Math.floor(cur.y);
        const vz = Math.floor(cur.z);
        
        if (vy >= 0 && vy < 64) {
          const blockAt = getBlockAt(vx, vy, vz, stateRef.current.dimension, worldEditsRef.current);
          if (blockAt > 0 && BLOCK_TYPES[blockAt]?.isSolid) {
            return {
              pos: new THREE.Vector3(vx, vy, vz),
              prevPos: prevVoxel.clone(),
              blockId: blockAt
            };
          }
        }
        prevVoxel.set(vx, vy, vz);
      }
      return null;
    };

    // Controls setup
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW') inputsRef.current.forward = true;
      if (code === 'KeyS') inputsRef.current.backward = true;
      if (code === 'KeyA') inputsRef.current.left = true;
      if (code === 'KeyD') inputsRef.current.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        inputsRef.current.descend = true;
      }
      
      // Custom Hotkeys
      if (code === 'KeyF') inputsRef.current.breakKey = true;
      if (code === 'KeyR') {
        const activeItem = stateRef.current.inventory[stateRef.current.activeSlot];
        const blockId = activeItem ? activeItem.id : 1;
        executeRayplace(blockId);
      }
      
      if (code === 'ArrowUp') { e.preventDefault(); lookKeys.current.up = true; }
      if (code === 'ArrowDown') { e.preventDefault(); lookKeys.current.down = true; }
      if (code === 'ArrowLeft') { e.preventDefault(); lookKeys.current.left = true; }
      if (code === 'ArrowRight') { e.preventDefault(); lookKeys.current.right = true; }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        inputsRef.current.jump = true;
        if (player.isGrounded) {
          player.velocity.y = 8.5;
          player.isGrounded = false;
        }
      }
      if (code === 'KeyE') {
        setShowInventory(prev => !prev);
        if (stateRef.current.isSoundOn) playSynthSound('click');
      }
      if (e.key >= '1' && e.key <= '9') {
        setActiveSlot(parseInt(e.key) - 1);
        if (stateRef.current.isSoundOn) playSynthSound('click');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW') inputsRef.current.forward = false;
      if (code === 'KeyS') inputsRef.current.backward = false;
      if (code === 'KeyA') inputsRef.current.left = false;
      if (code === 'KeyD') inputsRef.current.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        inputsRef.current.descend = false;
      }

      if (code === 'KeyF') inputsRef.current.breakKey = false;

      if (code === 'ArrowUp') lookKeys.current.up = false;
      if (code === 'ArrowDown') lookKeys.current.down = false;
      if (code === 'ArrowLeft') lookKeys.current.left = false;
      if (code === 'ArrowRight') lookKeys.current.right = false;

      if (code === 'Space' || e.key === ' ') {
        e.preventDefault();
        inputsRef.current.jump = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvasRef.current || stateRef.current.device !== 'pc') return;
      const sens = stateRef.current.sensitivity;
      yaw -= e.movementX * 0.0025 * sens;
      pitch -= e.movementY * 0.0025 * sens;
      pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (stateRef.current.device === 'pc') {
        if (document.pointerLockElement !== canvasRef.current) {
          canvasRef.current.requestPointerLock();
          return;
        }
      }

      // Check if player is interacting with a chest or furnace
      const target = getLookTarget();
      if (target) {
        const blockKey = `${target.pos.x},${target.pos.y},${target.pos.z}`;
        
        if (target.blockId === 54) { // Chest!
          // Initialize empty chest inventory if it does not exist yet
          setChestInventories(prev => {
            if (!prev[blockKey]) {
              return { ...prev, [blockKey]: Array(27).fill(null) };
            }
            return prev;
          });
          setActiveChestKey(blockKey);
          setShowInventory(false);
          setActiveFurnaceKey(null);
          document.exitPointerLock();
          if (stateRef.current.isSoundOn) playSynthSound('click');
          return;
        }

        if (target.blockId === 55) { // Furnace!
          // Initialize empty furnace state if it does not exist yet
          setFurnaceStates(prev => {
            if (!prev[blockKey]) {
              return {
                ...prev,
                [blockKey]: { input: null, fuel: null, output: null, progress: 0 }
              };
            }
            return prev;
          });
          setActiveFurnaceKey(blockKey);
          setShowInventory(false);
          setActiveChestKey(null);
          document.exitPointerLock();
          if (stateRef.current.isSoundOn) playSynthSound('click');
          return;
        }
      }

      if (stateRef.current.device !== 'pc') {
        // iPad - tap on canvas breaks/places using the active iPad action!
        const activeItem = stateRef.current.inventory[stateRef.current.activeSlot];
        const blockId = activeItem ? activeItem.id : 1;
        if (inputsRef.current.ipadAction === 'break') {
          // iPad breaking: trigger immediate raycast breaking or let it break
          if (target) {
            const editKey = `${target.pos.x},${target.pos.y},${target.pos.z}`;
            worldEditsRef.current[editKey] = 0;
            setWorldEdits(prev => ({ ...prev, [editKey]: 0 }));
            spawnDroppedItem(target.blockId, target.pos.x + 0.5, target.pos.y, target.pos.z + 0.5);
            if (stateRef.current.isSoundOn) playSynthSound('break');
            rebuildChunkMesh(Math.floor(target.pos.x / 16), Math.floor(target.pos.z / 16));
            broadcastBlockEditRef.current(target.pos.x, target.pos.y, target.pos.z, 0);
          }
        } else {
          executeRayplace(blockId);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (stateRef.current.device !== 'pc' || document.pointerLockElement !== canvasRef.current) return;
      
      const target = getLookTarget();
      if (e.button === 2) { // Right Click
        e.preventDefault();
        
        // If right clicked on chest or furnace, open it!
        if (target && (target.blockId === 54 || target.blockId === 55)) {
          handleCanvasClick(e);
          return;
        }
        
        // Otherwise, place block!
        const activeItem = stateRef.current.inventory[stateRef.current.activeSlot];
        const blockId = activeItem ? activeItem.id : 1;
        executeRayplace(blockId);
      } else if (e.button === 0) { // Left Click
        // If left clicked on chest or furnace, we don't open it, we can mine it (handled by progressive breakKey)
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const executeRayplace = (activeBlockId: number) => {
      const target = getLookTarget();
      if (!target) return;
      
      const slotIdx = stateRef.current.activeSlot;
      const activeItem = stateRef.current.inventory[slotIdx];
      
      if (!activeItem || activeItem.count <= 0) {
        return;
      }
      const nonPlaceable = [16, 17, 18];
      if (nonPlaceable.includes(activeItem.id)) {
        return;
      }

      const prevVoxel = target.prevPos;
      const editKey = `${prevVoxel.x},${prevVoxel.y},${prevVoxel.z}`;
      
      const playerFeetX = Math.floor(camera.position.x);
      const playerFeetY = Math.floor(camera.position.y - 1.62);
      const playerHeadX = Math.floor(camera.position.x);
      const playerHeadY = Math.floor(camera.position.y);
      const playerZ = Math.floor(camera.position.z);
      
      if (prevVoxel.x === playerFeetX && prevVoxel.z === playerZ && (prevVoxel.y === playerFeetY || prevVoxel.y === playerHeadY)) {
        return;
      }
      
      worldEditsRef.current[editKey] = activeBlockId;
      setWorldEdits(prev => ({ ...prev, [editKey]: activeBlockId }));
      if (stateRef.current.isSoundOn) playSynthSound('place');
      
      setInventory(prev => {
        const updated = [...prev];
        if (updated[slotIdx]) {
          const remaining = updated[slotIdx]!.count - 1;
          updated[slotIdx] = remaining > 0 ? { id: updated[slotIdx]!.id, count: remaining } : null;
        }
        return updated;
      });
      rebuildChunkMesh(Math.floor(prevVoxel.x / 16), Math.floor(prevVoxel.z / 16));
      updateTorchLights();
      broadcastBlockEditRef.current(prevVoxel.x, prevVoxel.y, prevVoxel.z, activeBlockId);
    };

    const rebuildChunkMesh = (cx: number, cz: number) => {
      const key = `${cx},${cz}`;
      const oldGroup = chunksMap.get(key);
      if (oldGroup) {
        loadedChunks.remove(oldGroup);
        oldGroup.children.forEach(c => {
          if (c instanceof THREE.InstancedMesh) c.dispose();
        });
      }
      const newGroup = buildChunk(cx, cz);
      loadedChunks.add(newGroup);
      chunksMap.set(key, newGroup);
    };

    // Keyboard & Mouse events binding
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('click', handleCanvasClick);
    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    canvasRef.current.addEventListener('contextmenu', handleContextMenu);

    // Explicit Dynamic Chunk Loader (centered around Player Chunk)
    const updateChunks = () => {
      const pcx = Math.floor(camera.position.x / 16);
      const pcz = Math.floor(camera.position.z / 16);
      const R = stateRef.current.renderDistance;
      const currentKeys = new Set<string>();

      for (let dx = -R; dx <= R; dx++) {
        for (let dz = -R; dz <= R; dz++) {
          const cx = pcx + dx;
          const cz = pcz + dz;
          const key = `${cx},${cz}`;
          currentKeys.add(key);

          if (!chunksMap.has(key)) {
            const grp = buildChunk(cx, cz);
            loadedChunks.add(grp);
            chunksMap.set(key, grp);
          }
        }
      }

      // Garbage collect distant chunks
      chunksMap.forEach((grp, key) => {
        if (!currentKeys.has(key)) {
          loadedChunks.remove(grp);
          grp.children.forEach(c => {
            if (c instanceof THREE.InstancedMesh) c.dispose();
          });
          chunksMap.delete(key);
        }
      });

      setLoadedChunkCount(chunksMap.size);
    };

    // Rendering Tick Loop
    const tick = () => {
      animId = requestAnimationFrame(tick);

      // 1. Calculate Frame Rate
      const now = performance.now();
      frameCount++;
      if (now > lastFpsTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      // 2. Spawn Protection: Hold movement physics calculations until Spawn chunk (0,0) is loaded
      if (!isSpawnReady) {
        if (chunksMap.has('0,0')) {
          highestBlockYAtSpawn = getGroundHeightAt(8, 8);
          camera.position.set(8, highestBlockYAtSpawn + 2.62, 8);
          isSpawnReady = true;
        }
        renderer.render(scene, camera);
        return;
      }

      // 2.5 Process iPad look button rotation updates using lookKeys
      const LOOK_SPEED = 0.025 * stateRef.current.sensitivity;
      if (lookKeys.current.left) {
        yaw += LOOK_SPEED;
        camera.rotation.y += LOOK_SPEED;
      }
      if (lookKeys.current.right) {
        yaw -= LOOK_SPEED;
        camera.rotation.y -= LOOK_SPEED;
      }
      if (lookKeys.current.up) {
        pitch = Math.max(-1.4, Math.min(1.4, pitch + LOOK_SPEED));
        camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x + LOOK_SPEED));
      }
      if (lookKeys.current.down) {
        pitch = Math.max(-1.4, Math.min(1.4, pitch - LOOK_SPEED));
        camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x - LOOK_SPEED));
      }

      // 3. Process Rotation and Look Vector direction
      const lookDir = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
      );
      camera.lookAt(camera.position.clone().add(lookDir));

      // 4. Calculate Movement Input Vectors and Sub-stepping Physics (No Voxel Penetration)
      const delta = Math.min(clock.getDelta(), 0.1) || 0.016;

      const forwardVec = new THREE.Vector3(lookDir.x, 0, lookDir.z).normalize();
      const rightVec = new THREE.Vector3().crossVectors(forwardVec, new THREE.Vector3(0, 1, 0)).normalize();
      const moveDirection = new THREE.Vector3();

      if (inputsRef.current.forward) moveDirection.add(forwardVec);
      if (inputsRef.current.backward) moveDirection.add(forwardVec.clone().negate());
      if (inputsRef.current.left) moveDirection.add(rightVec.clone().negate());
      if (inputsRef.current.right) moveDirection.add(rightVec);
      moveDirection.normalize();

      // base walking speed is strictly 5.0 units/second in survival (no tunneling), 9.0 in creative
      const baseSpeed = stateRef.current.gameMode === 'creative' ? 9.0 : 5.0;

      if (stateRef.current.gameMode === 'survival') {
        // 1. Gravity and Jump Inputs
        if (!player.isGrounded) {
          player.velocity.y += -28.0 * delta;
        }
        if (player.velocity.y < -35.0) player.velocity.y = -35.0;

        // Keyboard/Pad Jump trigger (Only if grounded)
        if (inputsRef.current.jump && player.isGrounded) {
          player.velocity.y = 8.5;
          if (stateRef.current.isSoundOn) playSynthSound('jump');
          player.isGrounded = false;
        }

        // Apply Y movement & collision axis resolution
        const originalY = camera.position.y;
        camera.position.y += player.velocity.y * delta;

        // Resolve Y collision
        const radius = 0.22;
        const xMin = camera.position.x - radius;
        const xMax = camera.position.x + radius;
        const zMin = camera.position.z - radius;
        const zMax = camera.position.z + radius;
        const yMin = camera.position.y - 1.62;
        const yMax = camera.position.y + 0.18;

        const ixStart = Math.floor(xMin);
        const ixEnd = Math.floor(xMax);
        const iyStart = Math.floor(yMin);
        const iyEnd = Math.floor(yMax);
        const izStart = Math.floor(zMin);
        const izEnd = Math.floor(zMax);

        let landed = false;
        for (let ix = ixStart; ix <= ixEnd; ix++) {
          for (let iy = iyStart; iy <= iyEnd; iy++) {
            for (let iz = izStart; iz <= izEnd; iz++) {
              const b = getBlockAt(ix, iy, iz, stateRef.current.dimension, worldEditsRef.current);
              if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
                if (camera.position.y < originalY) {
                  // Moving down: land on top of the block with eye-height = 1.62 blocks
                  camera.position.y = iy + 1 + 1.62;
                  
                  // Fall damage calculation
                  if (player.velocity.y < -15.0) {
                    const hReduction = Math.floor((Math.abs(player.velocity.y) - 15.0) * 4.2);
                    if (hReduction > 5) {
                      setHealth(prev => {
                        const next = prev - hReduction;
                        if (next <= 0) {
                          setIsGameOver(true);
                          if (stateRef.current.isSoundOn) playSynthSound('damage');
                          return 0;
                        }
                        if (stateRef.current.isSoundOn) playSynthSound('damage');
                        return next;
                      });
                    }
                  }
                  
                  player.velocity.y = 0;
                  player.isGrounded = true;
                  landed = true;
                } else if (camera.position.y > originalY) {
                  // Moving up: hit head on ceiling block (preventing camera penetration)
                  camera.position.y = iy - 0.18 - 0.001;
                  player.velocity.y = 0;
                }
                break;
              }
            }
            if (landed) break;
          }
          if (landed) break;
        }

        // 2 & 3. Horizontal Axes: Sub-Stepping resolved axis-by-axis
        const SUB_STEPS = 4;
        const stepDelta = delta / SUB_STEPS;

        for (let step = 0; step < SUB_STEPS; step++) {
          const currentGroundY = getGroundHeightAt(camera.position.x, camera.position.z);

          // X movement & collision check
          const stepMoveX = moveDirection.x * baseSpeed * stepDelta;
          if (Math.abs(stepMoveX) > 0.0001) {
            const originalX = camera.position.x;
            camera.position.x += stepMoveX;

            const xMinX = camera.position.x - radius;
            const xMaxX = camera.position.x + radius;
            const zMinX = camera.position.z - radius;
            const zMaxX = camera.position.z + radius;
            const yMinX = camera.position.y - 1.62;
            const yMaxX = camera.position.y + 0.18;

            const ixStart_X = Math.floor(xMinX);
            const ixEnd_X = Math.floor(xMaxX);
            const iyStart_X = Math.floor(yMinX);
            const iyEnd_X = Math.floor(yMaxX);
            const izStart_X = Math.floor(zMinX);
            const izEnd_X = Math.floor(zMaxX);

            let collidedX = false;

            for (let ix = ixStart_X; ix <= ixEnd_X; ix++) {
              for (let iy = iyStart_X; iy <= iyEnd_X; iy++) {
                for (let iz = izStart_X; iz <= izEnd_X; iz++) {
                  const b = getBlockAt(ix, iy, iz, stateRef.current.dimension, worldEditsRef.current);
                  if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
                    collidedX = true;
                    if (camera.position.x > originalX) {
                      camera.position.x = ix - radius - 0.001;
                    } else if (camera.position.x < originalX) {
                      camera.position.x = ix + 1 + radius + 0.001;
                    }
                    break;
                  }
                }
                if (collidedX) break;
              }
              if (collidedX) break;
            }
          }

          // Z movement & collision check
          const stepMoveZ = moveDirection.z * baseSpeed * stepDelta;
          if (Math.abs(stepMoveZ) > 0.0001) {
            const originalZ = camera.position.z;
            camera.position.z += stepMoveZ;

            const xMinZ = camera.position.x - radius;
            const xMaxZ = camera.position.x + radius;
            const zMinZ = camera.position.z - radius;
            const zMaxZ = camera.position.z + radius;
            const yMinZ = camera.position.y - 1.62;
            const yMaxZ = camera.position.y + 0.18;

            const ixStart_Z = Math.floor(xMinZ);
            const ixEnd_Z = Math.floor(xMaxZ);
            const iyStart_Z = Math.floor(yMinZ);
            const iyEnd_Z = Math.floor(yMaxZ);
            const izStart_Z = Math.floor(zMinZ);
            const izEnd_Z = Math.floor(zMaxZ);

            let collidedZ = false;

            for (let ix = ixStart_Z; ix <= ixEnd_Z; ix++) {
              for (let iy = iyStart_Z; iy <= iyEnd_Z; iy++) {
                for (let iz = izStart_Z; iz <= izEnd_Z; iz++) {
                  const b = getBlockAt(ix, iy, iz, stateRef.current.dimension, worldEditsRef.current);
                  if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
                    collidedZ = true;
                    if (camera.position.z > originalZ) {
                      camera.position.z = iz - radius - 0.001;
                    } else if (camera.position.z < originalZ) {
                      camera.position.z = iz + 1 + radius + 0.001;
                    }
                    break;
                  }
                }
                if (collidedZ) break;
              }
              if (collidedZ) break;
            }
          }
        }

        // 4. Grounding State Check
        const checkY = camera.position.y - 1.62 - 0.05;
        const ixStart_G = Math.floor(camera.position.x - radius);
        const ixEnd_G = Math.floor(camera.position.x + radius);
        const iy_G = Math.floor(checkY);
        const izStart_G = Math.floor(camera.position.z - radius);
        const izEnd_G = Math.floor(camera.position.z + radius);

        let actuallyGrounded = false;
        for (let ix = ixStart_G; ix <= ixEnd_G; ix++) {
          for (let iz = izStart_G; iz <= izEnd_G; iz++) {
            const b = getBlockAt(ix, iy_G, iz, stateRef.current.dimension, worldEditsRef.current);
            if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
              actuallyGrounded = true;
              break;
            }
          }
          if (actuallyGrounded) break;
        }

        player.isGrounded = actuallyGrounded;
        if (!actuallyGrounded && player.velocity.y === 0) {
          player.velocity.y = -0.1;
        }
      } else {
        // Creative fly: allowing descending into tunnels and caves!
        const move = moveDirection.clone().multiplyScalar(baseSpeed * delta);
        camera.position.add(move);
        
        player.velocity.y = 0;
        if (inputsRef.current.jump) camera.position.y += 0.20;
        if (inputsRef.current.descend) camera.position.y -= 0.20;
        
        // Prevent flying through the bedrock base completely
        if (camera.position.y < 1.5) {
          camera.position.y = 1.5;
        }
      }

      // Outer boundaries clamp
      if (camera.position.y < -10) {
        camera.position.set(8, getHeight(8, 8, stateRef.current.seed) + 2.62, 8);
        player.velocity.y = 0;
        if (stateRef.current.gameMode === 'survival') {
          setHealth(prev => Math.max(0, prev - 25));
        }
      }

      updateChunks();

      // 6. Raycast block selection and progressive mining
      const target = getLookTarget();
      if (target) {
        selectionBox.visible = true;
        selectionBox.position.set(target.pos.x + 0.5, target.pos.y + 0.5, target.pos.z + 0.5);
        
        const isMiningInput = inputsRef.current.breakKey;
        if (isMiningInput) {
          if (!miningState.blockPos || !miningState.blockPos.equals(target.pos)) {
            miningState.blockPos = target.pos.clone();
            miningState.blockId = target.blockId;
            miningState.progress = 0;
            
            // Advanced hardness system & proper tool (適正ツール) multipliers
            let baseHardness = 0.5;
            let toolRequirement: 'pickaxe' | 'none' = 'none';

            const bid = target.blockId;
            const isStoneLike = [3, 8, 9, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 34, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 55].includes(bid);
            const isWoodLike = [6, 15, 35, 37, 53, 54].includes(bid);
            const isSoft = [1, 2, 4, 7, 29, 30, 33, 36, 56, 57, 58, 59, 60, 61, 62, 63].includes(bid);

            if (isStoneLike) {
              baseHardness = 1.5;
              toolRequirement = 'pickaxe';
              if (bid === 9) baseHardness = 10.0; // Obsidian is super hard!
              else if ([8, 20, 41, 42, 47, 48].includes(bid)) baseHardness = 3.0; // Diamond, Gold, Emerald ore
              else if ([19, 20, 22, 40, 42, 44, 46, 48].includes(bid)) baseHardness = 2.0; // Deepslate ores
            } else if (isWoodLike) {
              baseHardness = 1.0;
            } else if (isSoft) {
              baseHardness = 0.3;
            }

            const activeItem = stateRef.current.inventory[stateRef.current.activeSlot];
            const activeId = activeItem ? activeItem.id : 0;
            
            let speedMultiplier = 1.0;
            if (toolRequirement === 'pickaxe') {
              if (activeId === 18) { // Stone Pickaxe
                speedMultiplier = 4.5;
              } else if (activeId === 17) { // Wooden Pickaxe
                speedMultiplier = 2.2;
              } else {
                // Breaking stone with hand/stick is extremely slow (0.15 speed = 6.6x duration penalty)
                speedMultiplier = 0.15;
              }
            } else {
              // Soft/wood blocks get a small multiplier with any tool
              if (activeId === 18 || activeId === 17) {
                speedMultiplier = 1.5;
              }
            }

            let duration = baseHardness / speedMultiplier;
            duration = Math.max(0.1, Math.min(15.0, duration));
            miningState.duration = duration;
          } else {
            const delta = Math.min(clock.getDelta(), 0.1) || 0.016;
            miningState.progress += delta;
            
            // Periodic cracking sound triggers
            if (Math.floor(miningState.progress * 5) > Math.floor((miningState.progress - delta) * 5)) {
              if (stateRef.current.isSoundOn) playSynthSound('break');
            }
            
            if (miningState.progress >= miningState.duration) {
              const editKey = `${target.pos.x},${target.pos.y},${target.pos.z}`;
              
              worldEditsRef.current[editKey] = 0;
              setWorldEdits(prev => ({ ...prev, [editKey]: 0 }));
              
              spawnDroppedItem(target.blockId, target.pos.x + 0.5, target.pos.y, target.pos.z + 0.5);
              if (stateRef.current.isSoundOn) playSynthSound('break');
              
              rebuildChunkMesh(Math.floor(target.pos.x / 16), Math.floor(target.pos.z / 16));
              updateTorchLights();
              broadcastBlockEditRef.current(target.pos.x, target.pos.y, target.pos.z, 0);
              
              miningState.blockPos = null;
              miningState.progress = 0;
              crackMesh.visible = false;
            } else {
              crackMesh.visible = true;
              crackMesh.position.copy(selectionBox.position);
              
              const ratio = miningState.progress / miningState.duration;
              crackMaterial.opacity = ratio * 0.95;
              crackMaterial.needsUpdate = true;
            }
          }
        } else {
          miningState.blockPos = null;
          miningState.progress = 0;
          crackMesh.visible = false;
        }
      } else {
        selectionBox.visible = false;
        crackMesh.visible = false;
        miningState.blockPos = null;
        miningState.progress = 0;
      }

      // 7. Process voxel items (Phys, rot, bob, and magnetic collector)
      const playerPos = camera.position;
      for (let i = droppedItems.length - 1; i >= 0; i--) {
        const item = droppedItems[i];
        const m = item.mesh;
        
        item.velocity.y -= 9.8 * 0.016;
        item.velocity.x *= 0.95;
        item.velocity.z *= 0.95;
        
        m.position.addScaledVector(item.velocity, 0.016);
        
        const itemGroundY = getGroundHeightBelow(m.position.x, m.position.y, m.position.z) + 1.0;
        if (m.position.y < itemGroundY + 0.12) {
          m.position.y = itemGroundY + 0.12;
          item.velocity.set(0, 0, 0);
        }
        
        m.rotation.y += 0.04;
        m.position.y += Math.sin(performance.now() * 0.005) * 0.002;
        
        const distToPlayer = m.position.distanceTo(playerPos);
        if (distToPlayer < 2.5) {
          const dirToPlayer = new THREE.Vector3().subVectors(playerPos, m.position).normalize();
          m.position.addScaledVector(dirToPlayer, 0.12);
          
          if (distToPlayer < 0.75) {
            scene.remove(m);
            m.geometry.dispose();
            droppedItems.splice(i, 1);
            
            setInventory(prev => {
              const updated = [...prev];
              const idx = updated.findIndex(invItem => invItem && invItem.id === item.blockId && invItem.count < 64);
              if (idx !== -1) {
                updated[idx] = { id: item.blockId, count: updated[idx]!.count + 1 };
              } else {
                const emptyIdx = updated.findIndex(invItem => invItem === null);
                if (emptyIdx !== -1) updated[emptyIdx] = { id: item.blockId, count: 1 };
              }
              return updated;
            });
            if (stateRef.current.isSoundOn) playSynthSound('place');
            continue;
          }
        }
        
        if (performance.now() - item.spawnTime > 60000) {
          scene.remove(m);
          m.geometry.dispose();
          droppedItems.splice(i, 1);
        }
      }

      // Smoothly update remote players and cleanup stale ones (>15s)
      const nowMs = performance.now();
      Object.keys(remotePlayersRef.current).forEach(id => {
        const p = remotePlayersRef.current[id];
        if (nowMs - p.lastUpdate > 15000) {
          scene.remove(p.mesh);
          delete remotePlayersRef.current[id];
        } else {
          p.mesh.position.lerp(new THREE.Vector3(p.targetPos.x, p.targetPos.y - 1.1, p.targetPos.z), 0.1);
          let diff = p.targetYaw - p.mesh.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          p.mesh.rotation.y += diff * 0.1;
        }
      });

      // Shadow Box Tracking with realistic, slowly shifting sun positions (Voxel Shaders effect)
      const sunAngle = nowMs * 0.00005; // extremely smooth orbital motion
      const sunOffsetDir = new THREE.Vector3(
        Math.sin(sunAngle) * 15 + 15,
        40,
        Math.cos(sunAngle) * 15 + 10
      );
      dirLight.position.copy(camera.position).add(sunOffsetDir);
      dirLight.target.position.copy(camera.position);

      // Dynamic Cave Darkening engine: adjust ambient light and fog depending on player depth below ceiling height
      const pTileX = Math.floor(camera.position.x);
      const pTileZ = Math.floor(camera.position.z);
      const pTileY = camera.position.y;
      
      // Calculate ceiling height ignoring tree wood logs and leaves to prevent screen darkening under trees
      let ceilingY = 0;
      for (let y = 63; y >= 0; y--) {
        const b = getBlockAt(pTileX, y, pTileZ, stateRef.current.dimension, worldEditsRef.current);
        if (b > 0 && BLOCK_TYPES[b]?.isSolid) {
          const isTreeBlock = b === 6 || b === 7 || b === 35 || b === 36 || b === 61 || b === 62;
          if (!isTreeBlock) {
            ceilingY = y;
            break;
          }
        }
      }

      let caveDepthFactor = 1.0;
      if (pTileY < ceilingY) {
        // Player is inside a cave/shelter! Let's darken based on how deep we are below the ceiling
        caveDepthFactor = Math.max(0.04, 1.0 - (ceilingY - pTileY) * 0.45);
      }

      // Update lights in real-time
      ambientLight.intensity = 0.45 * caveDepthFactor;
      hemiLight.intensity = 0.7 * caveDepthFactor;
      
      // Also scale fog density and color to fade out to black/dark blue in caves
      const skyBaseColor = new THREE.Color(0x8cc3ff);
      const caveMinColor = new THREE.Color(0x050811);
      
      const r = Math.max(caveMinColor.r, skyBaseColor.r * caveDepthFactor);
      const g = Math.max(caveMinColor.g, skyBaseColor.g * caveDepthFactor);
      const bColor = Math.max(caveMinColor.b, skyBaseColor.b * caveDepthFactor);
      const activeColor = new THREE.Color(r, g, bColor);
      
      scene.background = activeColor;
      if (scene.fog) {
        scene.fog.color = activeColor;
        if ('near' in scene.fog && 'far' in scene.fog) {
          (scene.fog as THREE.Fog).near = 15 + 15 * caveDepthFactor;
          (scene.fog as THREE.Fog).far = 45 + 50 * caveDepthFactor;
        }
      }

      renderer.render(scene, camera);
    };

    tick();

    // Resize Handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // Absolute zero-leak resource cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('contextmenu', handleContextMenu);
      }

      // Cleanup multiplayer interval, channel, and meshes
      if (mpIntervalId) clearInterval(mpIntervalId);
      if (mpChannel) {
        try {
          mpChannel.unsubscribe();
        } catch (e) {}
      }
      Object.values(remotePlayersRef.current).forEach((p: any) => {
        scene.remove(p.mesh);
      });
      remotePlayersRef.current = {};

      // Dispose Geometries/Materials
      blockGeometry.dispose();
      Object.values(blockMaterials).forEach(mArray => {
        if (Array.isArray(mArray)) {
          mArray.forEach(m => m.dispose());
        }
      });
      chunksMap.forEach(g => {
        g.children.forEach(c => {
          if (c instanceof THREE.InstancedMesh) c.dispose();
        });
      });
      renderer.dispose();
    };
  }, [isPlaying, dimension, renderDistance, device, isMultiplayer, roomCode]);

  // Start Button Click
  const handleStartGame = () => {
    if (isSoundOn) playSynthSound('click');
    setIsPlaying(true);
  };

  const handleRespawn = () => {
    setHealth(100);
    setIsGameOver(false);
    if (isSoundOn) playSynthSound('portal');
  };

  // Inventory logic
  const handleCollectCraftOutput = () => {
    if (!craftResult) return;
    setInventory(prev => {
      const updated = [...prev];
      const emptyIdx = updated.findIndex(slot => slot === null);
      if (emptyIdx !== -1) {
        updated[emptyIdx] = { id: craftResult.id, count: craftResult.count };
        setCraftingGrid(Array(9).fill(null));
      }
      return updated;
    });
    if (isSoundOn) playSynthSound('click');
  };

  const handleCreativeBlockSelect = (blockId: number) => {
    setInventory(prev => {
      const updated = [...prev];
      updated[activeSlot] = { id: blockId, count: 64 };
      return updated;
    });
    if (isSoundOn) playSynthSound('click');
    setShowInventory(false);
  };

  // PC and WebOS setup layout overlay (isPlaying === false)
  if (!isPlaying) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[#111116] overflow-y-auto p-4 select-none text-white font-sans" id="nooncraft-setup-overlay">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="bg-[#1b1b1f]/95 backdrop-blur-md border border-white/10 rounded-2xl w-[480px] max-w-full p-6 shadow-2xl flex flex-col space-y-5 relative">
          
          <div className="text-center space-y-1.5 border-b border-white/5 pb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#76c035] to-[#5c9a24] rounded-lg flex items-center justify-center font-black text-xs shadow-md shadow-emerald-500/20">N</div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent font-mono">nooncraft 3D</h1>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">WebOS Voxel Sandbox Engine • v1.20.0</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Device Toggle */}
            <div className="space-y-2">
              <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">1. Device Interface</span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setDevice('pc'); if (isSoundOn) playSynthSound('click'); }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer h-20 flex flex-col justify-between ${
                    device === 'pc' ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/5' : 'bg-black/30 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold text-gray-200 block">💻 Desktop PC</span>
                  <span className="text-[9px] text-gray-400 leading-normal block">WASD keys + Mouse look pointer lock. Right click places.</span>
                </button>
                <button 
                  onClick={() => { setDevice('ipad'); if (isSoundOn) playSynthSound('click'); }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer h-20 flex flex-col justify-between ${
                    device === 'ipad' ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/5' : 'bg-black/30 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold text-gray-200 block">📱 iPad / Touch</span>
                  <span className="text-[9px] text-gray-400 leading-normal block">Visual D-pad and jumps. Swipe to look, tap to place or mine.</span>
                </button>
              </div>
            </div>

            {/* Mode Select */}
            <div className="space-y-2">
              <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">2. Game Mode</span>
              <div className="bg-emerald-600/10 border border-emerald-500 rounded-xl p-3 h-20 flex flex-col justify-between">
                <span className="font-bold text-emerald-400 block">🛡️ Survival Sandbox Mode (サバイバル専用)</span>
                <span className="text-[9px] text-gray-400 leading-normal block">Real health hearts, gravity, fall damage, resource gathering, and craft recipes are active.</span>
              </div>
            </div>

            {/* Multiplayer Select */}
            <div className="space-y-2">
              <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">3. Multiplayer Option</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsMultiplayer(false)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                    !isMultiplayer 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="font-bold text-white text-[11px] block">📴 Single Player</span>
                  <span className="text-[9px] text-gray-400 block leading-normal mt-1">Local world. No latency.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMultiplayer(true)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                    isMultiplayer 
                      ? 'bg-indigo-600/10 border-indigo-500' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="font-bold text-indigo-400 text-[11px] block">🌐 Multiplayer Co-op</span>
                  <span className="text-[9px] text-gray-400 block leading-normal mt-1">Real-time sync on Supabase!</span>
                </button>
              </div>
              {isMultiplayer && (
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] text-indigo-300 font-medium block">Room Code</span>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="Enter room code..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Performance Slider */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">Seed Parameter</span>
                <input 
                  type="number" 
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 1)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">Render Radius</span>
                  <span className="font-mono text-[9px] text-gray-400 font-bold">{renderDistance} Chunks</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="4" 
                  value={renderDistance}
                  onChange={(e) => setRenderDistance(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer mt-2" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase"
          >
            <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>Generate & Enter World</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111] overflow-hidden select-none font-sans text-white" id="nooncraft-app-root">
      
      {/* ─── WebGL Canvas Stage ─── */}
      <div className="relative w-full flex-1 min-h-0 bg-black" ref={containerRef}>
        <canvas className="w-full h-full block outline-none" ref={canvasRef} />

        {/* Reticle / Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 text-white/40 text-xl font-light font-mono select-none">
          +
        </div>

        {/* Debug F3 telemetry overlay */}
        <div className="absolute top-2 left-2 bg-black/60 text-emerald-400 p-2.5 rounded text-[9px] font-mono leading-relaxed space-y-0.5 pointer-events-none z-10">
          <p className="font-bold text-gray-200">nooncraft 3D v1.20</p>
          <p>FPS: <span className="font-bold">{fps}</span></p>
          <p>Chunks: <span className="font-bold text-white">{loadedChunkCount}</span> Loaded</p>
          <p>Dimension: <span className="font-bold text-amber-300 uppercase">{dimension}</span></p>
          <p>Device: <span className="font-bold capitalize">{device}</span></p>
          <p>Seed: <span className="font-bold text-gray-300">{seed}</span></p>
        </div>

        {/* Top-right menu controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button 
            onClick={() => { setIsSoundOn(!isSoundOn); playSynthSound('click'); }}
            className="p-1.5 bg-black/55 hover:bg-black/80 rounded border border-white/5 cursor-pointer text-gray-300 hover:text-white"
          >
            {isSoundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          <button 
            onClick={() => { setShowSettings(true); playSynthSound('click'); }}
            className="p-1.5 bg-black/55 hover:bg-black/80 rounded border border-white/5 cursor-pointer text-gray-300 hover:text-white"
          >
            <Settings size={13} />
          </button>
          <button 
            onClick={() => { setIsPlaying(false); playSynthSound('portal'); }}
            className="px-2.5 py-1 bg-red-600/85 hover:bg-red-600 rounded border border-red-500 cursor-pointer text-[9px] font-bold tracking-wide uppercase font-mono"
          >
            Quit
          </button>
        </div>

        {/* Survival Hearts Overlay */}
        {gameMode === 'survival' && (
          <div className="absolute bottom-4 left-4 bg-black/55 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 z-10 animate-fade-in">
            <Heart size={14} className="text-red-500 fill-red-500" />
            <div className="w-24 bg-red-950/40 h-2.5 rounded-full overflow-hidden border border-red-500/20">
              <div className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full transition-all duration-300" style={{ width: `${health}%` }} />
            </div>
            <span className="font-mono text-[10px] font-bold text-red-400">{health}/100</span>
          </div>
        )}

        {/* ─── MODULAR CONTROLS (iPad overlay action buttons only, as Move Pad and Look Pad are removed) ─── */}
        {device === 'ipad' && (
          <>
            {/* Tactical Jump and Action controls (Bottom-right) */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20 select-none">
              {/* Jump Button */}
              <button 
                onTouchStart={() => { inputsRef.current.jump = true; }}
                onTouchEnd={() => { inputsRef.current.jump = false; }}
                onTouchCancel={() => { inputsRef.current.jump = false; }}
                className="px-3.5 py-1.5 bg-blue-600/60 active:bg-blue-600 border border-blue-500 rounded font-mono font-black text-[10px] shadow-lg shadow-blue-500/20 select-none text-white uppercase"
              >
                JUMP
              </button>
              
              {/* Action Mode Button (Mine / Place) */}
              <button 
                onTouchStart={() => { 
                  const nextAction = ipadAction === 'break' ? 'place' : 'break';
                  inputsRef.current.ipadAction = nextAction;
                  setIpadAction(nextAction);
                  if (isSoundOn) playSynthSound('click');
                }}
                className={`px-3 py-1.5 rounded border font-bold text-[9px] tracking-wide shadow-lg uppercase select-none text-white ${
                  ipadAction === 'place' 
                    ? 'bg-amber-600/60 border-amber-500' 
                    : 'bg-indigo-600/60 border-indigo-500'
                }`}
              >
                <span>{ipadAction === 'place' ? '🔨 Place' : '⛏️ Mine'}</span>
              </button>
            </div>
          </>
        )}

        {/* ─── INVENTORY & CRAFTING OVERLAY (E) ─── */}
        {showInventory && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl w-[480px] max-w-full shadow-2xl flex flex-col">
              <div className="bg-[#17171a] px-4 py-3 border-b border-white/5 flex items-center justify-between font-bold text-xs">
                <span>Survival Inventory & Crafting Grid</span>
                <button onClick={() => { setShowInventory(false); playSynthSound('click'); }} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                  <X size={15} />
                </button>
              </div>

              {/* Survival Crafting list */}
              <div className="p-4 flex gap-4 text-xs">
                {/* Left side: Survival Guide */}
                <div className="flex-1 space-y-3 bg-[#131316] p-3 rounded-xl border border-white/5">
                  <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">🌲 Survival Guide</p>
                  <div className="text-[10px] text-gray-300 space-y-2 leading-relaxed">
                    <p>
                      <strong className="text-white">1. Mine Blocks:</strong> Press <kbd className="bg-white/10 px-1 rounded font-mono">Click/Tap</kbd> on logs, dirt, or stone to mine. Successfully broken blocks drop as items directly into your inventory.
                    </p>
                    <p>
                      <strong className="text-white">2. Inventory Limit:</strong> You can only place blocks you currently possess in your bottom quickbar.
                    </p>
                    <p>
                      <strong className="text-white">3. Basic Crafting:</strong>
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400 text-[9px]">
                      <li><strong className="text-gray-300">Wood Planks:</strong> 1 Oak Log in top-left grid</li>
                      <li><strong className="text-gray-300">Sticks:</strong> 2 Planks vertically in grid</li>
                      <li><strong className="text-gray-300">Wooden Pickaxe:</strong> 3 Planks (top row) + 2 Sticks (middle column)</li>
                      <li><strong className="text-gray-300">Stone Pickaxe:</strong> 3 Stone (top row) + 2 Sticks (middle column)</li>
                    </ul>
                  </div>
                </div>

                {/* Right Crafting Matrix */}
                <div className="w-[180px] bg-[#141416] p-3 rounded-lg border border-white/5 flex flex-col items-center space-y-2">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-gray-400">3x3 Crafting</span>
                      <button onClick={() => setCraftingGrid(Array(9).fill(null))} className="text-[8px] text-red-400 hover:underline">Clear</button>
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-[#0b0b0c] p-1.5 rounded">
                      {craftingGrid.map((blockId, i) => {
                        const b = blockId ? BLOCK_TYPES[blockId] : null;
                        return (
                          <div 
                            key={i}
                            onClick={() => {
                              const activeItem = inventory[activeSlot];
                              if (activeItem) {
                                const nextGrid = [...craftingGrid];
                                nextGrid[i] = activeItem.id;
                                setCraftingGrid(nextGrid);
                                if (isSoundOn) playSynthSound('click');
                              }
                            }}
                            className="w-9 h-9 bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] flex items-center justify-center cursor-pointer transition-all text-white/20 text-xs font-mono"
                          >
                            {b ? <VoxelCube id={blockId} size={16} /> : '+'}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-gray-500 font-bold text-[10px]">⬇</div>

                    <div 
                      onClick={handleCollectCraftOutput}
                      className={`w-12 h-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        craftResult 
                          ? 'bg-zinc-800 border-white border-[3px] ring-2 ring-black z-10' 
                          : 'bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px]'
                      }`}
                    >
                      {craftResult ? (
                        <>
                          <VoxelCube id={craftResult.id} size={22} />
                          <span className="text-[8px] font-mono mt-0.5 text-white">x{craftResult.count}</span>
                        </>
                      ) : <span className="text-[8px] text-gray-500">Output</span>}
                    </div>
                  </div>
                </div>

              {/* Bottom inventory selector */}
              <div className="bg-[#121214] px-4 py-4 border-t border-white/5">
                <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-2">Backpack Storage (Click slot to swap block)</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {inventory.map((item, idx) => {
                    const b = item ? BLOCK_TYPES[item.id] : null;
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setActiveSlot(idx % 9);
                          if (isSoundOn) playSynthSound('click');
                        }}
                        className={`w-10 h-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          idx === activeSlot 
                            ? 'bg-zinc-800 border-white border-[3px] ring-2 ring-black z-10' 
                            : 'bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px]'
                        }`}
                      >
                        {b ? (
                          <>
                            <VoxelCube id={item.id} size={18} />
                            <span className="text-[7px] font-mono text-white mt-0.5">{item.count}</span>
                          </>
                        ) : <span className="text-gray-500 text-[10px] font-mono">-</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#141416] p-2 flex justify-between text-[8px] text-gray-500 font-mono rounded-b-2xl">
                <span>Tip: Plank(15) crafts Stick(16). Sticks + Plank crafts Wooden Pickaxe(17)!</span>
                <span>Press E to exit</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHEST OVERLAY ─── */}
        {activeChestKey && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl w-[480px] max-w-full shadow-2xl flex flex-col">
              <div className="bg-[#17171a] px-4 py-3 border-b border-white/5 flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5 text-amber-500">📦 Chest Storage</span>
                <button onClick={() => { setActiveChestKey(null); playSynthSound('click'); }} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                  <X size={15} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Chest slots (27 grid) */}
                <div className="bg-black/35 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-2">Chest Contents (Click item to move to backpack)</span>
                  <div className="grid grid-cols-9 gap-1.5">
                    {(chestInventories[activeChestKey] || Array(27).fill(null)).map((item, idx) => {
                      const b = item ? BLOCK_TYPES[item.id] : null;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (!item) return;
                            // Move from chest to player inventory
                            setInventory(prevInv => {
                              const nextInv = [...prevInv];
                              // Find first empty slot or stackable slot
                              let placed = false;
                              for (let i = 0; i < nextInv.length; i++) {
                                if (nextInv[i] && nextInv[i]!.id === item.id && nextInv[i]!.count < 64) {
                                  nextInv[i] = { id: item.id, count: Math.min(64, nextInv[i]!.count + item.count) };
                                  placed = true;
                                  break;
                                }
                              }
                              if (!placed) {
                                for (let i = 0; i < nextInv.length; i++) {
                                  if (!nextInv[i]) {
                                    nextInv[i] = { ...item };
                                    placed = true;
                                    break;
                                  }
                                }
                              }
                              if (placed) {
                                // Remove from chest
                                setChestInventories(prevChests => {
                                  const nextChests = { ...prevChests };
                                  const chestGrid = [...(nextChests[activeChestKey] || Array(27).fill(null))];
                                  chestGrid[idx] = null;
                                  nextChests[activeChestKey] = chestGrid;
                                  return nextChests;
                                });
                                if (isSoundOn) playSynthSound('click');
                              }
                              return nextInv;
                            });
                          }}
                          className="w-10 h-10 bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all"
                        >
                          {b ? (
                            <>
                              <VoxelCube id={item!.id} size={18} />
                              <span className="text-[7px] font-mono text-white mt-0.5">{item!.count}</span>
                            </>
                          ) : <span className="text-gray-600 text-[10px] font-mono">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Player inventory (36 grid) */}
                <div className="bg-[#121214] p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-2">Your Backpack (Click item to move to chest)</span>
                  <div className="grid grid-cols-9 gap-1.5">
                    {inventory.map((item, idx) => {
                      const b = item ? BLOCK_TYPES[item.id] : null;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (!item) return;
                            // Move from player inventory to chest
                            setChestInventories(prevChests => {
                              const nextChests = { ...prevChests };
                              const chestGrid = [...(nextChests[activeChestKey] || Array(27).fill(null))];
                              
                              let placed = false;
                              for (let i = 0; i < chestGrid.length; i++) {
                                if (chestGrid[i] && chestGrid[i]!.id === item.id && chestGrid[i]!.count < 64) {
                                  chestGrid[i] = { id: item.id, count: Math.min(64, chestGrid[i]!.count + item.count) };
                                  placed = true;
                                  break;
                                }
                              }
                              if (!placed) {
                                for (let i = 0; i < chestGrid.length; i++) {
                                  if (!chestGrid[i]) {
                                    chestGrid[i] = { ...item };
                                    placed = true;
                                    break;
                                  }
                                }
                              }
                              if (placed) {
                                // Remove from inventory
                                setInventory(prevInv => {
                                  const nextInv = [...prevInv];
                                  nextInv[idx] = null;
                                  return nextInv;
                                });
                                if (isSoundOn) playSynthSound('click');
                              }
                              nextChests[activeChestKey] = chestGrid;
                              return nextChests;
                            });
                          }}
                          className={`w-10 h-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            idx === activeSlot 
                              ? 'bg-zinc-800 border-white border-[3px] ring-2 ring-black z-10' 
                              : 'bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] hover:border-indigo-400'
                          }`}
                        >
                          {b ? (
                            <>
                              <VoxelCube id={item!.id} size={18} />
                              <span className="text-[7px] font-mono text-white mt-0.5">{item!.count}</span>
                            </>
                          ) : <span className="text-gray-600 text-[10px] font-mono">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#141416] p-2 flex justify-between text-[8px] text-gray-500 font-mono rounded-b-2xl">
                <span>Tip: Click items to seamlessly transfer them between containers!</span>
                <span>Click X to close</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── FURNACE OVERLAY ─── */}
        {activeFurnaceKey && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl w-[440px] max-w-full shadow-2xl flex flex-col">
              <div className="bg-[#17171a] px-4 py-3 border-b border-white/5 flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5 text-orange-400">🔥 Smelting Furnace</span>
                <button onClick={() => { setActiveFurnaceKey(null); playSynthSound('click'); }} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                  <X size={15} />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* Furnace Interface Block */}
                <div className="bg-[#131315] p-4 rounded-xl border border-white/5 flex justify-between items-center relative">
                  {/* Left: Input & Fuel */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Input slot */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-gray-400 uppercase font-mono tracking-wider mb-1">Input</span>
                        <div className="w-12 h-12 bg-zinc-800 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] flex flex-col items-center justify-center rounded">
                          {furnaceStates[activeFurnaceKey]?.input ? (
                            <>
                              <VoxelCube id={furnaceStates[activeFurnaceKey].input!.id} size={20} />
                              <span className="text-[8px] font-mono text-white mt-0.5">x{furnaceStates[activeFurnaceKey].input!.count}</span>
                            </>
                          ) : <span className="text-gray-600 text-[10px] font-mono">-</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => {
                            const activeItem = inventory[activeSlot];
                            if (activeItem && SMELTING_RECIPES[activeItem.id]) {
                              setFurnaceStates(prev => {
                                const next = { ...prev };
                                const f = { ...next[activeFurnaceKey] };
                                
                                const currentCount = f.input?.id === activeItem.id ? f.input.count : 0;
                                f.input = { id: activeItem.id, count: Math.min(64, currentCount + 1) };
                                next[activeFurnaceKey] = f;
                                return next;
                              });
                              setInventory(prev => {
                                const next = [...prev];
                                if (next[activeSlot]) {
                                  const rem = next[activeSlot]!.count - 1;
                                  next[activeSlot] = rem > 0 ? { id: next[activeSlot]!.id, count: rem } : null;
                                }
                                return next;
                              });
                              if (isSoundOn) playSynthSound('click');
                            }
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[9px] font-bold border border-white/5 rounded cursor-pointer animate-pulse"
                        >
                          Load Active (+1)
                        </button>
                        <button 
                          onClick={() => {
                            const f = furnaceStates[activeFurnaceKey];
                            if (f?.input) {
                              setInventory(prev => {
                                const next = [...prev];
                                let placed = false;
                                for (let i = 0; i < next.length; i++) {
                                  if (next[i] && next[i]!.id === f.input!.id && next[i]!.count < 64) {
                                    next[i]!.count++;
                                    placed = true;
                                    break;
                                  }
                                }
                                if (!placed) {
                                  for (let i = 0; i < next.length; i++) {
                                    if (!next[i]) {
                                      next[i] = { id: f.input!.id, count: 1 };
                                      placed = true;
                                      break;
                                    }
                                  }
                                }
                                if (placed) {
                                  setFurnaceStates(prevFurnace => {
                                    const nextF = { ...prevFurnace };
                                    const curr = { ...nextF[activeFurnaceKey] };
                                    curr.input = { ...curr.input! };
                                    curr.input.count--;
                                    if (curr.input.count <= 0) curr.input = null;
                                    nextF[activeFurnaceKey] = curr;
                                    return nextF;
                                  });
                                  if (isSoundOn) playSynthSound('click');
                                }
                                return next;
                              });
                            }
                          }}
                          className="bg-red-950/50 hover:bg-red-900/60 text-red-300 px-2 py-1 text-[9px] font-bold border border-red-800/30 rounded cursor-pointer"
                        >
                          Take Back
                        </button>
                      </div>
                    </div>

                    {/* Fuel slot */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-gray-400 uppercase font-mono tracking-wider mb-1">Fuel</span>
                        <div className="w-12 h-12 bg-zinc-800 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] flex flex-col items-center justify-center rounded">
                          {furnaceStates[activeFurnaceKey]?.fuel ? (
                            <>
                              <VoxelCube id={furnaceStates[activeFurnaceKey].fuel!.id} size={20} />
                              <span className="text-[8px] font-mono text-white mt-0.5">x{furnaceStates[activeFurnaceKey].fuel!.count}</span>
                            </>
                          ) : <span className="text-gray-600 text-[10px] font-mono">-</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => {
                            const activeItem = inventory[activeSlot];
                            if (activeItem && FUEL_ITEMS.has(activeItem.id)) {
                              setFurnaceStates(prev => {
                                const next = { ...prev };
                                const f = { ...next[activeFurnaceKey] };
                                
                                const currentCount = f.fuel?.id === activeItem.id ? f.fuel.count : 0;
                                f.fuel = { id: activeItem.id, count: Math.min(64, currentCount + 1) };
                                next[activeFurnaceKey] = f;
                                return next;
                              });
                              setInventory(prev => {
                                const next = [...prev];
                                if (next[activeSlot]) {
                                  const rem = next[activeSlot]!.count - 1;
                                  next[activeSlot] = rem > 0 ? { id: next[activeSlot]!.id, count: rem } : null;
                                }
                                return next;
                              });
                              if (isSoundOn) playSynthSound('click');
                            }
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[9px] font-bold border border-white/5 rounded cursor-pointer"
                        >
                          Load Active (+1)
                        </button>
                        <button 
                          onClick={() => {
                            const f = furnaceStates[activeFurnaceKey];
                            if (f?.fuel) {
                              setInventory(prev => {
                                const next = [...prev];
                                let placed = false;
                                for (let i = 0; i < next.length; i++) {
                                  if (next[i] && next[i]!.id === f.fuel!.id && next[i]!.count < 64) {
                                    next[i]!.count++;
                                    placed = true;
                                    break;
                                  }
                                }
                                if (!placed) {
                                  for (let i = 0; i < next.length; i++) {
                                    if (!next[i]) {
                                      next[i] = { id: f.fuel!.id, count: 1 };
                                      placed = true;
                                      break;
                                    }
                                  }
                                }
                                if (placed) {
                                  setFurnaceStates(prevFurnace => {
                                    const nextF = { ...prevFurnace };
                                    const curr = { ...nextF[activeFurnaceKey] };
                                    curr.fuel = { ...curr.fuel! };
                                    curr.fuel.count--;
                                    if (curr.fuel.count <= 0) curr.fuel = null;
                                    nextF[activeFurnaceKey] = curr;
                                    return nextF;
                                  });
                                  if (isSoundOn) playSynthSound('click');
                                }
                                return next;
                              });
                            }
                          }}
                          className="bg-red-950/50 hover:bg-red-900/60 text-red-300 px-2 py-1 text-[9px] font-bold border border-red-800/30 rounded cursor-pointer"
                        >
                          Take Back
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress arrow & animation */}
                  <div className="flex flex-col items-center flex-1 mx-4 space-y-2">
                    <div className="text-xl animate-pulse">
                      {(furnaceStates[activeFurnaceKey]?.progress || 0) > 0 ? '🔥' : '⚫'}
                    </div>
                    <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-white/5 relative">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${furnaceStates[activeFurnaceKey]?.progress || 0}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-white/70 font-bold">
                        {furnaceStates[activeFurnaceKey]?.progress || 0}%
                      </span>
                    </div>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-mono">Smelting</span>
                  </div>

                  {/* Right: Output */}
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-emerald-400 uppercase font-mono tracking-wider mb-1 font-bold">Output</span>
                    <div className="w-16 h-16 bg-zinc-800/90 border-white border-[3px] ring-2 ring-black flex flex-col items-center justify-center rounded">
                      {furnaceStates[activeFurnaceKey]?.output ? (
                        <>
                          <VoxelCube id={furnaceStates[activeFurnaceKey].output!.id} size={24} />
                          <span className="text-[9px] font-mono text-emerald-300 font-bold mt-1">x{furnaceStates[activeFurnaceKey].output!.count}</span>
                        </>
                      ) : <span className="text-gray-500 text-[9px] font-mono">Empty</span>}
                    </div>
                    {furnaceStates[activeFurnaceKey]?.output && (
                      <button 
                        onClick={() => {
                          const f = furnaceStates[activeFurnaceKey];
                          if (f?.output) {
                            setInventory(prev => {
                              const next = [...prev];
                              let placed = false;
                              for (let i = 0; i < next.length; i++) {
                                if (next[i] && next[i]!.id === f.output!.id && next[i]!.count < 64) {
                                  next[i]!.count += f.output!.count;
                                  placed = true;
                                  break;
                                }
                              }
                              if (!placed) {
                                for (let i = 0; i < next.length; i++) {
                                  if (!next[i]) {
                                    next[i] = { ...f.output! };
                                    placed = true;
                                    break;
                                  }
                                }
                              }
                              if (placed) {
                                setFurnaceStates(prevFurnace => {
                                  const nextF = { ...prevFurnace };
                                  const curr = { ...nextF[activeFurnaceKey] };
                                  curr.output = null;
                                  nextF[activeFurnaceKey] = curr;
                                  return nextF;
                                });
                                if (isSoundOn) playSynthSound('portal');
                              }
                              return next;
                            });
                          }
                        }}
                        className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 text-[10px] rounded cursor-pointer shadow border border-emerald-400/20 uppercase tracking-wider"
                      >
                        Collect
                      </button>
                    )}
                  </div>
                </div>

                {/* Player active hotbar slot info */}
                <div className="bg-[#101012] p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase tracking-wide block mb-1">Active Slot block</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-zinc-800 border border-white/10 rounded flex items-center justify-center">
                        {inventory[activeSlot] ? <VoxelCube id={inventory[activeSlot]!.id} size={16} /> : <span className="text-gray-600 font-mono text-[9px]">-</span>}
                      </div>
                      <span className="font-bold text-gray-300">{inventory[activeSlot] ? BLOCK_TYPES[inventory[activeSlot]!.id]?.displayName : 'Empty Slot'}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-right text-gray-400 leading-normal max-w-[180px]">
                    <span className="text-[10px] text-amber-400 font-bold">Recipes:</span>
                    <ul className="list-disc list-inside text-gray-400 text-[8px] mt-0.5 text-left">
                      <li>Cobblestone (49) ➔ Stone (3)</li>
                      <li>Sand (4) ➔ Glass (50)</li>
                      <li>Iron Ore (39) ➔ Raw Iron Block (51)</li>
                      <li>Gold Ore (41) ➔ Raw Gold Block (52)</li>
                    </ul>
                  </div>
                </div>

                {/* Player Backpack for context */}
                <div className="bg-[#121214] p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-2">Backpack Storage (Swap hotbar items to load)</span>
                  <div className="grid grid-cols-9 gap-1.5">
                    {inventory.map((item, idx) => {
                      const b = item ? BLOCK_TYPES[item.id] : null;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveSlot(idx % 9);
                            if (isSoundOn) playSynthSound('click');
                          }}
                          className={`w-10 h-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            idx === activeSlot 
                              ? 'bg-zinc-800 border-white border-[3px] ring-2 ring-black z-10' 
                              : 'bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px] hover:border-orange-400'
                          }`}
                        >
                          {b ? (
                            <>
                              <VoxelCube id={item!.id} size={18} />
                              <span className="text-[7px] font-mono text-white mt-0.5">{item!.count}</span>
                            </>
                          ) : <span className="text-gray-600 text-[10px] font-mono">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#141416] p-2 flex justify-between text-[8px] text-gray-500 font-mono rounded-b-2xl">
                <span>Tip: Active hotbar blocks are loaded into Input or Fuel!</span>
                <span>Click X to close</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTINGS & SAVE MODAL ─── */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-[#1c1c1f] border border-white/10 rounded-2xl w-80 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-300">Settings</span>
                <button onClick={() => { setShowSettings(false); playSynthSound('click'); }} className="text-gray-400 hover:text-white cursor-pointer"><X size={15} /></button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Audio Switch */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sound Effects</span>
                  <button 
                    onClick={() => { setIsSoundOn(!isSoundOn); playSynthSound('click'); }}
                    className={`px-3 py-1.5 rounded border capitalize text-[10px] font-mono font-bold ${
                      isSoundOn ? 'bg-emerald-600 border-emerald-500' : 'bg-black/40 border-white/5'
                    }`}
                  >
                    {isSoundOn ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Camera Sensitivity Slider */}
                <div className="space-y-1.5 bg-black/25 p-2 rounded-lg border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Camera Sensitivity</span>
                    <span className="font-mono text-blue-400 font-bold">{sensitivity.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="3.0" 
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSensitivity(val);
                    }}
                    className="w-full accent-blue-500 cursor-pointer" 
                  />
                </div>

                {/* Dimension Info - Overworld-only */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dimension</span>
                  <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-950/40 px-2 py-1 rounded border border-blue-900/30 uppercase">Overworld Only</span>
                </div>

                {/* Save state */}
                <button 
                  onClick={() => {
                    try {
                      localStorage.setItem(`nooncraft_world_edits_${seed}`, JSON.stringify(worldEdits));
                      localStorage.setItem(`nooncraft_inventory_${seed}`, JSON.stringify(inventory));
                      setShowSavedToast(true);
                      setTimeout(() => setShowSavedToast(false), 2000);
                      playSynthSound('portal');
                    } catch (e) {
                      // ignore localstorage errors
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  Save World & Inventory
                </button>

                {/* Reset current edits */}
                <button 
                  onClick={() => {
                    if (window.confirm('Clear all custom placed/broken block modifications?')) {
                      setWorldEdits({});
                      setShowSettings(false);
                      playSynthSound('break');
                    }
                  }}
                  className="w-full bg-red-600/20 border border-red-500/20 hover:bg-red-600/35 text-red-400 font-bold py-2 rounded-lg text-xs"
                >
                  Reset World Modifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Toast */}
        {showSavedToast && (
          <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md border border-emerald-500 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 z-50 text-xs font-bold tracking-wide animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>Saved successfully!</span>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 text-center space-y-5 animate-fade-in">
            <h1 className="text-4xl font-extrabold text-red-500 tracking-wider uppercase font-mono animate-bounce">YOU DIED!</h1>
            <p className="text-gray-300 text-xs max-w-xs leading-normal">Fall damage is ruthless. Respawn to start exploring again!</p>
            <button onClick={handleRespawn} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase rounded-full shadow-lg shadow-red-600/25 transition-all">
              Respawn
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM QUICKBAR HUDS STRIP ─── */}
      {!showInventory && (
        <div className="bg-[#121214] border-t border-black p-2 flex items-center justify-center gap-2 shrink-0 select-none z-20">
          {/* Inventory bag trigger */}
          <button 
            onClick={() => { setShowInventory(true); playSynthSound('click'); }}
            className="w-10 h-10 bg-[#252528] hover:bg-[#34343a] border border-white/10 rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-90 relative"
            title="Open Crafting & Inventory (E)"
          >
            <ShoppingBag size={15} className="text-blue-400" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-[7px] text-white font-bold rounded-full flex items-center justify-center">E</span>
          </button>

          {/* Quick bar slot selectors */}
          <div className="flex gap-1.5 bg-[#1a1a1c] p-1.5 rounded-xl border border-white/5">
            {inventory.slice(0, 9).map((item, idx) => {
              const b = item ? BLOCK_TYPES[item.id] : null;
              return (
                <button 
                  key={idx}
                  onClick={() => { setActiveSlot(idx); playSynthSound('click'); }}
                  className={`w-10 h-10 flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                    idx === activeSlot 
                      ? 'bg-zinc-800 border-white border-[3px] ring-2 ring-black z-10' 
                      : 'bg-zinc-800/90 border-t-zinc-600 border-l-zinc-600 border-b-zinc-950 border-r-zinc-950 border-[3px]'
                  }`}
                  title={b ? b.displayName : "Empty Slot"}
                >
                  {b ? (
                    <>
                      <VoxelCube id={item.id} size={20} />
                      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold font-mono text-white">{item.count}</span>
                    </>
                  ) : <span className="text-[12px] text-white/5 font-mono">-</span>}
                  <span className="absolute top-0.5 left-1 text-[7px] font-bold text-white/10 font-mono leading-none">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
