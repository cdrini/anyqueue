export interface Song {
    artist: string;
    title: string;
    link?: string; // Only null if not supported link
    album?: string;
    recommender?: string;
    notes?: string;
    
    extra_links?: string[];
    unavailable?: boolean;
    warnings?: string[];
    oembed?: Oembed;
}

export interface QueueProvider {
    name: string;
    extract(url: string, opts: any): Promise<Song[]>;
}
