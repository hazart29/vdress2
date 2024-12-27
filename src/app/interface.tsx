import { UUID } from "crypto";

export interface Users {
    uid: UUID;
    username: string;
    password: string;
    email: string;
    name: string;
    create_at: Date;
    inventory: Inventory[];
    user_resources: User_resources[];
    suited: Suited[];
}

export interface User_resources {
    id: number;
    uid: UUID;
    chic_coins: number;
    glamour_gems: number;
    glamour_dust: number;
    fashion_tokens: number;
    shimmering_essence: number;
    glimmering_essence: number;
    pity: number;
    is_rate: boolean;
    neonite: number;
    chromite: number;
}

export interface Suited {
    id: number;
    uid: UUID;
    a: string;
    b: string;
    c: string;
}

export interface GachaItem {
    id: number;
    rarity: string;
    item_name: string;
    part_outfit: string;
    rate_up: boolean;
    islimited: boolean;
    layer: string;
    stat: Stat;
    power: number;
}

interface Stat {
    attack?: number;
    defense?: number;
    magic?: number;
    speed?: number;
}

export interface Inventory {
    id: number;
    uid: UUID;
    rarity: string;
    item_name: string;
    part_outfit: string;
    layer: string;
    created_at: string;
    stat: Stat;
    power: number;
}

export interface HistoryGachaA {
    id: number;
    uid: UUID;
    rarity: string;
    item_name: string;
    part_outfit: string;
    gacha_type: string;
    gacha_time: string;
}

export interface Products {
    id: number;
    name: string;
    price: number;
    glamour_gems: number;
}

export interface TokenItems {
    limit: number;
    id: number;
    name: string;
    description: string;
    price: number;
}

export interface DustItems {
    limit: number;
    id: number;
    name: string;
    description: string;
    price: number;
}

export interface UserTokenLimit {
    id: number;
    uid: UUID;
    item_id: number;
    limit: number | null;
    initial_limit: number | null;
}

export interface UserDustLimit {
    id: number;
    uid: UUID;
    item_id: number;
    limit: number | null;
    initial_limit: number | null;
}