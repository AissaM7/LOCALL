export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    bio: string | null
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    bio?: string | null
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    bio?: string | null
                }
            }
            events: {
                Row: {
                    id: string
                    created_at: string
                    creator_id: string
                    title: string
                    description: string | null
                    coordinates: { x: number; y: number } // Mapped from Postgres point
                    full_address: string | null
                    category: 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee' | null
                    start_time: string
                    end_time: string | null
                    header_image_url: string | null
                    font_style: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    creator_id: string
                    title: string
                    description?: string | null
                    coordinates: { x: number; y: number }
                    full_address?: string | null
                    category?: 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee' | null
                    start_time: string
                    end_time?: string | null
                    header_image_url?: string | null
                    font_style?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    creator_id?: string
                    title?: string
                    description?: string | null
                    coordinates?: { x: number; y: number }
                    full_address?: string | null
                    category?: 'party' | 'music' | 'food' | 'shop' | 'art' | 'coffee' | null
                    start_time?: string
                    end_time?: string | null
                    header_image_url?: string | null
                    font_style?: string | null
                }
            }
            rsvps: {
                Row: {
                    id: string
                    created_at: string
                    event_id: string
                    user_id: string
                    status: 'going' | 'maybe' | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    event_id: string
                    user_id: string
                    status?: 'going' | 'maybe' | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    event_id?: string
                    user_id?: string
                    status?: 'going' | 'maybe' | null
                }
            }
            messages: {
                Row: {
                    id: string
                    created_at: string
                    event_id: string
                    user_id: string
                    content: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    event_id: string
                    user_id: string
                    content: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    event_id?: string
                    user_id?: string
                    content?: string
                }
            }
        }
    }
}
